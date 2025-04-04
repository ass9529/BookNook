'use client'; 

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { Bell, BookOpen } from 'lucide-react';
import { Card, CardContent } from '../src/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../src/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../src/components/ui/tabs';
import supabase from '../supabaseClient'; 
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



 

  const bookClubs = [
    {
      id: 1,
      name: "Mystery Lovers",
      members: 24,
      currentBook: "The Thursday Murder Club",
      topPosts: [
        { id: 1, title: "Theory about the ending", likes: 15, comments: 8 },
        { id: 2, title: "Character analysisz: Joyce", likes: 12, comments: 5 },
      ]
    },
    {
      id: 2,
      name: "SciFi Enthusiasts",
      members: 31,
      currentBook: "Project Hail Mary",
      topPosts: [
        { id: 1, title: "The science behind the Astrophage", likes: 22, comments: 14 },
        { id: 2, title: "Rocky's communication system explained", likes: 18, comments: 10 },
      ]
    }
  ];

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
              <button onClick={() => router.push('/bookclubs')} className={`relative group w-full px-4 py-2 bg-transparent text-white font-medium overflow-hidden  ${header2Font.className}`}>
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
            <button onClick={() => router.push('/settings')} className={`relative group w-full px-4 py-2 text-gray-500 font-medium overflow-hidden top-28 ${header2Font.className}`}>
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
            <h2 className="text-3xl font-semibold">BookClubs</h2>
          </div>

          <Tabs defaultValue={bookClubs[0].id.toString()} className="w-full">
            <TabsList className="w-full flex bg-gray-100 rounded-lg p-1">
              {bookClubs.map((club) => (
                <TabsTrigger
                  key={club.id}
                  value={club.id.toString()}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  {club.name}
                  <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs text-gray-700">
                    {club.members}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {bookClubs.map((club) => (
              <TabsContent key={club.id} value={club.id.toString()} className="mt-4">
                <Card className="shadow-lg border bg-white rounded-lg">
                  <CardContent className="pt-6 px-6">
                    {/* Currently Reading Section */}
                    <div className="mb-6">
                      <p className="text-sm text-gray-500">Currently Reading</p>
                      <p className="text-2xl font-bold">{club.currentBook}</p>
                    </div>

                    {/* Top Discussions */}
                    <div>
                      <p className="text-sm text-gray-500 mb-4">Top Discussions</p>
                      <div className="space-y-4">
                        {club.topPosts.map((post) => (
                          <div
                            key={post.id}
                            className="bg-gray-100 p-4 rounded-xl hover:bg-gray-200 transition-all cursor-pointer shadow-sm"
                          >
                            <p className="font-semibold">{post.title}</p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                              <span>{post.likes} likes</span>
                              <span>{post.comments} comments</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

        </section>
      </div>
    </div>
  );
};

export default BookClubsPage;