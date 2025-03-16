'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import supabase from '../supabaseClient';
import Modal from './Modal';

export default function AppNavBar() {
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        async function fetchData() {
            const { data } = await supabase.auth.getUser();
            console.log(data.user)

            if (!data.user) {
                router.push('/')
            }
            else {
                setUser(data.user)
            }
        }
        fetchData();
    }, []);

    const handleSignOut = async (event) => {
        event.preventDefault();
        await supabase.auth.signOut();
        router.push("/")
    }

    return (
        <header className="flex items-center justify-between p-4 bg-pink-100 text-gray-800">
            <h1 className="text-2xl font-bold">BookNook</h1>
            <nav className="hidden md:flex items-center space-x-6">
                <button onClick={handleSignOut} className="px-6 py-2 rounded bg-black text-white">
                    {'Sign Out'}
                </button>
            </nav>
        </header>
    );
}

