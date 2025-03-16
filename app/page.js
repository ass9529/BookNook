'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import supabase from './supabaseClient'; 
import Modal from './components/Modal';

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
    <div>
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between p-8 bg-pink-100">
        <div className="md:w-1/2">
          <h1 className="text-4xl font-bold mb-4 font-serif">Your Ultimate Book Club Companion</h1>
          <p className="text-lg mb-6">
            Manage book clubs effortlessly, join discussions, and keep track of your reading journey
            with BookNook.
          </p>
          <button onClick={showSignUp} className="relative group px-6 py-2 rounded bg-black text-white font-medium overflow-hidden hover:bg-gray-800">
            <span className="absolute inset-0 bg-gray-800 transition-transform translate-y-full group-hover:translate-y-0"></span>
            <span className="relative group-hover:text-white">Get Started</span>
          </button>
        </div>
        {/* Optimized Image Component */}
        <Image
          src="/cat.jpg"
          alt="Book Club Illustration"
          width={400}
          height={400}
          className="w-full md:w-1/3 mt-6 md:mt-0"
        />
      </section>

      {/* Features Section */}
      <section className="p-8 bg-white">
        <h2 className="text-3xl font-bold text-center mb-8">Why Choose BookNook?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <h3 className="text-2xl font-bold mb-2">Organized Meetings</h3>
            <p>Schedule and manage book club meetings with ease. Sync calendars and send reminders to members.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">Engaging Discussions</h3>
            <p>Join thoughtful conversations and rate books to spark new ideas with fellow readers.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">Personalized Experience</h3>
            <p>Track your favorite books, reviews, and ratings, and explore curated recommendations.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="p-8">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4 bg-white shadow-lg rounded">
            <h3 className="text-xl font-bold mb-2">1. Create or Join a Club</h3>
            <p>Start your own book club or join an existing one. Invite friends and book lovers to collaborate.</p>
          </div>
          <div className="p-4 bg-white shadow-lg rounded">
            <h3 className="text-xl font-bold mb-2">2. Organize Meetings</h3>
            <p>Schedule meetings, set agendas, and sync calendars effortlessly with our intuitive tools.</p>
          </div>
          <div className="p-4 bg-white shadow-lg rounded">
            <h3 className="text-xl font-bold mb-2">3. Dive Into Discussions</h3>
            <p>Share reviews, engage in meaningful conversations, and explore books together.</p>
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
