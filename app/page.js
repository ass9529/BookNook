// page.js: This file defines the Home page of the BookNook application, organizing the layout into hero, features, and how-it-works sections.

import Image from 'next/image'; // Import the Next.js Image component to handle optimized image loading.

export default function Home() {
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
          <button className="relative group px-6 py-2 rounded bg-black text-white font-medium overflow-hidden hover:bg-gray-800">
            <span className="absolute inset-0 bg-gray-800 transition-transform translate-y-full group-hover:translate-y-0"></span>
            <span className="relative group-hover:text-white">Get Started</span>
          </button>
        </div>
        {/* Optimized Image Component */}
        <Image
          src="/cat.jpg" // Specify the path relative to the `public` folder for the image.
          alt="Book Club Illustration" // Provide an alternative text for the image.
          width={400} // Set the width of the image.
          height={400} // Set the height of the image.
          className="w-full md:w-1/3 mt-6 md:mt-0" // Assign responsive width and margin classes.
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

    </div>
  );
}
