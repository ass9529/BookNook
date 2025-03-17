'use client'; 

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { Bell, BookOpen } from 'lucide-react';
import { Card, CardContent } from '../src/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../src/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../src/components/ui/tabs';
import supabase from '../supabaseClient'; 
import Modal from '../components/Modal';
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


const BookClubsPage = () => {  
  const router = useRouter();  
  const [IsLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setIsLoggedIn(true);
      }
    }
    fetchData();
  }, []);



  

  return (
    IsLoggedIn &&
    <div className="min-h-screen bg-white">
      {/* Header */}
     

        {/* Sidebar */}
        <section >
          <ul className="h-full w-64 bg-red-200 text-white rounded-3xl p-4 fixed left-5 top-48">
          <div className="flex justify-center items-center flex-wrap space-y-8 p-6"> 

            <button onClick={() => router.push('/landing')} className={`relative group px-2 py-2 rounded-lg bg-transparent text-gray-500 font-medium overflow-hidden bottom-5 ${header2Font.className}`}>
                <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
                <span className={`relative z-10 text-2xl tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Home</span>
              </button>
              <button onClick={() => router.push('/bookclubs')} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
                <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
                <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Book Clubs</span>
              </button>
              <button onClick={() => router.push('/discussions')} className={`relative group w-full px-4 py-2 rounded-lg  bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
                <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
                <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Discussions</span>
              </button>
              <button onClick={() => router.push('/notifications')} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
                <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
                <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Notifications</span>
              </button>
              <button onClick={() => router.push('/calendar')} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
                <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
                <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Calendar</span>
              </button>
              <button onClick={() => router.push('/settings')} className={`relative group w-full px-4 py-2 text-white font-medium overflow-hidden top-28 ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Settings</span>
            </button>  
          </div> 
          </ul>

          {/* Navigation Button */}
        </section>


    

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       

        {/* discussion board tabs */}
        <section className={`max-w-4xl mx-auto ${headerFont.className}`}>
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-3xl font-semibold">Your profile!</h2>
          </div>

          

            <div className="shadow-lg border bg-white rounded-lg pt-6 px-6 h-60">
            </div> 
                   
               
            
          

        </section>
      </div>
    </div>
  );
};

export default BookClubsPage;