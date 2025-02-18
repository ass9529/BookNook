'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import supabase from '../supabaseClient';  // Ensure this path matches your Supabase client setup

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const toggleModal = () => setIsModalOpen(!isModalOpen);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleLoginSignup = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setUsername('');
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    if (isLogin) {
      const { error } = await supabase.auth.signIn({ email, password });
      if (error) console.error('Login error:', error.message);
      else {
        console.log('User logged in');
        toggleModal();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });
      if (error) console.error('Sign up error:', error.message);
      else {
        console.log('User signed up');
        toggleModal();
      }
    }
  };

  return (
    <header className="flex items-center justify-between p-4 bg-pink-100 text-gray-800">
      <h1 className="text-2xl font-bold">BookNook</h1>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-6">
        <a href="/about" className="hover:underline text-lg">About</a>
        <button onClick={() => {
            setIsLogin(false);
            toggleModal();
          }}
          className="px-6 py-2 rounded bg-black text-white"
        >
          Sign Up
        </button>
      </nav>

      {/* Hamburger Menu for Mobile */}
      <div className="md:hidden">
        <button onClick={toggleMenu} aria-label="Toggle Menu">
          {isMenuOpen ? <X className="w-6 h-6 text-gray-800" /> : <Menu className="w-6 h-6 text-gray-800" />}
        </button>
        {isMenuOpen && (
          <div className="absolute top-14 right-4 bg-pink-200 text-gray-800 rounded shadow-md p-4 z-50">
            <a href="/about" className="block mb-2 hover:underline">About</a>
            <button onClick={() => {
                setIsLogin(false);
                toggleModal();
              }}
              className="block px-6 py-2 rounded bg-black text-white"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>

      {/* Modal for Sign Up or Log In */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">{isLogin ? 'Log In' : 'Sign Up'}</h2>
              <button onClick={toggleModal} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <form className="space-y-4" onSubmit={handleAuth}>
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full p-2 border rounded"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              )}
              <input
                type="email"
                placeholder="E-mail"
                className="w-full p-2 border rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 border rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="w-full bg-black text-white p-2 rounded hover:bg-gray-800">
                {isLogin ? 'Log In' : 'Sign Up'}
              </button>
            </form>
            <p className="text-sm mt-4 text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                className="text-gray-800 hover:underline"
                onClick={toggleLoginSignup}
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
