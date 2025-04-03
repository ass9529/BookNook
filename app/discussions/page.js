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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // 2. Fetch discussions with author info
        const { data: discussionsData, error: discussionsError } = await supabase
          .from('discussions')
          .select(`
            *,
            author:profiles(username)
          `)
          .order('created_at', { ascending: false });

        if (discussionsError) throw discussionsError;

        // 3. Fetch comments with commenter info
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            *,
            commenter:profiles(username)
          `);

        if (commentsError) throw commentsError;

        // 4. Combine the data
        const discussionsWithComments = discussionsData.map(discussion => ({
          ...discussion,
          authorName: discussion.author?.username || 'Anonymous',
          authorPhoto: discussion.author?.photo_url || null,
          comments: commentsData
            .filter(comment => comment.discussion_id === discussion.id)
            .map(comment => ({
              id: comment.id,
              text: comment.content,
              date: new Date(comment.created_at).toLocaleDateString(),
              commenterName: comment.commenter?.username || 'Anonymous',
              commenterPhoto: comment.commenter?.photo_url || null
            }))
        }));

        setDiscussions(discussionsWithComments);

      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Loading discussions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <button 
              onClick={() => window.location.reload()} 
              className="ml-2 underline"
            >
              Try Again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
                <div className="flex items-center gap-4 mb-4">
                  {selectedDiscussion.authorPhoto && (
                    <img 
                      src={selectedDiscussion.authorPhoto} 
                      alt={selectedDiscussion.authorName}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">{selectedDiscussion.authorName}</p>
                    <p className="text-sm text-gray-500">
                      Posted on {new Date(selectedDiscussion.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">{selectedDiscussion.title}</h2>
                <p className="text-gray-700 whitespace-pre-line">{selectedDiscussion.content}</p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare size={20} />
                Comments ({selectedDiscussion.comments.length})
              </h3>
              
              {selectedDiscussion.comments.length > 0 ? (
                <div className="space-y-4">
                  {selectedDiscussion.comments.map(comment => (
                    <Card key={comment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {comment.commenterPhoto && (
                            <img 
                              src={comment.commenterPhoto} 
                              alt={comment.commenterName}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="font-medium">{comment.commenterName}</p>
                              <span className="text-sm text-gray-500">{comment.date}</span>
                            </div>
                            <p className="text-gray-700 mt-1">{comment.text}</p>
                          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {discussions.map(discussion => (
              <Card 
                key={discussion.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedDiscussion(discussion)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    {discussion.authorPhoto && (
                      <img 
                        src={discussion.authorPhoto} 
                        alt={discussion.authorName}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="font-medium">{discussion.authorName}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{discussion.title}</h3>
                  <p className="text-gray-600 line-clamp-3 mb-4">{discussion.content}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      {new Date(discussion.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <MessageSquare size={14} />
                      {discussion.comments.length}
                    </span>
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