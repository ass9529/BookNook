'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Card, CardContent } from '../../../src/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../../src/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../src/components/ui/tabs';
import supabase from '../../../supabaseClient';
import { Baloo_2 } from 'next/font/google';
import { Pacifico } from 'next/font/google';

const headerFont = Baloo_2({
  weight: ['400', '800'],
  subsets: ['latin'],
});

const header2Font = Baloo_2({
  weight: ['800'],
  subsets: ['latin'],
});

const footerFont = Pacifico({
  weight: '400',
  subsets: ['latin'],
});

const SettingsPage = () => {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [clubData, setClubData] = useState(null);

  

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setIsLoggedIn(true);

        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', clubId)
          .single();

        if (clubError) {
          console.error('Error fetching club data:', clubError);
          return;
        }

        setClubData(clubData);

      }
    }
    fetchData();
  }, []);


  const getClubName = () => {
      return (
        <>
          <span className="text-gray-700 not-italic">Club</span>{' '}
          <span className="italic" style={{ color: '#F5F5F4' }}>{clubData.name}</span>
        </>
      );
  };



  return (
    isLoggedIn &&
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <section>
        <ul className="h-full w-64 bg-red-200 text-white rounded-3xl p-4 fixed left-5 top-48">
        <div className="flex justify-center items-center mb-4">
            <h1 className={`text-2xl font-bold text-black ${header2Font.className}`}>
              {clubData ? getClubName() : ''}
            </h1>
          </div>
          <div className="flex justify-center items-center flex-wrap space-y-8 p-6">
            
            <button onClick={() => router.push(`/clubs/${clubId}/reviews`)} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Book Reviews</span>
            </button>
            <button onClick={() => router.push(`/clubs/${clubId}/discussions`)} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
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
              <span className={`relative z-10 text-xl tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Settings</span>
            </button>
            <button onClick={() => router.push('/landing')} className={`relative group px-2 py-2 w-full bg-transparent text-gray-600 font-medium overflow-hidden bottom-5 ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-xl tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Home</span>
            </button>
          </div>
        </ul>
      </section>

      {/* Main Settings Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className={`max-w-4xl mx-auto ${headerFont.className}`}>
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5" />
            <h2 className="text-3xl font-semibold">Settings</h2>
          </div>

          <div className="shadow-lg border bg-white rounded-lg pt-6 px-6 h-60">
            {/* Settings content will go here */}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;