'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BookOpen, PlusCircle, LockKeyhole, Star, Check } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../src/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../src/components/ui/tabs';
import { Card, CardContent } from '../src/components/ui/card';
import { Button } from '../src/components/ui/button';
import { Input } from '../src/components/ui/input';
import { Textarea } from '../src/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../src/components/ui/dialog';
import supabase from '../supabaseClient';
import moment from 'moment';

export default function BookClubsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [clubs, setClubs] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [user, setUser] = useState(null);
  const [latestDiscussions, setLatestDiscussions] = useState({});
  const [showReadNotifications, setShowReadNotifications] = useState(false);
  const [clubDeletedMessage, setClubDeletedMessage] = useState('');
  const [showLeftModal, setShowLeftModal] = useState(false);
const [leftMessage, setLeftMessage] = useState('');

useEffect(() => {
  const deletedMsg = localStorage.getItem('clubDeletedMessage');
  if (deletedMsg) {
    setClubDeletedMessage(deletedMsg);
    localStorage.removeItem('clubDeletedMessage');
  }
}, []);

useEffect(() => {
  const message = localStorage.getItem('clubLeftMessage');
  if (message) {
    setLeftMessage(message);
    setShowLeftModal(true);
    localStorage.removeItem('clubLeftMessage');
  }
}, []);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.email
      });

      const fetchNotifications = async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        setNotifications(data || []);
        setUnreadCount(data.filter(n => !n.is_read).length);
      };

      const setupRealtime = () => {
        return supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setNotifications(prev => [payload.new, ...prev]);
                setUnreadCount(prev => prev + 1);
              }
            }
          )
          .subscribe();
      };

      const [clubsRes] = await Promise.all([
        supabase
          .from('club_members')
          .select('club:clubs(*)')
          .eq('user_id', user.id),
        fetchNotifications()
      ]);

      const subscription = setupRealtime();

      const clubIds = clubsRes.data?.map(m => m.club.id) || [];

      const { data: allMembers, error: membersError } = await supabase
        .from('club_members')
        .select('club_id')
        .in('club_id', clubIds);

      if (membersError) throw membersError;

      const memberCounts = allMembers.reduce((acc, { club_id }) => {
        acc[club_id] = (acc[club_id] || 0) + 1;
        return acc;
      }, {});

      // ✅ Remove duplicate clubs by ID
      const uniqueClubsMap = new Map();
      (clubsRes.data || []).forEach(m => {
        if (!uniqueClubsMap.has(m.club.id)) {
          uniqueClubsMap.set(m.club.id, {
            ...m.club,
            member_count: memberCounts[m.club.id] || 0
          });
        }
      });
      const userClubs = Array.from(uniqueClubsMap.values());
      setClubs(userClubs);

      // ✅ Latest discussions
      const { data: discussionsData } = await supabase
        .from('discussions')
        .select('*')
        .in('club_id', clubIds)
        .order('created_at', { ascending: false });

      const latest = discussionsData?.reduce((acc, discussion) => {
        if (!acc[discussion.club_id]) {
          acc[discussion.club_id] = discussion;
        }
        return acc;
      }, {});
      setLatestDiscussions(latest || {});

      return () => {
        supabase.removeChannel(subscription);
      };
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [router]);



  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount(prev => prev - 1);
  };


  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.is_read)
      .map(n => n.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (error) {
      console.error('Error marking notifications as read:', error);
      return;
    }

    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true }))
    );
    setUnreadCount(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading your book clubs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <button 
              onClick={() => window.location.reload()} 
              className="ml-2 underline"
            >
              Try Again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleCreateClub = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

       // Create the club first
        const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name: newClub.name,
          description: newClub.description,
          owner_id: user.id,
          join_code: Math.random().toString(36).substr(2, 6).toUpperCase()
        })
        .select()
        .single(); // Add single() for better error handling

      if (clubError) {
        throw new Error(`Club creation failed: ${clubError.message}`);
      }

      // Then add the creator as admin
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: clubData.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) {
        // Rollback club creation if membership fails
        await supabase.from('clubs').delete().eq('id', clubData.id);
        throw new Error(`Membership setup failed: ${memberError.message}`);
      }

      

      // Refresh clubs list
      const { data: clubsData } = await supabase
        .from('club_members')
        .select('club:clubs(*)')
        .eq('user_id', user.id);

      setClubs(clubsData?.map(m => m.club) || []);
      setShowCreateModal(false);
      setNewClub({ name: '', description: '' });

    } catch (err) {
      console.error('Error creating club:', err);
      setError(err.message || 'Failed to create club. Please try again.');
    }
    };

  const handleJoinClub = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Find club by join code
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .single();

      if (clubError) throw new Error('Invalid join code');

      // Add user to club members
      const { error: memberError } = await supabase
        .from('club_members')
        .insert([{
          club_id: clubData.id,
          user_id: user.id,
          role: 'member'
        }]);

      if (memberError) throw memberError;

      // Refresh clubs list
      const { data: clubsData } = await supabase
        .from('club_members')
        .select('club:clubs(*)')
        .eq('user_id', user.id);

      setClubs(clubsData?.map(m => m.club) || []);
      setShowJoinModal(false);
      setJoinCode('');

    } catch (err) {
      console.error('Error joining club:', err);
      setError(err.message);
    }
  };


  return (
    <div className="container mx-auto p-4">
      
      <h1 className="text-3xl font-bold mb-8">Welcome! Check out what's new!</h1>
      
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h2 className="text-2xl font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex gap-4">
            {notifications.some(n => !n.is_read) && (
              <button 
                onClick={markAllAsRead}
                className="text-sm text-blue-500 hover:underline"
              >
                Mark all as read
              </button>
            )}
            {notifications.some(n => n.is_read) && (
              <button 
                onClick={() => setShowReadNotifications(!showReadNotifications)}
                className="text-sm text-blue-500 hover:underline"
              >
                {showReadNotifications ? 'Hide read' : 'Show read'}
              </button>
            )}
          </div>
        </div>
        
        {notifications.filter(n => showReadNotifications || !n.is_read).length > 0 ? (
          <div className="space-y-2">
            {notifications
              .filter(n => showReadNotifications || !n.is_read)
              .map(n => (
                <Alert 
  key={n.id} 
  className={`mb-2 ${
    n.type === 'danger' ? 'bg-red-100 border-red-300 text-red-800' :
    !n.is_read ? 'bg-blue-50' : ''
  }`}
>

                  <div className="flex justify-between items-start">
                    <div>
                      <AlertTitle>{n.title}</AlertTitle>
                      <AlertDescription>
                        {n.description}
                        <p className="text-xs text-gray-500 mt-1">
                          {moment(n.created_at).fromNow()}
                        </p>
                      </AlertDescription>
                    </div>
                    {!n.is_read && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Alert>
              ))}
          </div>
        ) : (
          <Alert>
            <AlertTitle>No notifications</AlertTitle>
            <AlertDescription>
              {showReadNotifications ? 'You have no notifications' : 'You have no unread notifications'}
            </AlertDescription>
          </Alert>
        )}
      </section>

          <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5" />
        <h2 className="text-2xl font-semibold">Your Clubs</h2>
        <p className="text-sm text-muted-foreground">
          **Clubs you own are marked with a <Star className="w-4 h-4 inline-block text-yellow-500 fill-yellow-200" />
        </p>
      </div>


      {clubs.length > 0 ? (
        <Tabs defaultValue={clubs[0].id}>
          <TabsList className="flex overflow-x-auto space-x-2 pb-2">
            {clubs.map(club => (
              <TabsTrigger 
                key={club.id} 
                value={club.id}
                className="flex-shrink-0 whitespace-nowrap"
              >
                {club.name}
                {club.owner_id === user.id && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-200" />
                )}
              </TabsTrigger>
            ))}
            <TabsTrigger 
              value="create-join" 
              className="flex-shrink-0 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create/Join
            </TabsTrigger>
          </TabsList>

            {clubs.map(club => (
              <TabsContent key={club.id} value={club.id}>
                <Card>
                  <CardContent className="p-6">
                    <div className="gap-2 mb-4">
                      <p className="text-l font-style: italic text-gray-600">{club.description || 'No Description'}</p>
                    </div>
                    
                    

                    {/* Add new discussions section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Latest Discussion</h3>
                        <span className="text-sm text-gray-500">
                          {latestDiscussions[club.id]?.created_at && 
                            new Date(latestDiscussions[club.id].created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {latestDiscussions[club.id] ? (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">
                            {latestDiscussions[club.id].title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {latestDiscussions[club.id].content}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-sm">
                            <span className="text-gray-500">By:</span>
                            <span className="font-medium">
                              {latestDiscussions[club.id].author_name || 'Anonymous'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No discussions yet
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 mb-4">
                      {club.member_count} member(s)
                    </p>
                    
                    <button
                      onClick={() => router.push(`/clubs/${club.id}/reviews`)}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 group"
                    >
                      <BookOpen className="w-4 h-4 text-blue-100 group-hover:text-white" />
                      <span className="font-medium tracking-wide">Enter Club Hub</span>
                    </button>
                  </CardContent>
                </Card>
              </TabsContent>
              
            ))}
            <TabsContent value="create-join">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold">Create a New Club</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Start your own book club community
                      </p>
                    </div>
                    <Button 
                      onClick={() => setShowCreateModal(true)}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 group"
                    >
                      Create Club
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold">Join Existing Club</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Use a club's invite code to join
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => setShowJoinModal(true)}
                        className="w-full bg-slate-900 hover:bg-slate-950 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 group"
                      >
                        <LockKeyhole className="w-4 h-4 mr-2" />
                        Join Club
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold">Create a New Club</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Start your own book club community
                      </p>
                    </div>
                    <Button 
                      onClick={() => setShowCreateModal(true)}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 group"
                    >
                      Create Club
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold">Join Existing Club</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Use a club's invite code to join
                      </p>
                    </div>
                    <div className="space-y-2">
                      
                      <Button 
                        onClick={() => setShowJoinModal(true)}
                        className="w-full bg-slate-900 hover:bg-slate-950 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 group"
                      >
                        <LockKeyhole className="w-4 h-4 mr-2" />
                        Join Club
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
        )}
      </section>
      {/* Create Club Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Club</DialogTitle>
            <DialogDescription>
              Set up your new book club community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Club Name"
              value={newClub.name}
              onChange={(e) => setNewClub({...newClub, name: e.target.value})}
            />
            <Textarea
              placeholder="Club Description"
              value={newClub.description}
              onChange={(e) => setNewClub({...newClub, description: e.target.value})}
              rows={3}
            />
            <Button 
              onClick={handleCreateClub}
              className="w-full"
              disabled={!newClub.name}
            >
              Create Club
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Club Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Existing Club</DialogTitle>
            <DialogDescription>
              Enter the club's unique join code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Join Code (e.g. X7F9K2)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="text-center uppercase"
            />
            <Button 
              onClick={handleJoinClub}
              className="w-full"
              disabled={!joinCode}
            >
              Join Club
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {clubDeletedMessage && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md text-center">
      <h2 className="text-lg font-semibold text-green-700 mb-2">
        🎉 <strong>{clubDeletedMessage}</strong> has been successfully deleted!
      </h2>
      <button
        onClick={() => setClubDeletedMessage('')}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Close
      </button>
    </div>
  </div>
)}

{showLeftModal && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full border border-green-500">
      <h2 className="text-xl font-semibold text-green-700 mb-2">🎉 {leftMessage}</h2>
      <button
        className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        onClick={() => setShowLeftModal(false)}
      >
        Close
      </button>
    </div>
  </div>
)}


    </div>
  );
}