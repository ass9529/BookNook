'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import supabase from '../supabaseClient'; 
import Modal from './Modal';

export default function Navbar() {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState(null);

  // useEffect(() => {
  //   async function fetchData() {
  //     const {data} = await supabase.auth.getUser();
  //     console.log(data.user)

  //     if(!data.user) {
  //       router.push('/')
  //     }
  //     else {
  //       setUser(data.user)
  //     }
  //   }
  //   fetchData();
  // },[]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setErrorMessage(''); 
  };

  const showSignIn = () => {
    setIsLogin(true);
    setIsModalOpen(!isModalOpen);
    setErrorMessage(''); 
  }

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
    <header className="flex items-center justify-between p-4 bg-pink-100 text-gray-800">
      <h1 className="text-2xl font-bold">BookNook</h1>
      <nav className="hidden md:flex items-center space-x-6">
        {
          user ?
          <button onClick={handleSignOut} className="px-6 py-2 rounded bg-black text-white">
          {'Sign Out' }
          </button>
          :
          <button onClick={showSignIn} className="px-6 py-2 rounded bg-black text-white">
          {'Log In'}
          </button>
        }
       
      </nav>
      <div className="md:hidden">
        <button onClick={toggleMenu} aria-label="Toggle Menu">
          {isMenuOpen ? <X className="w-6 h-6 text-gray-800" /> : <Menu className="w-6 h-6 text-gray-800" />}
        </button>
        {isMenuOpen && (
          <div className="absolute top-14 right-4 bg-pink-200 text-gray-800 rounded shadow-md p-4 z-50">
            <button onClick={toggleModal} className="block px-6 py-2 rounded bg-black text-white">
              {isLogin ? 'Log In' : 'Sign Up'}
            </button>
          </div>
        )}
      </div>
      {isModalOpen && 
        <Modal
          username={username}
          password={password}
          email= {email}
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
    </header>
  );
}

