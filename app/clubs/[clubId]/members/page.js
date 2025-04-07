'use client'; 

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation'; 
import { BookOpen } from 'lucide-react';
import supabase from '../../../supabaseClient'; 
import { Baloo_2, Pacifico } from 'next/font/google';

const headerFont = Baloo_2({ weight: ['400', '800'], subsets: ['latin'] });
const header2Font = Baloo_2({ weight: ['800'], subsets: ['latin'] });
const footerFont = Pacifico({ weight: '400', subsets: ['latin'] });

const BookClubsPage = () => {  
  const router = useRouter();  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { clubId } = useParams();

  useEffect(() => {
    async function checkLogin() {
      const { data } = await supabase.auth.getUser();
      if (data.user) setIsLoggedIn(true);
    }
    checkLogin();
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);

      const { data, error } = await supabase
  .from('club_members')
  .select(`
    user_id,
    profiles (
      username
    )
  `)
  .eq('club_id', clubId);


      if (error) {
        console.error('Failed to load members:', error.message);
        setLoading(false);
        return;
      }

      setMembers(data || []);
      setLoading(false);
    };

    if (clubId) fetchMembers();
  }, [clubId]);

  return (
    isLoggedIn &&
    <div className="min-h-screen bg-white">
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
            <button onClick={() => router.push('/settings')} className={`relative group w-full px-4 py-2 text-white font-medium overflow-hidden top-28 ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Settings</span>
            </button>
          </div> 
        </ul>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className={`max-w-4xl mx-auto ${headerFont.className}`}>
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-3xl font-semibold">Members List</h2>
          </div>

          <div className="shadow-lg border bg-white rounded-lg pt-6 px-6 h-auto min-h-[12rem]">
            {loading ? (
              <p className="text-gray-600">Loading members...</p>
            ) : members.length === 0 ? (
              <p className="text-gray-600">No members have joined this club yet.</p>
            ) : (
              <ul className="space-y-2">
                {members.map((member, index) => (
                  <li
                    key={index}
                    className="p-3 bg-gray-100 rounded-lg shadow-sm border text-gray-800"
                  >
                    {member.profiles?.username || member.user_id}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BookClubsPage;
