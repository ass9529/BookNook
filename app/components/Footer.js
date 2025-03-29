'use client';

import { useEffect, useState } from 'react';
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


export default function Footer() {
  const [IsLoggedIn, setIsLoggedIn] = useState(false)

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
    <footer className={`p-8 bg-red-200 text-gray-800 text-center ${headerFont.className}`}>
      <div className="mb-4">
        <h2 className={`text-lg font-bold ${footerFont.className}`}> BookNook</h2>
        <p className="text-base">Your ultimate book club companion.</p>
      </div>
      <p className="text-sm">© 2025 BookNook. All rights reserved.</p>
    </footer>
  );
}

