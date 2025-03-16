'use client';

import { useEffect, useState } from 'react';
import supabase from '../supabaseClient';

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
    <footer className="p-8 bg-pink-100 text-gray-800 text-center">
      <div className="mb-4">
        <h2 className="text-lg font-bold">BookNook</h2>
        <p className="text-sm">Your ultimate book club companion.</p>
      </div>
      <p className="text-sm">© 2025 BookNook. All rights reserved.</p>
    </footer>
  );
}

