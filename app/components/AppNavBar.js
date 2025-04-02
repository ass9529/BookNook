'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { Menu, X } from 'lucide-react';
import supabase from '../supabaseClient'; 
import Modal from '../components/Modal';
import { Baloo_2 } from 'next/font/google';
import { Pacifico } from 'next/font/google';
import Image from 'next/image';

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

export default function AppNavBar() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');

    useEffect(() => {
        async function fetchData() {
            // Get authenticated user
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                router.push('/');
            } else {
                setUser(user);
                
                // Fetch user profile from your profiles table
                const { data: profile, error } = await supabase
                    .from('profiles') // replace with your actual table name
                    .select('username')
                    .eq('id', user.id)
                    .single();
                
                if (error) {
                    console.error('Error fetching profile:', error);
                } else if (profile) {
                    setUsername(profile.username);
                }
            }
        }
        fetchData();
    }, []);

    const handleSignOut = async (event) => {
        event.preventDefault();
        await supabase.auth.signOut();
        router.push('/');
    };
    
    return (
        <header className="flex items-center justify-between p-16 bg-red-200 text-gray-800 border-b-8 border-black">
            <h1 className={`text-5xl ${footerFont.className}`}> BookNook</h1>
            <nav className="hidden md:flex items-right top-2">
                <button onClick={handleSignOut} className={`relative group w-36 px-4 py-2 left-14 rounded-lg bg-black text-white font-medium overflow-hidden top-[-40px] ${header2Font.className}`}>
                <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
                <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>
                {'Log Out'}
                </span>
                </button>

                <div className="group">
                    <button onClick={() => router.push('/profile')} className={`relative bg-transparent text-black transition text-xl right-20 top-12 overflow-hidden ${header2Font.className}`}>
                        <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 "></span>
                        <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-white ${header2Font.className}`}>
                            {username || 'Profile'} {/* Fallback to 'Profile' if username not loaded */}
                        </span>
                    </button>
                </div>

            </nav>
            <div className="w-16 h-16 rounded-full overflow-hidden absolute right-16 transform -translate-y-1/3 top-28">
                <Image
                src="/Profile.png"
                alt="Picture of the author"
                width={200}
                height={200}
                className="w-auto h-full object-fill scale-150"
                />
            </div>
        </header>
    );
}