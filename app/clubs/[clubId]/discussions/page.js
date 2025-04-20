'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ChevronLeft, Plus, X, Edit, Save, Trash2 } from 'lucide-react';
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
  const [currentUser, setCurrentUser] = useState(null);
  const [clubData, setClubData] = useState(null);

  const [editingDiscussion, setEditingDiscussion] = useState(false);
  const [editedDiscussion, setEditedDiscussion] = useState({
    title: '',
    content: ''
  });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');

  // State for confirmation dialogs
  const [showDeleteDiscussionConfirm, setShowDeleteDiscussionConfirm] = useState(false);
  const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

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

        //set current user
        setCurrentUser(user);

        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', clubId)
          .single();

        if (clubError) {
          console.error('Error fetching club data:', clubError);
          return;
        }

        setClubData(clubData);

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
              commenterPhoto: comment.commenter?.photo_url || null,
              user_id: comment.user_id,
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


  const getClubName = () => {
    return (
      <>
        <span className="text-gray-700 not-italic">Club</span>{' '}
        <span className="italic" style={{ color: '#F5F5F4' }}>{clubData.name}</span>
      </>
    );
  };
  
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

      const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', clubId)
          .single();

        if (clubError) {
          console.error('Error fetching club data:', clubError);
          return;
        }

      // Send notifications
      await notifyAllClubMembers(
        clubId,
        'New Discussion',
        `${clubData.name}: New discussion, "${newDiscussion.title}", posted! Come share your thoughts`,
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

  const handleEditDiscussion = async () => {
    try {
      if (!selectedDiscussion || !currentUser) return;

      //check if user is the author of the discussion]
      if (selectedDiscussion.user_id !== currentUser.id) {
        setError('You can only edit your own discussions');
        return;
      }

      const { error } = await supabase
        .from('discussions')
        .update({
          title: editedDiscussion.title,
          content: editedDiscussion.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDiscussion.id);

        if (error) throw error;

        //update the discussions state
        const updatedDiscussions = discussions.map(discussion => 
          discussion.id === selectedDiscussion.id
            ? {
                ...discussion,
                title: editedDiscussion.title,
                content: editedDiscussion.content,
              }
            : discussion
        );

        setDiscussions(updatedDiscussions);
        setEditingDiscussion(false);

      }catch (err) {
        console.error('Error editing discussion:', err);
        setError(err.message);
      }
    };

  const startEditingDiscussion = () => {
    if(!selectedDiscussion) return;

    setEditedDiscussion({
      title: selectedDiscussion.title,
      content: selectedDiscussion.content
    });

    setEditingDiscussion(true);
  };

  const handleEditComment = async (commentId) => {
    try{
      if (!selectedDiscussion || !currentUser) return;

      //find the comment to edit
      const comment = selectedDiscussion.comments.find(c => c.id === commentId);

      //check if user is the author of the comment
      if (comment.user_id !== currentUser.id) {
        setError('You can only edit your own comments');
        return;
      }

      if(editedCommentText.length > MAX_COMMENT_LENGTH) {
        setError(`Comment must be less than ${MAX_COMMENT_LENGTH} characters`);
        return;
      }

      //update comment in the database
      const { error } = await supabase
        .from('comments')
        .update({
          content: editedCommentText,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

        if (error) throw error;

        //update the comments
        const updatedComments = selectedDiscussion.comments.map(comment =>
          comment.id === commentId
            ? { ...comment, text: editedCommentText }
            : comment
        );

        //update the discussions array
        const updatedDiscussions = discussions.map(discussion => 
          discussion.id === selectedDiscussion.id
            ? { ...discussion, comments: updatedComments }         
            : discussion
        );

        setDiscussions(updatedDiscussions);

        //update the selected discussion
        const updatedSelectedDiscussion = {
          ...selectedDiscussion,
          comments: updatedComments
        };

        setSelectedDiscussion(updatedSelectedDiscussion);
        setEditingCommentId(null);
        setEditedCommentText('');

    } catch (err) {
      console.error('Error updating comment:', err);
      setError(err.message);
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.text);
  };

  const handleDeleteComment = (commentId) => {
    try {
      if (!selectedDiscussion || !currentUser) return;

      const comment = selectedDiscussion.comments.find(c => c.id === commentId);

      // Check if user is the author of the comment
      if (comment.user_id !== currentUser.id) {
        setError('You can only delete your own comments');
        return;
      }

      // Show confirmation dialog
      setCommentToDelete(commentId);
      setShowDeleteCommentConfirm(true);
      
    } catch (err) {
      console.error('Error preparing to delete comment:', err);
      setError(err.message);
    }
  };

  const confirmDeleteComment = async () => {
    try {
      if (!commentToDelete) return;

      // Delete comment from the database
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentToDelete);

      if (error) throw error;

      // Remove comments from local state
      const updatedComments = selectedDiscussion.comments.filter(
        comment => comment.id !== commentToDelete
      );

      // Update the discussions array
      const updatedDiscussions = discussions.map(discussion =>
        discussion.id === selectedDiscussion.id
          ? { ...discussion, comments: updatedComments }
          : discussion
      );

      setDiscussions(updatedDiscussions);

      // Update the selected discussion
      const updatedSelectedDiscussion = {
        ...selectedDiscussion,
        comments: updatedComments
      };

      setSelectedDiscussion(updatedSelectedDiscussion);
      
      // Close the confirmation dialog
      setShowDeleteCommentConfirm(false);
      setCommentToDelete(null);
      
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err.message);
      setShowDeleteCommentConfirm(false);
      setCommentToDelete(null);
    }
  };

  // Function to handle discussion deletion
  const handleDeleteDiscussion = () => {
    try {
      if (!selectedDiscussion || !currentUser) return;

      // Check if user is the author of the discussion
      if (selectedDiscussion.user_id !== currentUser.id) {
        setError('You can only delete your own discussions');
        return;
      }

      // Show confirmation dialog
      setShowDeleteDiscussionConfirm(true);
      
    } catch (err) {
      console.error('Error preparing to delete discussion:', err);
      setError(err.message);
    }
  };

  const confirmDeleteDiscussion = async () => {
    try {
      // Delete discussion from the database
      const { error } = await supabase
        .from('discussions')
        .delete()
        .eq('id', selectedDiscussion.id);

      if (error) throw error;

      // Remove discussion from local state
      const updatedDiscussions = discussions.filter(
        discussion => discussion.id !== selectedDiscussion.id
      );

      setDiscussions(updatedDiscussions);
      setSelectedDiscussion(null);
      
      // Close the confirmation dialog
      setShowDeleteDiscussionConfirm(false);
      
    } catch (err) {
      console.error('Error deleting discussion:', err);
      setError(err.message);
      setShowDeleteDiscussionConfirm(false);
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
                commenterPhoto: comment.commenter?.photo_url || null,
                user_id: comment.user_id
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
        <div className="flex justify-center items-center mb-4">
            <h1 className={`text-2xl font-bold text-black ${header2Font.className}`}>
              {clubData ? getClubName() : ''}
            </h1>
          </div>  
        <div className="flex justify-center items-center flex-wrap space-y-8 p-6"> 

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
              <span className={`relative z-10 text-xl tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Settings</span>
              </button> 
              <button onClick={() => router.push('/landing')} className={`relative group px-2 py-2 w-full bg-transparent text-gray-600 font-medium overflow-hidden bottom-5 ${header2Font.className}`}>
              <span className="absolute inset-0 bg-red-200 transition-transform translate-x-full group-hover:translate-x-0 group-hover:rounded-lg group-hover:border-4 group-hover:border-black"></span>
              <span className={`relative z-10 text-xl tracking-wide transition-colors duration-300 group-hover:text-black ${header2Font.className}`}>Home</span>
            </button>
            </div> 
        </ul>
      </section>

      <div className="ml-72 p-8 w-full">
        <h1 className={`text-3xl font-bold text-black mb-8 ${header2Font.className}`}>
          {selectedDiscussion ? (
            <div className="flex justify-between items-center">
            <button 
                onClick={() => {
                  setEditingDiscussion(false);
                  setSelectedDiscussion(null);
                }}
                className="flex items-center gap-2 text-black hover:text-gray-600"
              >
                <ChevronLeft size={24} />
                {editingDiscussion ? 'Editing: ' + selectedDiscussion.title : selectedDiscussion.title}
            </button>
            {/* only show edit/delete buttons if user is the author */}
            {currentUser && selectedDiscussion.user_id === currentUser.id && !editingDiscussion && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={startEditingDiscussion}
                  className="flex items-center gap-1"
                >
                  <Edit size={16} />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteDiscussion}
                  className="flex items-center gap-1"
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>
            )}
          </div>
          ) : (
            "Community Discussions"
          )}
        </h1>

        {selectedDiscussion ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                {editingDiscussion ? (
                  //editing form for discussion  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <Input
                        value={editedDiscussion.title}
                        onChange={(e) => setEditedDiscussion({...editedDiscussion, title: e.target.value})}
                        maxLength={MAX_TITLE_LENGTH}
                        placeholder="Enter discussion title"
                      />
                      <p className="text-sm text-gray-500 text-right">
                        {editedDiscussion.title.length}/{MAX_TITLE_LENGTH}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Textarea
                        value={editedDiscussion.content}
                        onChange={(e) => setEditedDiscussion({...editedDiscussion, content: e.target.value})}
                        maxLength={MAX_CONTENT_LENGTH}
                        placeholder="Enter discussion content"
                        rows={5}
                      />
                      <p className="text-sm text-gray-500 text-right">
                        {editedDiscussion.content.length}/{MAX_CONTENT_LENGTH}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingDiscussion(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleEditDiscussion}
                        disabled={!editedDiscussion.title || !editedDiscussion.content}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                 <>
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
                </>
                )}
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
                        {editingCommentId === comment.id ? (
                          //edit form for comment
                          <div className="space-y-3">
                            <Textarea
                              value={editedCommentText}
                              onChange={(e) => setEditedCommentText(e.target.value)}
                              maxLength={MAX_COMMENT_LENGTH}
                              rows={3}
                            />
                            <p className="text-sm text-gray-500 text-right">
                              {editedCommentText.length}/{MAX_COMMENT_LENGTH}
                            </p>
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditedCommentText('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleEditComment(comment.id)}
                                disabled={!editedCommentText.trim()}
                              >
                                <Save size={16} className="mr-1" />
                                Update Comment
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Regular comment view
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {comment.commenterPhoto && (
                                <img 
                                  src={comment.commenterPhoto} 
                                  alt={comment.commenterName}
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                            </div>
                            <div className="flex-grow">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{comment.commenterName}</p>
                                  <span className="text-sm text-gray-500">{comment.date}</span>
                                </div>
                                {/* Only show for user's own comments */}
                                {currentUser && comment.user_id === currentUser.id && (
                                  <div className="flex gap-2 ml-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => startEditingComment(comment)}
                                      className="h-8 px-2"
                                    >
                                      <Edit size={16} />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="h-8 px-2 text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <p className="text-gray-700 mt-1">{comment.text}</p>
                            </div>
                          </div>
                        )}
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
    {/* Delete Discussion Confirmation Dialog */}
    {showDeleteDiscussionConfirm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Delete Discussion</h2>
          <p className="mb-6">Are you sure you want to delete this discussion? This will also delete all comments.</p>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDiscussionConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteDiscussion}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Comment Confirmation Dialog */}
    {showDeleteCommentConfirm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Delete Comment</h2>
          <p className="mb-6">Are you sure you want to delete this comment?</p>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteCommentConfirm(false);
                setCommentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteComment}
            >
              Delete
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