'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import supabase from '../supabaseClient'; // Make sure this import path is correct

export default function Navbar() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setErrorMessage(''); // Clear any existing error messages
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const toggleLoginSignup = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setUsername('');
    setErrorMessage(''); // Clear any existing error messages
  };

  // Ensure this function is defined inside the functional component
  const handleAuth = async (event) => {
    event.preventDefault();
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMessage(error.message);
        } else {
          console.log('User logged in');
          toggleModal(); // Close the modal
          router.push('/landing'); // Navigate to landing page
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } }
        });
        if (error) {
          setErrorMessage(error.message);
        } else {
          console.log('User signed up');
          toggleModal(); // Close the modal
          router.push('/landing'); // Navigate to landing page
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
        <button onClick={toggleModal} className="px-6 py-2 rounded bg-black text-white">
          {isLogin ? 'Log In' : 'Sign Up'}
        </button>
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">{isLogin ? 'Log In' : 'Sign Up'}</h2>
              <button onClick={toggleModal} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            {errorMessage && (
              <div className="bg-red-100 text-red-800 p-3 text-center">
                {errorMessage}
              </div>
            )}
            <form className="space-y-4" onSubmit={handleAuth}>
              {!isLogin && (
                <>
                  <input
                    type="text"
                    placeholder="Username"
                    className="w-full p-2 border rounded"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </>
              )}
              <input
                type="email"
                placeholder="E-mail"
                className="w-full p-2 border rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 border rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {!isLogin && <div className="text-xs text-gray-600">Password must be at least 6 characters long.</div>}
              <button type="submit" className="w-full bg-black text-white p-2 rounded hover:bg-gray-800">
                {isLogin ? 'Log In' : 'Sign Up'}
              </button>
            </form>
            <p className="text-sm mt-4 text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                className="text-gray-800 hover:underline"
                onClick={toggleLoginSignup}
              >
                {isLogin ? ' Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      )}
    </header>
  );
}

