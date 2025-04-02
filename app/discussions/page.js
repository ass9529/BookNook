'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '../src/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../src/components/ui/alert';
import supabase from '../supabaseClient';
import { Baloo_2 } from 'next/font/google';

const header2Font = Baloo_2({
  weight: ['800'],
  subsets: ['latin'],
});

const DiscussionsPage = () => {  
  const router = useRouter();  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);

  // Sample data - replace with your actual data fetching
  const sampleDiscussions = [
    {
      id: 1,
      title: "Favorite Reading Spots",
      topic: "General",
      content: "Where does everyone like to read? I'm looking for new inspiration!",
      comments: [
        { id: 1, user: "Alex", text: "I love reading in coffee shops on rainy days", date: "2023-05-15" },
        { id: 2, user: "Jamie", text: "My backyard hammock is perfect for summer reading", date: "2023-05-18" },
      ]
    },
    {
      id: 2,
      title: "Upcoming Book Events",
      topic: "Events",
      content: "There's a great author talk next week at the downtown library",
      comments: [
        { id: 1, user: "Taylor", text: "Thanks for sharing! I'll definitely go", date: "2023-06-02" },
      ]
    }
  ];

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(!!data.user);
      setLoading(false);
      
      // In a real app, you would fetch actual discussion data here:
      // const { data: discussionData } = await supabase.from('discussions').select('*');
      // setDiscussions(discussionData || []);
      
      setDiscussions(sampleDiscussions); // Using sample data for now
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Loading discussions...</p>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <section>
        <ul className="h-full w-64 bg-red-200 text-white rounded-3xl p-4 fixed left-5 top-48">
          <div className="flex justify-center items-center flex-wrap space-y-8 p-6"> 
            <button onClick={() => router.push('/landing')} className={`relative group px-2 py-2 rounded-lg bg-transparent text-gray-500 font-medium overflow-hidden bottom-5 ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-2xl tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Home</span>
            </button>
            <button onClick={() => router.push('/reviews')} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Book Reviews</span>
            </button>
            <button onClick={() => router.push('/discussions')} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Discussions</span>
            </button>
            <button onClick={() => router.push('/members')} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Members</span>
            </button>
            <button onClick={() => router.push('/calendar')} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Calendar</span>
            </button>
            <button onClick={() => router.push('/settings')} className={`relative group w-full px-4 py-2 text-white font-medium overflow-hidden top-28 ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Settings</span>
            </button>  
          </div> 
        </ul>
      </section>

      {/* Main Content */}
      <div className="ml-72 p-8 w-full">
        <h1 className={`text-3xl font-bold text-black mb-8 ${header2Font.className}`}>
          {selectedDiscussion ? (
            <button 
              onClick={() => setSelectedDiscussion(null)} 
              className="flex items-center gap-2 text-black hover:text-gray-600"
            >
              <ChevronLeft size={24} />
              {selectedDiscussion.title}
            </button>
          ) : (
            "Community Discussions"
          )}
        </h1>

        {selectedDiscussion ? (
          /* Discussion Detail View */
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                      {selectedDiscussion.topic}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold">{selectedDiscussion.title}</h2>
                  <p className="text-gray-700 whitespace-pre-line">{selectedDiscussion.content}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare size={20} />
                Comments ({selectedDiscussion.comments.length})
              </h3>
              
              {selectedDiscussion.comments.length > 0 ? (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                  {selectedDiscussion.comments.map(comment => (
                    <Card key={comment.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{comment.user}</p>
                            <p className="text-gray-700">{comment.text}</p>
                          </div>
                          <span className="text-sm text-gray-500">{comment.date}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>No comments yet. Be the first to share your thoughts!</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        ) : (
          /* Discussion List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[80vh] overflow-y-auto pr-4">
            {discussions.map(discussion => (
              <Card 
                key={discussion.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedDiscussion(discussion)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs">
                        {discussion.topic}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">{discussion.title}</h3>
                    <p className="text-gray-600 line-clamp-2">{discussion.content}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                      <MessageSquare size={16} />
                      <span>{discussion.comments.length} comments</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionsPage;