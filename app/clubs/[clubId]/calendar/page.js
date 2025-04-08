'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, ChevronLeft, Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '../../../src/components/ui/card';
import { Button } from '../../../src/components/ui/button';
import { Input } from '../../../src/components/ui/input';
import { Textarea } from '../../../src/components/ui/textarea';
import { Baloo_2 } from 'next/font/google';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import supabase from '../../../supabaseClient';

const header2Font = Baloo_2({ weight: ['800'], subsets: ['latin'] });
const localizer = momentLocalizer(moment);

const CalendarPage = () => {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId;

  const [newEvent, setNewEvent] = useState({
    title: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });




  const [events, setEvents] = useState([]);
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false);
  const [user, setUser] = useState(null);
  const [url, setUrl] = useState('');
  const [isEditMode, setIsEditMode] = useState(false)
  const [profileData, setProfileData] = useState(null)

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
        console.log('Auth user:', authData.user);

        const {
          data: userData,
          error: userError
        } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user from table:', userError);
          return;
        }

        console.log('User from table:', userData);
        setProfileData(userData)
        setUrl(userData.club_url ? userData.club_url  : "")

        const {
          data: eventData,
          error: eventError
        } = await supabase
          .from('event')
          .select('*')
          .eq('user_id', authData.user.id)

        if (eventError) {
          console.error('Error fetching user from table:', eventError);
          return;
        }

        console.log('User from table:', eventData);
        setEvents(convertToEventModel(eventData))
        setUser(authData.user)
      }
    }

    fetchData();
  }, []);

  const convertToEventModel = (events) => {
    return events.map(e => ({
      title: e.title,
      start: e.start_date,
      end: e.end_date
    }));
  };

  const handleSaveUrl = async () => {
    const { data, error: profileError } = await supabase
      .from('profiles') // Table name
      .update({
        club_url: url
      })
      .eq('id', profileData.id)
      .select()
      .single()

      setIsEditMode(!isEditMode)

  }

  const handleAddEvent = async () => {
    console.log('Checking newEvent before insert:', newEvent);
    // Validate that all required fields are filled
    if (
      !newEvent.title ||
      !newEvent.startDate || !newEvent.startTime ||
      !newEvent.endDate || !newEvent.endTime
    ) return;

    // Combine the date and time manually
    const startDateTimeString = `${newEvent.startDate} ${newEvent.startTime}`;
    const endDateTimeString = `${newEvent.endDate} ${newEvent.endTime}`;

    // Create date objects from the combined date-time strings
    const startDateTime = new Date(startDateTimeString);
    const endDateTime = new Date(endDateTimeString);

    // Add the event
    setEvents([...events, { title: newEvent.title, start: startDateTime, end: endDateTime }]);

    // Reset the form
    setNewEvent({
      title: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: ''
    });

    const { error } = await supabase
      .from('event')
      .insert([
        {
          title: newEvent.title,
          start_date: startDateTime,
          end_date: endDateTime,
          user_id: user.id
        }
      ]);


    // Close the dialog
    setShowCreateEventDialog(false);
  };

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
            <label className="block text-xl font-medium mb-1">URL</label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a valid URL"
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
                  backgroundColor: '#6B7280', // lighter soft dark gray
                  fontSize: '0.75rem',        // smaller text (Tailwind's text-sm)
                  padding: '2px 4px',         // tighter padding
                  height: '1.5rem',           // reduce height
                  borderRadius: '0.375rem',   // Tailwind's rounded-md
                  color: 'white',             // make sure it's readable
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                },
              })}
            />
          </CardContent>
        </Card>

        <button
          onClick={() => setShowCreateEventDialog(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors">
          <Plus size={32} />
        </button>

        {showCreateEventDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Event</h2>
                <button onClick={() => setShowCreateEventDialog(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Event Title</label>
                  <Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                </div>

                {/* Start Date and Time */}
                <div className="flex gap-4">
                  {/* Start Date */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <Input
                      type="text"
                      placeholder="MM/DD/YYYY"
                      value={newEvent.startDate}
                      onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    />
                  </div>

                  {/* Start Time */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <Input
                      type="text"
                      placeholder="HH:mm AM/PM"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* End Date and Time */}
                <div className="flex gap-4 mt-4">
                  {/* End Date */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <Input
                      type="text"
                      placeholder="MM/DD/YYYY"
                      value={newEvent.endDate}
                      onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    />
                  </div>

                  {/* End Time */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <Input
                      type="text"
                      placeholder="HH:mm AM/PM"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>


                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateEventDialog(false)}>Cancel</Button>
                  <Button onClick={handleAddEvent} className="bg-red-200 hover:bg-gray-200 text-black">
                    Add Event
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADDED: Event Detail Dialog */}
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
                  onClick={() => {
                    setEvents(events.filter(e => e !== selectedEvent));
                    setShowEventDetailsDialog(false);
                  }}
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