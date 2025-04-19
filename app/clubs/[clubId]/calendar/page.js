'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, ChevronLeft, Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '../../../src/components/ui/card';
import { Button } from '../../../src/components/ui/button';
import { Input } from '../../../src/components/ui/input';
import { Textarea } from '../../../src/components/ui/textarea';
import { Baloo_2 } from 'next/font/google';
import { useParams, useRouter } from 'next/navigation';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { notifyAllClubMembers } from '../../../utils/notifications';
import { Popover, PopoverContent, PopoverTrigger } from '../../../src/components/ui/popover';
import { Calendar as DatePicker } from '../../../src/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../src/components/ui/select';

import supabase from '../../../supabaseClient';

const header2Font = Baloo_2({ weight: ['800'], subsets: ['latin'] });
const localizer = momentLocalizer(moment);
const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const minutes = ['00', '15', '30', '45'];
const amPm = ['AM', 'PM'];

const CalendarPage = () => {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId;
  const [newEvent, setNewEvent] = useState({
    title: '',
    startDate: null,
    startHour: '12',
    startMinute: '00',
    startAmPm: 'PM',
    endDate: null,
    endHour: '1',
    endMinute: '00',
    endAmPm: 'PM'
  });


  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  const [events, setEvents] = useState([]);
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false);
  const [user, setUser] = useState(null);
  const [url, setUrl] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [clubData, setClubData] = useState(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const {
        data: authData,
        error: authError
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('Error getting auth user:', authError);
        return;
      }

      if (authData.user) {
        setUser(authData.user);

        // Fetch club data including URL
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', clubId)
          .single();

        if (clubError) {
          console.error('Error fetching club data:', clubError);
          return;
        }
        debugger
        setClubData(clubData);
        setUrl(clubData.url || '');
        setIsHost(authData.user.id === clubData.owner_id);

        // Fetch events specific to this club
        const { data: eventData, error: eventError } = await supabase
          .from('event')
          .select('*')
          .eq('club_id', clubId);

        if (eventError) {
          console.error('Error fetching events:', eventError);
          return;
        }

        setEvents(convertToEventModel(eventData));
      }
    }

    fetchData();
  }, [clubId]);

  const convertToEventModel = (events) => {
    return events.map(e => ({
      id: e.id,
      title: e.title,
      start: new Date(e.start_date),
      end: new Date(e.end_date)
    }));
  };

  const handleSaveUrl = async () => {
    if (!clubData) return;
    const oldUrl = clubData.url;

    const { data, error } = await supabase
      .from('clubs')
      .update({ url: url })
      .eq('id', clubId)
      .select()
      .single();

    if (error) {
      console.error('Error updating club URL:', error);
      return;
    }

    setClubData(data);
    setIsEditMode(false);

    if (oldUrl !== url) {
      await notifyAllClubMembers(
        clubId,
        'Meeting URL Updated',
        `${clubData.name}: The club meeting URL has been changed to: ${url}`,
        'url_changed'
      );
    }
  };


  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.startDate || !newEvent.endDate) return;

    // Convert 12-hour time to 24-hour format
    const startHours24 = newEvent.startAmPm === 'PM'
      ? parseInt(newEvent.startHour) % 12 + 12
      : parseInt(newEvent.startHour) % 12;
    const endHours24 = newEvent.endAmPm === 'PM'
      ? parseInt(newEvent.endHour) % 12 + 12
      : parseInt(newEvent.endHour) % 12;

    // Create Date objects with the selected dates and times
    const startDateTime = new Date(newEvent.startDate);
    startDateTime.setHours(startHours24, parseInt(newEvent.startMinute));

    const endDateTime = new Date(newEvent.endDate);
    endDateTime.setHours(endHours24, parseInt(newEvent.endMinute));

    const { data, error } = await supabase
      .from('event')
      .insert([{
        title: newEvent.title,
        start_date: startDateTime,
        end_date: endDateTime,
        user_id: user.id,
        club_id: clubId
      }])
      .select();

    if (error) {
      console.error('Error adding event:', error);
      return;
    }

    const addedEvent = data[0];
    setEvents([...events, {
      id: addedEvent.id,
      title: addedEvent.title,
      start: new Date(addedEvent.start_date),
      end: new Date(addedEvent.end_date)
    }]);

    // Send notifications
    await notifyAllClubMembers(
      clubId,
      'New Calendar Event',
      `${clubData.name}: "${newEvent.title}" scheduled for ${moment(startDateTime).format('MMMM Do YYYY, h:mm A')}`,
      'event_created'
    );

    // Reset form
    setNewEvent({
      title: '',
      startDate: null,
      startTime: '',
      endDate: null,
      endTime: ''
    });

    setShowCreateEventDialog(false);
  };

  const handleDeleteEvent = async (event) => {
    await notifyAllClubMembers(
      clubId,
      'Event Canceled',
      `${clubData.name}: "${event.title}" was cancelled!`,  // Changed from newEvent.title to event.title
      'event_cancelled'  // Changed type to be more specific
    );

    const { error } = await supabase
      .from('event')
      .delete()
      .eq('id', event.id);

    if (error) {
      console.error('Error deleting event:', error);
      return;
    }

    setEvents(events.filter(e => e.id !== event.id));
    setShowEventDetailsDialog(false);
  };

  const EventCreationDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Event</h2>
          <button
            onClick={() => setShowCreateEventDialog(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Event Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Event Title</label>
            <Input
              value={newEvent.title || ""}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              autoFocus
            />
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date Picker */}
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newEvent.startDate
                      ? moment(newEvent.startDate).format('MMM DD, YYYY')
                      : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[110]">
                  <DatePicker
                    mode="single"
                    selected={newEvent.startDate}
                    onSelect={(date) => setNewEvent({ ...newEvent, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Start Time */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Hour</label>
                <Select
                  value={newEvent.startHour}
                  onValueChange={(value) => setNewEvent({ ...newEvent, startHour: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    {hours.map((hour) => (
                      <SelectItem key={`start-hour-${hour}`} value={hour.toString()}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Minute</label>
                <Select
                  value={newEvent.startMinute}
                  onValueChange={(value) => setNewEvent({ ...newEvent, startMinute: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    {minutes.map((minute) => (
                      <SelectItem key={`start-minute-${minute}`} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">AM/PM</label>
                <Select
                  value={newEvent.startAmPm}
                  onValueChange={(value) => setNewEvent({ ...newEvent, startAmPm: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    {amPm.map((period) => (
                      <SelectItem key={`start-period-${period}`} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            {/* End Date Picker */}
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newEvent.endDate
                      ? moment(newEvent.endDate).format('MMM DD, YYYY')
                      : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[110]">
                  <DatePicker
                    mode="single"
                    selected={newEvent.endDate}
                    onSelect={(date) => setNewEvent({ ...newEvent, endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Time */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Hour</label>
                <Select
                  value={newEvent.endHour}
                  onValueChange={(value) => setNewEvent({ ...newEvent, endHour: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    {hours.map((hour) => (
                      <SelectItem key={`end-hour-${hour}`} value={hour.toString()}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Minute</label>
                <Select
                  value={newEvent.endMinute}
                  onValueChange={(value) => setNewEvent({ ...newEvent, endMinute: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    {minutes.map((minute) => (
                      <SelectItem key={`end-minute-${minute}`} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">AM/PM</label>
                <Select
                  value={newEvent.endAmPm}
                  onValueChange={(value) => setNewEvent({ ...newEvent, endAmPm: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    {amPm.map((period) => (
                      <SelectItem key={`end-period-${period}`} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setShowCreateEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent} disabled={!newEvent.title || !newEvent.startDate}>
              Add Event
            </Button>
          </div>
        </div>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <section>
        <ul className="h-full w-64 bg-red-200 text-white rounded-3xl p-4 fixed left-5 top-48">
          <div className="flex justify-center items-center flex-wrap space-y-8 p-6">
            <button onClick={() => router.push('/landing')} className={`relative group px-2 py-2 rounded-lg bg-transparent text-gray-500 font-medium overflow-hidden bottom-5 ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-2xl tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Home</span>
            </button>
            <button onClick={() => router.push(`/clubs/${clubId}/reviews`)} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Book Reviews</span>
            </button>
            <button onClick={() => router.push(`/clubs/${clubId}/discussions`)} className={`relative group w-full px-4 py-2 rounded-lg  bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Discussions</span>
            </button>
            <button onClick={() => router.push(`/clubs/${clubId}/members`)} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Members</span>
            </button>
            <button onClick={() => router.push(`/clubs/${clubId}/calendar`)} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Calendar</span>
            </button>
            <button onClick={() => router.push(`/clubs/${clubId}/settings`)} className={`relative group w-full px-4 py-2 text-white font-medium overflow-hidden top-28 ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Settings</span>
            </button>
          </div>
        </ul>
      </section>

      <div className="ml-72 p-8 w-full">
        <h1 className={`text-3xl font-bold text-black mb-8 flex items-center gap-2 ${header2Font.className}`}>
          Calendar
        </h1>

        {/* URL Input Section*/}
        <div className="space-y-3">
          <div className={`${header2Font.className}`}>
            <label className="block text-xl font-medium mb-1">Club URL</label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a valid URL for this club"
              readOnly={!isEditMode}
              className={`${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
          <div className="flex justify-end gap-1">
            <Button
              variant="outline"
              onClick={() => { !isEditMode ? setIsEditMode(!isEditMode) : handleSaveUrl() }}
              className={`bg-red-200 hover:bg-gray-200 text-black mb-4 ${header2Font.className}`}
            >
              {isEditMode ? 'Save' : 'Edit'}
            </Button>
          </div>
        </div>

        <Card className={`shadow-lg border bg-white rounded-2xl p-4 ${header2Font.className}`}>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-black">
                {moment().format('MMMM YYYY')}
              </h2>
            </div>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView="month"
              views={['month']}
              toolbar={false}
              date={new Date()}
              style={{ height: 600 }}
              className="rounded-lg text-black bg-white"
              onSelectEvent={(event) => {
                setSelectedEvent(event);
                setShowEventDetailsDialog(true);
              }}
              eventPropGetter={() => ({
                style: {
                  backgroundColor: '#6B7280',
                  fontSize: '0.75rem',
                  padding: '2px 4px',
                  height: '1.5rem',
                  borderRadius: '0.375rem',
                  color: 'white',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                },
              })}
            />
          </CardContent>
        </Card>

        {
          isHost && (
            <button
              onClick={() => setShowCreateEventDialog(true)}
              className="fixed bottom-8 right-8 w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors">
              <Plus size={32} />
            </button>
          )
        }
        {showCreateEventDialog && <EventCreationDialog />}
        {showEventDetailsDialog && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[101]">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Event Details</h2>
                <button onClick={() => setShowEventDetailsDialog(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-800">
                <p><strong>Title:</strong> {selectedEvent.title}</p>
                <p><strong>Start:</strong> {moment(selectedEvent.start).format('MMMM Do YYYY, h:mm A')}</p>
                <p><strong>End:</strong> {moment(selectedEvent.end).format('MMMM Do YYYY, h:mm A')}</p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowEventDetailsDialog(false)}>Close</Button>
                <Button
                  className="bg-red-200 hover:bg-red-300 text-black"
                  onClick={() => handleDeleteEvent(selectedEvent)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;