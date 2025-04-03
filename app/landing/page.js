'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BookOpen, PlusCircle, LockKeyhole } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../src/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../src/components/ui/tabs';
import { Card, CardContent } from '../src/components/ui/card';
import { Button } from '../src/components/ui/button';
import { Input } from '../src/components/ui/input';
import { Textarea } from '../src/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../src/components/ui/dialog';
import supabase from '../supabaseClient';

export default function BookClubsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }



        const [notificationsRes, clubsRes] = await Promise.all([
          supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .limit(5),
            
          supabase
            .from('club_members')
            .select('club:clubs(*)')
            .eq('user_id', user.id)
        ]);

        if (notificationsRes.error) throw notificationsRes.error;
        if (clubsRes.error) throw clubsRes.error;

        setNotifications(notificationsRes.data || []);
        setClubs(clubsRes.data?.map(m => m.club) || []);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5" />
          <h2 className="text-2xl font-semibold">Notifications</h2>
        </div>
        
        {notifications.length > 0 ? (
          notifications.map(n => (
            <Alert key={n.id} className="mb-2">
              <AlertTitle>{n.title}</AlertTitle>
              <AlertDescription>{n.description}</AlertDescription>
            </Alert>
          ))
        ) : (
          <Alert>
            <AlertTitle>No notifications</AlertTitle>
            <AlertDescription>You're all caught up!</AlertDescription>
          </Alert>
        )}
      </section>

          <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5" />
        <h2 className="text-2xl font-semibold">Your Clubs</h2>
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
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">Current Book</p>
                      <p className="text-xl font-bold">{club.current_book || 'Not selected'}</p>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      {club.member_count || 0} members
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
    </div>
  );
}