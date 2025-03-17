'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import supabase from './supabaseClient'; 
import Modal from './components/Modal';
import { Baloo_2 } from 'next/font/google';
import { Pacifico } from 'next/font/google';

const headerFont = Baloo_2({
  weight: ['400'],
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


export default function Home() {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState(null);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setErrorMessage(''); 
  };


  const showSignUp = () => {
    setIsLogin(false);
    setIsModalOpen(!isModalOpen);
    setErrorMessage('');
  }


  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const toggleLoginSignup = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setUsername('');
    setErrorMessage(''); 
  };


  const handleSignOut = async (event) => {

    event.preventDefault();
    await supabase.auth.signOut();
    setUser(null)
    router.push("/")
  }

  const handleAuth = async (event) => {
    event.preventDefault();
    try {
      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMessage(error.message);
        } else {
          console.log('User logged in');
          setUser(data.user);
          toggleModal(); 
          router.push('/landing'); 
        }
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } }
        });
        if (error) {
          setErrorMessage(error.message);
        } else {
          console.log('User signed up');
          setUser(data.user);
          toggleModal();
          router.push('/landing'); 
        }
      }
    } catch (error) {
      console.error('Authentication error:', error.message);
      setErrorMessage('Authentication error occurred');
    }
  };


  return (
    <div className=" bg-red-200 ">
      
      <section className={`flex flex-col md:flex-row items-center justify-between p-6 bg-red-200 ${headerFont.className}`}> 
        <div className="md:w-1/2">
          <h1 className={`text-4xl font-bold mb-4 font-serif ${header2Font.className}`}> Your Ultimate Book Club Companion</h1>
          <p className="text-lg mb-6">
            Manage book clubs effortlessly, join discussions, and keep track of your reading journey
            with BookNook.
          </p>
          <button onClick={showSignUp} className={`relative group w-36 px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
            <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
            <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Get Started</span>
          </button>

        </div>
     
        <Image
          src="/cat.jpg"
          alt="Book Club Illustration"
          width={200}
          height={200}
          className="w-auto md:w-1/5 rounded-lg border-2 border-gray-300 mb-10 mt-5"
        />
      </section>

     
      <section className={`p-8 bg-white rounded-full border-4 border-black ${header2Font.className}`}>
        <h2 className="text-3xl font-bold text-center mb-8">Why Choose BookNook?</h2>

        <div className="grid grid-cols-2 text-center gap-6 w-fit">
          <div>
            <h3 className="text-2xl font-bold mb-1">1. Create or Join a Club</h3>
            <p className={` ${headerFont.className}`}>Start your own book club or join an existing one. Invite friends and book lovers to collaborate.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1">Organize Meetings</h3>
            <p className={` ${headerFont.className}`}>Schedule book club meetings with ease. Sync calendars and send reminders to members.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1">Engaging Discussions</h3>
            <p className={` ${headerFont.className}`}>Join thoughtful conversations and rate books to spark new ideas with fellow readers.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1">Personalized Experience</h3>
            <p className={` ${headerFont.className}`}>Track your favorite books, reviews, and ratings, and explore curated recommendations.</p>
          </div>
        </div>
      </section>

      
      {isModalOpen &&
        <Modal
          username={username}
          password={password}
          email={email}
          setUsername={setUsername}
          setPassword={setPassword}
          setEmail={setEmail}
          handleAuth={handleAuth}
          isLogin={isLogin}
          setIsLogin={setIsLogin}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        />
      }
    </div>
  );
}
