


'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Bell, Trash2, Copy } from 'lucide-react';
import supabase from '../../../supabaseClient';
import { Baloo_2 } from 'next/font/google';
import { Pacifico } from 'next/font/google';

const headerFont = Baloo_2({ weight: ['400', '800'], subsets: ['latin'] });
const header2Font = Baloo_2({ weight: ['800'], subsets: ['latin'] });
const footerFont = Pacifico({ weight: '400', subsets: ['latin'] });

const SettingsPage = () => {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [clubData, setClubData] = useState(null);
  const [members, setMembers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showCodeCopied, setShowCodeCopied] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!clubId) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setIsLoggedIn(true);
      setUserId(user.id);

      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (clubError || !clubData) {
        console.error('Error fetching club data:', clubError);
        return;
      }
      setClubData(clubData);

      const { data: memberData, error: memberError } = await supabase
        .from('club_members')
        .select('user_id, profiles(username)')
        .eq('club_id', clubId);

      if (!memberError) {
        setMembers(memberData);
      }

      setLoading(false);
    };

    fetchData();
  }, [clubId, router]);

  if (loading || !clubData || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading club settings...</p>
      </div>
    );
  }

  const isHost = userId === clubData.owner_id;

  const handleDeleteClub = async () => {
    const { error } = await supabase.from('clubs').delete().eq('id', clubId);
    if (!error) {
      localStorage.setItem('clubDeletedMessage', clubData.name);
      router.push('/landing');
    } else {
      console.error('Failed to delete club:', error);
    }
  };

  const handleLeaveClub = async () => {
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);
    if (!error) {
      localStorage.setItem('clubLeftMessage', `You left ${clubData.name}`);
      router.push('/landing');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(clubData.join_code);
    setShowCodeCopied(true);
    setTimeout(() => setShowCodeCopied(false), 1500);
  };

  const getClubName = () => (
    <>
      <span className="text-gray-700 not-italic">Club</span>{' '}
      <span className="italic" style={{ color: '#F5F5F4' }}>
        {clubData.name}
      </span>
    </>
  );

  return (
    <div className="min-h-screen bg-white flex">
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

      {/* Main Content */}
      <main className="flex-1 px-6 py-8 ml-72">
        <section className={`max-w-4xl mx-auto ${headerFont.className}`}>
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5" />
            <h2 className="text-3xl font-semibold">Club Settings</h2>
          </div>

          <div className="shadow-lg border bg-white rounded-lg pt-6 px-6 pb-6 space-y-6">
            {isHost && (
              <div>
                <h3 className="text-lg font-semibold">Join Code</h3>
                <div className="inline-flex items-center gap-3 mt-2 relative">
  <p className="bg-gray-100 px-4 py-2 rounded font-mono text-sm border border-gray-300">
    {clubData.join_code}
  </p>
  <button
    onClick={handleCopyCode}
    className="p-2 rounded bg-red-200 hover:bg-red-300"
  >
    <Copy className="h-4 w-4" />
  </button>
  {showCodeCopied && (
    <span className="abolute left-full top-1/2 -translate-y-1/2 ml-2 text-green-600 bg-white px-3 py-1 text-xs rounded shadow">
      ✔ Code copied!
    </span>
  )}
</div>

              </div>
            )}

            {isHost ? (
              <>
                <h3 className="text-lg font-semibold">Danger Zone</h3>
                {!showConfirmDelete ? (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="mt-2 text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded shadow"
                  >
                    <Trash2 className="inline-block mr-2 w-4 h-4" /> Delete Club
                  </button>
                ) : (
                  <div className="mt-4 p-4 border rounded bg-red-50 text-black">
                    <p className="mb-2">
                      Are you sure you want to delete this club?
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={handleDeleteClub}
                        className="bg-red-200 hover:bg-red-300 px-3 py-1 rounded"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(false)}
                        className="border px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-red-600">
                  Leave Club
                </h3>
                {!showConfirmLeave ? (
                  <button
                    onClick={() => setShowConfirmLeave(true)}
                    className="mt-2 text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded shadow"
                  >
                    Leave Club
                  </button>
                ) : (
                  <div className="mt-4 p-4 border rounded bg-yellow-50 text-black">
                    <p className="mb-2">
                      Are you sure you want to leave{' '}
                      <strong>{clubData.name}</strong>?
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={handleLeaveClub}
                        className="bg-red-200 hover:bg-red-300 px-3 py-1 rounded"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowConfirmLeave(false)}
                        className="border px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;

