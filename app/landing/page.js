'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BookOpen } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../src/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../src/components/ui/tabs';
import { Card, CardContent } from '../src/components/ui/card';
import supabase from '../supabaseClient';

export default function BookClubsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // 2. Fetch data in parallel
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
        console.error('Error:', err);
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Your Book Clubs</h1>
      
      {/* Notifications */}
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

      {/* Clubs */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5" />
          <h2 className="text-2xl font-semibold">Your Clubs</h2>
        </div>

        {clubs.length > 0 ? (
          <Tabs defaultValue={clubs[0].id}>
            <TabsList className="grid grid-cols-2 gap-2 mb-6">
              {clubs.map(club => (
                <TabsTrigger key={club.id} value={club.id}>
                  {club.name}
                </TabsTrigger>
              ))}
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
                    
                    {/* Book Reviews Button */}
                    <button
                      onClick={() => router.push(`/reviews`)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      Navigate to this Club
                    </button>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Alert>
            <AlertTitle>No clubs yet</AlertTitle>
            <AlertDescription>
              Join a club to get started!
            </AlertDescription>
          </Alert>
        )}
      </section>
    </div>
  );
}