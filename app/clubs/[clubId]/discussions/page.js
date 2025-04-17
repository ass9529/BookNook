'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft, Plus, X } from 'lucide-react';
import { Card, CardContent } from '../../../src/components/ui/card';
import { Button } from '../../../src/components/ui/button';
import { Input } from '../../../src/components/ui/input';
import { Textarea } from '../../../src/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '../../../src/components/ui/alert';
import supabase from '../../../supabaseClient';
import { Baloo_2 } from 'next/font/google';
import { useParams } from 'next/navigation';
import { notifyAllClubMembers } from '../../../utils/notifications';

const header2Font = Baloo_2({
  weight: ['800'],
  subsets: ['latin'],
});

const DiscussionsPage = () => {  
  const params = useParams();
  const clubId = params.clubId; 
  const router = useRouter();  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const MAX_TITLE_LENGTH = 100;
  const MAX_CONTENT_LENGTH = 1000;
  const MAX_COMMENT_LENGTH = 500;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!clubId) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch club-specific discussions
        const { data: discussionsData, error: discussionsError } = await supabase
          .from('discussions')
          .select(`
            *,
            author:profiles(username, photo_url)
          `)
          .eq('club_id', clubId)
          .order('created_at', { ascending: false });

        if (discussionsError) throw discussionsError;

        // Get discussion IDs for comment filtering
        const discussionIds = discussionsData.map(d => d.id);

        // Fetch comments only for these discussions
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            *,
            commenter:profiles(username, photo_url)
          `)
          .in('discussion_id', discussionIds)
          .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;

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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (clubId) fetchData();
  }, [router, clubId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewDiscussion({...newDiscussion, image: file});
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateDiscussion = async () => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !clubId) return;

      let imageUrl = null;
      if (newDiscussion.image) {
        const fileExt = newDiscussion.image.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `discussion-images/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('discussion-images')
          .upload(filePath, newDiscussion.image);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('discussion-images')
          .getPublicUrl(filePath);
        
        imageUrl = urlData.publicUrl;
      }

      // Include club_id in new discussion
      const { data: discussionData, error: discussionError } = await supabase
        .from('discussions')
        .insert([{
          title: newDiscussion.title,
          content: newDiscussion.content,
          user_id: user.id,
          image_url: imageUrl,
          club_id: clubId
        }])
        .select();

      if (discussionError) throw discussionError;

      // Send notifications
      await notifyAllClubMembers(
        clubId,
        'New Discussion',
        `New discussion, "${newDiscussion.title}", posted! Come share your thoughts`,
        'discussion_created'
      );

      // Refresh discussions with club filter
      const { data: refreshedDiscussions } = await supabase
        .from('discussions')
        .select(`
          *,
          author:profiles(username, photo_url)
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      const updatedDiscussions = refreshedDiscussions.map(discussion => ({
        ...discussion,
        authorName: discussion.author?.username || 'Anonymous',
        authorPhoto: discussion.author?.photo_url || null,
        comments: [] // New discussion starts with empty comments
      }));

      setDiscussions(updatedDiscussions);
      setShowCreateDialog(false);
      setNewDiscussion({ title: '', content: '', image: null });
      setImagePreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!clubId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Club not found
            <button 
              onClick={() => router.push('/')} 
              className="ml-2 underline"
            >
              Return Home
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleAddComment = async (discussionId, commentText) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      if (commentText.length > MAX_COMMENT_LENGTH) {
        setError(`Comment must be less than ${MAX_COMMENT_LENGTH} characters`);
        return;
      }

      const { error } = await supabase
        .from('comments')
        .insert([{
          discussion_id: discussionId,
          user_id: user.id,
          content: commentText
        }]);

      if (error) throw error;

      const { data: commentsData } = await supabase
        .from('comments')
        .select(`
          *,
          commenter:profiles(username, photo_url)
        `)
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: false });

      const updatedDiscussions = discussions.map(discussion => 
        discussion.id === discussionId
          ? {
              ...discussion,
              comments: commentsData.map(comment => ({
                id: comment.id,
                text: comment.content,
                date: new Date(comment.created_at).toLocaleDateString(),
                commenterName: comment.commenter?.username || 'Anonymous',
                commenterPhoto: comment.commenter?.photo_url || null
              }))
            }
          : discussion
      );

      setDiscussions(updatedDiscussions);
      
      if (selectedDiscussion?.id === discussionId) {
        setSelectedDiscussion(updatedDiscussions.find(d => d.id === discussionId));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.message);
    }
  };

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
      <section>
        <ul className="h-full w-64 bg-red-200 text-white rounded-3xl p-4 fixed left-5 top-48">
        <div className="flex justify-center items-center flex-wrap space-y-8 p-6"> 

        <button onClick={() => router.push('/landing')} className={`relative group px-2 py-2 rounded-lg bg-transparent text-gray-500 font-medium overflow-hidden bottom-5 ${header2Font.className}`}>
                <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
                <span className={`relative z-10 text-2xl tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Home</span>
              </button>
              <button onClick={() => router.push(`/clubs/${clubId}/reviews`)} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
                <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
                <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Book Reviews</span>
              </button>
              <button onClick={() => router.push(`/clubs/${clubId}/discussions`)} className={`relative group w-full px-4 py-2 rounded-lg  bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
                <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
                <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Discussions</span>
              </button>
              <button onClick={() => router.push(`/clubs/${clubId}/members`)} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
                <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
                <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Members</span>
              </button>
              <button onClick={() => router.push(`/clubs/${clubId}/calendar`)} className={`relative group w-full px-4 py-2 rounded-lg bg-black text-white font-medium overflow-hidden ${header2Font.className}`}>
                <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
                <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Calendar</span>
              </button>
              <button onClick={() => router.push(`/clubs/${clubId}/settings`)} className={`relative group w-full px-4 py-2 text-white font-medium overflow-hidden top-28 ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-base tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Settings</span>
            </button> 
            </div> 
        </ul>
      </section>

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
                {selectedDiscussion.image_url && (
                  <img 
                    src={selectedDiscussion.image_url} 
                    alt={selectedDiscussion.title}
                    className="max-w-full h-auto rounded-lg mb-4"
                  />
                )}
                <p className="text-gray-700 whitespace-pre-line">{selectedDiscussion.content}</p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare size={20} />
                Comments ({selectedDiscussion.comments.length})
              </h3>
              
              <div className="flex gap-4">
                <Input 
                  placeholder="Add a comment..."
                  maxLength={MAX_COMMENT_LENGTH}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      handleAddComment(selectedDiscussion.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <Button 
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling;
                    if (input.value.trim()) {
                      handleAddComment(selectedDiscussion.id, input.value);
                      input.value = '';
                    }
                  }}
                >
                  Post
                </Button>
              </div>
              <p className="text-sm text-gray-500 text-right">
                {MAX_COMMENT_LENGTH} characters max
              </p>

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
                  {discussion.image_url && (
                    <img 
                      src={discussion.image_url} 
                      alt={discussion.title}
                      className="max-w-full h-auto rounded-lg mb-4"
                    />
                  )}
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

        {!selectedDiscussion && (
          <button
            onClick={() => setShowCreateDialog(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <Plus size={32} />
          </button>
        )}

{showCreateDialog && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
    <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Create New Discussion</h2>
        <button 
          onClick={() => {
            setShowCreateDialog(false);
            setNewDiscussion({ title: '', content: '', image: null });
            setImagePreview(null);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      </div>

          {/* Scrollable Content */}
          <div className="flex-grow overflow-y-auto pr-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})}
                  maxLength={MAX_TITLE_LENGTH}
                  placeholder="Enter discussion title"
                />
                <p className="text-sm text-gray-500 text-right">
                  {newDiscussion.title.length}/{MAX_TITLE_LENGTH}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({...newDiscussion, content: e.target.value})}
                  maxLength={MAX_CONTENT_LENGTH}
                  placeholder="Enter discussion content"
                  rows={5}
                />
                <p className="text-sm text-gray-500 text-right">
                  {newDiscussion.content.length}/{MAX_CONTENT_LENGTH}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-red-50 file:text-red-700
                    hover:file:bg-red-100"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-4 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewDiscussion({ title: '', content: '', image: null });
                setImagePreview(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDiscussion}
              disabled={!newDiscussion.title || !newDiscussion.content || uploading}
            >
              {uploading ? 'Posting...' : 'Post Discussion'}
            </Button>
          </div>
        </div>
      </div>
    )}
      </div>
    </div>
  );
};

export default DiscussionsPage;