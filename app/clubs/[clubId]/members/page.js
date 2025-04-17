'use client'; 

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation'; 
import { BookOpen, Trash2, Crown, MoreVertical, Shield, ShieldOff } from 'lucide-react';
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
  const [isHost, setIsHost] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [clubHostId, setClubHostId] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewHost, setSelectedNewHost] = useState('');
  const [activeMemberMenu, setActiveMemberMenu] = useState(null);
  const { clubId } = useParams();

  useEffect(() => {
    async function checkLogin() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setIsLoggedIn(true);
        setCurrentUserId(data.user.id);
        checkUserRole(data.user.id);
      }
    }
    checkLogin();
  }, []);

  const checkUserRole = async (userId) => {
    // Get club host
    const { data: clubData } = await supabase
      .from('clubs')
      .select('owner_id')
      .eq('id', clubId)
      .single();

    if (clubData) {
      setClubHostId(clubData.owner_id);
      setIsHost(clubData.owner_id === userId);
    }

    // Check if user is admin
    const { data: memberData } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single();

    if (memberData && (memberData.role === 'admin' || clubData.owner_id === userId)) {
      setIsAdmin(true);
    }
  };

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('club_members')
        .select(`
          user_id,
          role,
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

  const handleKickMember = async (userId) => {
    if (!(isHost || isAdmin) || userId === clubHostId) {
      alert('You cannot remove the host');
      return;
    }
    
    if (window.confirm('Are you sure you want to remove this member?')) {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', userId);

      if (!error) {
        setMembers(members.filter(member => member.user_id !== userId));
      } else {
        console.error('Failed to remove member:', error.message);
      }
    }
  };

  const handlePromoteDemote = async (userId, currentRole) => {
    if (!isHost) return;
    
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    
    const { error } = await supabase
      .from('club_members')
      .update({ role: newRole })
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (!error) {
      setMembers(members.map(member => 
        member.user_id === userId 
          ? { ...member, role: newRole } 
          : member
      ));
    } else {
      console.error('Failed to update role:', error.message);
    }
    setActiveMemberMenu(null);
  };

  const handleTransferOwnership = async () => {
    if (!isHost || !selectedNewHost) return;

    if (window.confirm(`Are you sure you want to transfer ownership to this member?`)) {
      try {
        // Update club host in clubs table
        const { error: clubUpdateError } = await supabase
          .from('clubs')
          .update({ owner_id: selectedNewHost })
          .eq('id', clubId);

        if (clubUpdateError) throw clubUpdateError;

        // Update the previous host's role to admin
        const { error: memberUpdateError } = await supabase
          .from('club_members')
          .update({ role: 'admin' })
          .eq('club_id', clubId)
          .eq('user_id', currentUserId);

        if (memberUpdateError) throw memberUpdateError;

        // Update the new host's role
        const { error: newHostUpdateError } = await supabase
          .from('club_members')
          .update({ role: 'host' })
          .eq('club_id', clubId)
          .eq('user_id', selectedNewHost);

        if (newHostUpdateError) throw newHostUpdateError;

        // Update local state
        setClubHostId(selectedNewHost);
        setIsHost(false);
        setIsAdmin(true);
        setShowTransferModal(false);
        setSelectedNewHost('');
        
        // Refresh members list
        const { data } = await supabase
          .from('club_members')
          .select(`
            user_id,
            role,
            profiles (
              username
            )
          `)
          .eq('club_id', clubId);

        setMembers(data || []);
      } catch (error) {
        console.error('Failed to transfer ownership:', error.message);
      }
    }
  };

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
      <div className="ml-72 mr-8 py-8 pb-16">
        <section className={`max-w-4xl mx-auto ${headerFont.className}`}>
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-3xl font-semibold">Members List</h2>
            {isHost && (
              <div className="flex items-center ml-4">
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                  Club Host
                </span>
                <button 
                  onClick={() => setShowTransferModal(true)}
                  className="flex items-center text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Transfer Ownership
                </button>
              </div>
            )}
            {isAdmin && !isHost && (
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded ml-4">
                Admin
              </span>
            )}
          </div>

          <div className="shadow-lg border bg-white rounded-lg pt-6 px-6 pb-8 h-auto min-h-[12rem] mb-8">
          {loading ? (
            <p className="text-gray-600 py-4">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-gray-600 py-4">No members have joined this club yet.</p>
          ) : (
            <ul className="space-y-2 relative">
              {members.map((member) => (
                <li
                  key={member.user_id}
                  className="p-3 bg-gray-100 rounded-lg shadow-sm border text-gray-800 flex justify-between items-center relative"
                >
                  <div className="flex items-center">
                    {member.profiles?.username || member.user_id}
                    {member.user_id === clubHostId ? (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Host
                      </span>
                    ) : member.role === 'admin' ? (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Admin
                      </span>
                    ) : null}
                  </div>
                  
                  {/* Action menu - only show for non-current-user members */}
                  {(isHost || (isAdmin && member.user_id !== clubHostId)) && member.user_id !== currentUserId && (

                    <div className="relative">
                      <button 
                        onClick={() => setActiveMemberMenu(activeMemberMenu === member.user_id ? null : member.user_id)}
                        className="p-1 rounded hover:bg-gray-200"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      {activeMemberMenu === member.user_id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border">
                          {/* Only host can promote/demote admins */}
                          {isHost && member.user_id !== clubHostId && (
                            <button
                              onClick={() => handlePromoteDemote(member.user_id, member.role)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {member.role === 'admin' ? (
                                <>
                                  <ShieldOff className="w-4 h-4 mr-2 text-yellow-600" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 mr-2 text-blue-600" />
                                  Make Admin
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* Don't show remove option for host */}
                          {member.user_id !== clubHostId && (
                            <button
                              onClick={() => handleKickMember(member.user_id)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 "
                            >
                              <Trash2 className="w-4 h-4 mr-2 text-red-600 " />
                              Remove Member
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        </section>
      </div>
      {activeMemberMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setActiveMemberMenu(null)}
        />
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Transfer Club Ownership</h3>
            <p className="mb-4">Select a member to transfer ownership to:</p>
            
            <select
              value={selectedNewHost}
              onChange={(e) => setSelectedNewHost(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">Select a member</option>
              {members
                .filter(member => member.user_id !== currentUserId)
                .map(member => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.profiles?.username || member.user_id}
                    {member.role === 'admin' && ' (Admin)'}
                  </option>
                ))}
            </select>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedNewHost('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferOwnership}
                disabled={!selectedNewHost}
                className={`px-4 py-2 rounded ${selectedNewHost ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                Transfer Ownership
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookClubsPage;
