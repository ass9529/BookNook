'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BookOpen } from 'lucide-react';
import { Card, CardContent } from '../src/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../src/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../src/components/ui/tabs';
import supabase from '../supabaseClient';
import { useParams } from 'next/navigation';
import { Baloo_2 } from 'next/font/google';
import { Pacifico } from 'next/font/google';
import Image from 'next/image';
import ResetModal from '../components/ResetModal'



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


const ProfilePage = () => {
  const params = useParams();
  const clubId = params.clubId;
  const router = useRouter();
  const [IsLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const [isEditing, setIsEditing] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)


  // Check if user is logged in and fetch user data
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

        // Load in data from database
        setIsLoggedIn(true);
        setUserProfile(userData)
        setUsername(userData.username)
        setBio(userData.bio)
        setEmail(userData.email)
        setImageUrl(userData.photo_url)
      }
    }

    fetchData();
  }, []);

  const uploadImageAndGetUrl = async (event) => {
    const uniqueSuffix = Date.now();
    const file = selectedFile

    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${userProfile.id}-${uniqueSuffix}.${fileExt}`;

    // Upload image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    // Update user profile with avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photo_url: publicUrl })
      .eq('id', userProfile.id);

    if (updateError) throw updateError;

    setImageUrl(publicUrl);
  }

  const handleSave = async () => {
    try {
      // Update auth user email if it's changed
      if (email !== userProfile.email) {
        const { data: authData, error: authError } = await supabase.auth.updateUser({
          email: email
        });
        
        if (authError) throw authError;
        console.log("Auth email updated", authData);
      }
  
      // Update profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          username: username,
          email: email, // This will now match the auth user email
          bio: bio
        })
        .eq('id', userProfile.id)
        .select()
        .single();
  
      if (profileError) throw profileError;
  
      console.log("Profile data saved", profileData);
      setIsEditing(!isEditing);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }

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
            <button onClick={() => router.back()} className={`relative group px-2 py-2 rounded-lg bg-transparent text-gray-500 font-medium overflow-hidden bottom-5 ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-2xl tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Return</span>
            </button>
          </div>
        </ul>
      </section>

      {/* Main Content */}
      <div className="ml-72 p-8 w-full">
        <h1 className={`text-3xl font-bold text-black mb-8 flex items-center gap-2 ${header2Font.className}`}>
          Profile
        </h1>
        <Card className={`shadow-lg border bg-white rounded-2xl p-4 ${header2Font.className}`}>
          <CardContent>
            <div className="flex-col items-center justify-between mb-4">
              <div className='flex items-center justify-between'>
                <p className="w-fit text-2xl font-bold text-black mb-6">
                  Your Profile
                </p>
                {isEditing ?
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-red-200 hover:bg-gray-200 text-black font-semibold py-2 px-4 rounded text-lg">
                    Edit
                  </button>
                  :
                  <button
                    onClick={() => handleSave()}
                    className="bg-green-200 hover:bg-gray-200 text-black font-semibold py-2 px-4 rounded text-lg">
                    Save
                  </button>
                }
              </div>
              <div className='mb-10'>
                <p className="text-sm font-semibold mb-4 text-gray-700">Profile Image</p>
                <div>
                  <Image
                    src={imageUrl || "/Profile.png"}
                    alt="Profile Picture"
                    width={150}
                    height={150}
                    className="rounded-full mb-4 object-cover"
                  />
                  {!isEditing && (
                    <>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                          }
                        }}
                        className="block w-full text-sm text-gray-700
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-red-200 file:text-black
              hover:file:bg-gray-300"
                      />

                      {selectedFile && (
                        <button
                          onClick={() => { uploadImageAndGetUrl() }}
                          className="mt-4 px-4 py-2 bg-red-200 text-black rounded-md font-semibold hover:bg-gray-200"
                        >
                          Save
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className='mb-8'>
                <p className="text-lg font-semibold mb-3 text-gray-700">Username</p>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isEditing}
                  className={`w-full px-4 py-2 border rounded-md text-gray-800 bg-white transition 
    ${!isEditing
                      ? 'border-red-200 focus:ring-2 focus:ring-black focus:outline-none'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'}`}
                />

              </div>
              <div className='mb-8'>
                <p className={`text-lg font-semibold mb-1 text-gray-700 ${header2Font.className}`}>Email</p>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEditing}
                  className={`w-full px-4 py-2 border rounded-md text-gray-800 bg-white transition 
    ${!isEditing
                      ? 'border-red-200 focus:ring-2 focus:ring-black focus:outline-none'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'}`}
                />
              </div>
              <div className="mb-8">
                <p className={`text-lg font-semibold mb-1 text-gray-700 ${header2Font.className}`}>Bio</p>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={isEditing}
                  className={`w-full px-4 py-2 border rounded-md text-gray-800 bg-white transition 
    ${!isEditing
                      ? 'border-red-200 focus:ring-2 focus:ring-black focus:outline-none'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'}`}
                />
              </div>
              <div className="mb-8">
                <p className="text-lg font-semibold mb-1 text-gray-700">Password</p>
                <button
                  className="bg-red-200 hover:bg-gray-300 text-black font-semibold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isEditing}
                  onClick={() => {setShowPasswordModal(!showPasswordModal)}}
                >
                  Reset Password
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {true &&
        <ResetModal
          isModalOpen={showPasswordModal}
          setIsModalOpen={setShowPasswordModal}
        
        />
      }
    </div>
  );
};

export default ProfilePage;