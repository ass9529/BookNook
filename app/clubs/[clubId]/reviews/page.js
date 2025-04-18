'use client';
import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, ChevronLeft, Plus, X, Edit, Save, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../../../src/components/ui/card';
import { Button } from '../../../src/components/ui/button';
import { Input } from '../../../src/components/ui/input';
import { Textarea } from '../../../src/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '../../../src/components/ui/alert';
import { Baloo_2 } from 'next/font/google';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import supabase from '../../../supabaseClient';
import { notifyAllClubMembers } from '../../../utils/notifications';

const header2Font = Baloo_2({
  weight: ['800'],
  subsets: ['latin'],
});

// Define character limits
const MAX_REVIEW_LENGTH = 3000;
const MAX_COMMENT_LENGTH = 800;

// Define a placeholder image as an inline SVG with improved styling and text
const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='150' viewBox='0 0 100 150'%3E%3Crect width='100' height='150' fill='%23f0f0f0' stroke='%23cccccc' stroke-width='2'/%3E%3Cpath d='M15,20 L85,20 L85,130 L15,130 Z' fill='%23e0e0e0' stroke='%23bbbbbb'/%3E%3Ctext x='50' y='80' font-family='Arial' font-size='12' font-weight='bold' text-anchor='middle' fill='%23888888'%3ECover%3C/text%3E%3Ctext x='50' y='95' font-family='Arial' font-size='10' text-anchor='middle' fill='%23888888'%3EUnavailable%3C/text%3E%3C/svg%3E";

const ReviewsPage = () => { 
  const router = useRouter();  
  const params = useParams();
  const clubId = params.clubId; 
  const [selectedBook, setSelectedBook] = useState(null);
  const [showCreateBookDialog, setShowCreateBookDialog] = useState(false);
  const [showCreateReviewDialog, setShowCreateReviewDialog] = useState(false);
  const [newReview, setNewReview] = useState({ content: '', rating: 0 });
  const [newComment, setNewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [clubData, setClubData] = useState(null);
  
  // States for editing functionality
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editedReview, setEditedReview] = useState({
    content: '',
    rating: 0
  });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  
  // State for confirmation dialogs
  const [showDeleteReviewConfirm, setShowDeleteReviewConfirm] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [commentParentReviewId, setCommentParentReviewId] = useState(null);
  
  // Book dialog error state
  const [bookDialogError, setBookDialogError] = useState('');
  
  // Review dialog error state
  const [reviewDialogError, setReviewDialogError] = useState('');

  // Sample data
  useEffect(() => {
    const fetchData = async () =>{
      try {
        setLoading(true);
        if (!clubId) return;

        const { data, error } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', clubId)
          .single();

        if (error) {
          console.error('Error fetching club data:', error);
          return;
        }

        setClubData(data);

        const { data: { user }} = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

      //user profile info:
      const { data: profileData, error: userProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if(userProfileError) throw userProfileError;
      

      setCurrentUser({
        id: user.id,
        username: profileData.username,
        photo_url: profileData.photo_url,
      });

      //check if user is host of this club
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('owner_id')
        .eq('id', clubId)
        .single();

        if (clubError) throw clubError;

        //set isHost state based on whether current user is the club owner
        setIsHost(user.id === clubData.owner_id);

        //fetch books for this club
        const { data: clubBooksData, error: booksError } = await supabase
          .from('club_books')
          .select(`
            id,
            books(
              id,
              title,
              author,
              thumbnail
              ) 
            `)
          .eq('club_id', clubId);

        if (booksError) throw booksError;

        const booksData = clubBooksData.map(item => ({
          id: item.books.id,
          title: item.books.title,
          author: item.books.author,
          thumbnail: item.books.thumbnail,
          club_book_id: item.id,
        }))
      
        const bookIds = booksData.map(book => book.id);

        //reviews for these books
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            user:profiles(username, photo_url)
            `)
          .in('book_id', bookIds)
          .eq('c_id', clubId)
          .order('created_at', { ascending: false });


        if (reviewsError) 
        {
          throw reviewsError;
        }

        //get reviewIds for comment filtering
        const reviewIds = reviewsData.map(review => review.id);

        //fetch comments for these reviews
        const { data: commentsData, error: commentsError } = await supabase
          .from('review_comments')
          .select(`
              *,
              user:profiles(username, photo_url)
            `)
          .in('reviews_id', reviewIds)
          .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;

        console.log('reading book with reviews function');

        //combine all data
        const bookWithReviews = booksData.map(book => {
          //get all reviews for this book
          const bookReviews = reviewsData
            .filter(review => review.book_id === book.id)
            .map(review => {
              //get all comments for this review
              const reviewComments = commentsData
                .filter(comment => comment.reviews_id === review.id)
                .map(comment => ({
                  id: comment.id,
                  commenter: comment.user.username,
                  commenterPhoto: comment.user.photo_url,
                  content: comment.content,
                  created_at: comment.created_at,
                  user_id: comment.user_id // Store user_id for permission checking
                }));

              return {
                id: review.id,
                author: review.user.username,
                authorPhoto: review.user.photo_url,
                content: review.review_text,
                rating: review.rating,
                created_at: review.created_at,
                comments: reviewComments,
                user_id: review.user_id // Store user_id for permission checking
              };

            });

            const totalRating = bookReviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = bookReviews.length > 0 ? totalRating / bookReviews.length : 0;

            return {
              id: book.id,
              title: book.title,
              author: book.author,
              image_url: book.thumbnail,
              club_book_id: book.club_book_id,
              averageRating,
              totalReviews: bookReviews.length,
              reviews: bookReviews,
              // Check if current user has already reviewed this book
              currentUserReviewed: bookReviews.some(review => review.user_id === user.id)
            }
        });
      
      setBooks(bookWithReviews);
    } catch (err){
      console.error('Error fetching books:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (clubId) fetchData();
}, [clubId]);

  const getClubName = () => {
    return (
      <>
        <span className="text-gray-700 not-italic">Club</span>{' '}
        <span className="italic" style={{ color: '#F5F5F4' }}>{clubData.name}</span>
      </>
    );
  };

        
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={20}
        className={i < rating ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-300'}
      />
    ));
  };

  // Function to render editable stars for review editing
  const renderEditableStars = (rating, onRatingChange) => {
    return [...Array(5)].map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onRatingChange(i + 1)}
        className={`p-1 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        <Star size={24} fill={i < rating ? 'currentColor' : 'none'} />
      </button>
    ));
  };

  const handleBookSearch = async () => {
    if(!searchQuery.trim()) return;
    
    // Clear any previous errors
    setBookDialogError('');
    setSearching(true);
    
    try{
      const response = await fetch(`/api/searchBooks/route?query=${searchQuery}`);
      if(!response.ok) {
        throw new Error('Error fetching search results');
      }

    const data = await response.json();

    //transforms api response into a format that can be used to display book results
    const formattedResults = data.items?.map(item => {
      //format array into a string
      let authorString = '';
      if (item.volumeInfo.authors && Array.isArray(item.volumeInfo.authors)) {
        authorString = item.volumeInfo.authors.join(', ');
      } else if (item.volumeInfo.authors){
        authorString = item.volumeInfo.authors;
      } else {
        authorString = 'Unknown Author';
      }

      console.log(authorString);

      return {
        id: item.id,
        title: item.volumeInfo.title,
        author: authorString,
        thumbnail: item.volumeInfo.imageLinks?.thumbnail || placeholderImage,
      };
    }) || [];

    setSearchResults(formattedResults);   
    } catch (error) {
      console.error('Error fetching search results:', error);
      setBookDialogError('Failed to search for book. Please try again.');
    } finally {
      setSearching(false);
    }
};

const handleAddBookFromSearch = async (book) => {
  try{
    // Clear any previous errors
    setBookDialogError('');
    
    //prevent non-hosts from adding books
    if (!isHost) {
      setBookDialogError('Only the host can add books to the club.');
      return;
    }

    const bookDetails = {
      id: book.id,
      title: book.title,
      authors: book.author,
      thumbnail: book.thumbnail || ''
    };

    const response = await fetch('/api/searchBooks/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clubID: clubId,
        bookDetails,
      })
    });

    if(!response.ok) {
      const errorData = await response.json();
      // Check for a duplicate book error (this depends on your API response)
      if (errorData.message && errorData.message.includes('already exists')) {
        setBookDialogError(`"${book.title}" is already in this club's library.`);
        return;
      }
      throw new Error(errorData.error || errorData.message || `Failed to add book to club: ${response.status}`)
    }

    const result = await response.json();

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
      'New Book',
      `${clubData.name}: New Book, "${book.title}", posted! Time to rate and review`,
      'discussion_created'
    );

    //after successfully adding book to club, refresh the book list
    window.location.reload();

    //close the dialog
    setShowCreateBookDialog(false);
    setSearchQuery('');
    setSearchResults([]);
  } catch (error) {
    console.error('Error adding book:', error);
    setBookDialogError(error.message || 'Failed to add book. Please try again.');
  }
};

  const handleCreateReview = async() => {
    try {
      if (!selectedBook) return;
      
      // Clear any previous errors
      setReviewDialogError('');
      
      // Validate review content length
      if (newReview.content.length > MAX_REVIEW_LENGTH) {
        setReviewDialogError(`Review must be less than ${MAX_REVIEW_LENGTH} characters`);
        return;
      }
      
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !clubId) return;

      // Check if user has already reviewed this book
      if (selectedBook.currentUserReviewed) {
        setReviewDialogError('You have already reviewed this book');
        return;
      }

      // Add new review to database
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .insert([{
          book_id: selectedBook.id,
          user_id: user.id,
          review_text: newReview.content,
          rating: newReview.rating,
          c_id: clubId
        }])
        .select();

      if (reviewError) throw reviewError;

      // Get user profile for display purposes
      const { data: userData } = await supabase
        .from('profiles')
        .select('username, photo_url')
        .eq('id', user.id)
        .single();

      // Create the new review object
      const newReviewObj = {
        id: reviewData[0].id,
        author: userData.username,
        authorPhoto: userData.photo_url,
        content: newReview.content,
        rating: newReview.rating,
        created_at: reviewData[0].created_at,
        comments: [],
        user_id: user.id // Add user_id for permission checking
      };

      // Update the books state with the new review
      const updatedBooks = books.map(book => {
        if (book.id === selectedBook.id) {
          const newReviews = [...book.reviews, newReviewObj];
          const totalRating = newReviews.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = totalRating / newReviews.length;
          
          return {
            ...book,
            reviews: newReviews,
            totalReviews: newReviews.length,
            averageRating,
            currentUserReviewed: true
          };
        }
        return book;
      });
      
      setBooks(updatedBooks);
      setSelectedBook({
        ...selectedBook,
        reviews: [...selectedBook.reviews, newReviewObj],
        totalReviews: selectedBook.totalReviews + 1,
        currentUserReviewed: true
      });
      setShowCreateReviewDialog(false);
      setNewReview({ content: '', rating: 0 });
      
    } catch (err) {
      console.error('Error creating review:', err);
      setReviewDialogError(err.message || 'Failed to create review. Please try again.');
    }
  };

  // Function to handle editing a review
  const handleEditReview = async (reviewId) => {
    try {
      if (!selectedBook || !currentUser) return;

      // Validate review content length
      if (editedReview.content.length > MAX_REVIEW_LENGTH) {
        setError(`Review must be less than ${MAX_REVIEW_LENGTH} characters`);
        return;
      }

      // Find the review
      const review = selectedBook.reviews.find(r => r.id === reviewId);
      
      // Check if user is the author of the review
      if (review.user_id !== currentUser.id) {
        setError("You can only edit your own reviews");
        return;
      }

      // Update review in the database
      const { error } = await supabase
        .from('reviews')
        .update({
          review_text: editedReview.content,
          rating: editedReview.rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      // Update reviews in local state
      const updatedReviews = selectedBook.reviews.map(review => 
        review.id === reviewId
          ? { 
              ...review, 
              content: editedReview.content, 
              rating: editedReview.rating 
            }
          : review
      );

      // Recalculate average rating
      const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = updatedReviews.length > 0 ? totalRating / updatedReviews.length : 0;

      // Update the books state
      const updatedBooks = books.map(book => 
        book.id === selectedBook.id
          ? { 
              ...book, 
              reviews: updatedReviews,
              averageRating
            }
          : book
      );

      setBooks(updatedBooks);
      setSelectedBook({
        ...selectedBook,
        reviews: updatedReviews,
        averageRating
      });
      
      setEditingReviewId(null);
      setEditedReview({ content: '', rating: 0 });

    } catch (err) {
      console.error('Error updating review:', err);
      setError(err.message);
    }
  };

  // Function to start editing a review
  const startEditingReview = (review) => {
    setEditingReviewId(review.id);
    setEditedReview({
      content: review.content,
      rating: review.rating
    });
  };

  const handleAddComment = async(reviewId) => {
    try {
      if (!newComment.trim() || !selectedBook) return;
      
      // Validate comment length
      if (newComment.length > MAX_COMMENT_LENGTH) {
        setError(`Comment must be less than ${MAX_COMMENT_LENGTH} characters`);
        return;
      }
      
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Add new comment to database
      const { data: commentData, error: commentError } = await supabase
        .from('review_comments')
        .insert([{
          reviews_id: reviewId,
          user_id: user.id,
          content: newComment
        }])
        .select();

      if (commentError) throw commentError;

      // Get user profile for display purposes
      const { data: userData } = await supabase
        .from('profiles')
        .select('username, photo_url')
        .eq('id', user.id)
        .single();

      // Create the new comment object
      const newCommentObj = {
        id: commentData[0].id,
        commenter: userData.username,
        commenterPhoto: userData.photo_url,
        content: newComment,
        created_at: commentData[0].created_at,
        user_id: user.id // Add user_id for permission checking
      };

      // Update the books state with the new comment
      const updatedBooks = books.map(book => {
        if (book.id === selectedBook.id) {
          return {
            ...book,
            reviews: book.reviews.map(review => {
              if (review.id === reviewId) {
                return {
                  ...review,
                  comments: [...review.comments, newCommentObj]
                };
              }
              return review;
            })
          };
        }
        return book;
      });
      
      setBooks(updatedBooks);
      setSelectedBook(updatedBooks.find(b => b.id === selectedBook.id));
      setNewComment('');
      
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.message);
    }
  };

  // Function to handle editing a comment
  const handleEditComment = async (reviewId, commentId) => {
    try {
      if (!selectedBook || !currentUser) return;

      // Validate comment length
      if (editedCommentText.length > MAX_COMMENT_LENGTH) {
        setError(`Comment must be less than ${MAX_COMMENT_LENGTH} characters`);
        return;
      }

      // Find the review
      const review = selectedBook.reviews.find(r => r.id === reviewId);
      if (!review) return;

      // Find the comment
      const comment = review.comments.find(c => c.id === commentId);
      
      // Check if user is the author of the comment
      if (comment.user_id !== currentUser.id) {
        setError("You can only edit your own comments");
        return;
      }

      // Update comment in the database
      const { error } = await supabase
        .from('review_comments')
        .update({
          content: editedCommentText,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;

      // Update comments in local state
      const updatedBooks = books.map(book => {
        if (book.id === selectedBook.id) {
          return {
            ...book,
            reviews: book.reviews.map(rev => {
              if (rev.id === reviewId) {
                return {
                  ...rev,
                  comments: rev.comments.map(c => 
                    c.id === commentId
                      ? { ...c, content: editedCommentText }
                      : c
                  )
                };
              }
              return rev;
            })
          };
        }
        return book;
      });

      setBooks(updatedBooks);
      setSelectedBook(updatedBooks.find(b => b.id === selectedBook.id));
      
      setEditingCommentId(null);
      setEditedCommentText('');

    } catch (err) {
      console.error('Error updating comment:', err);
      setError(err.message);
    }
  };

  // Function to start editing a comment
  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.content);
  };

  // Function to handle deleting a review
  const handleDeleteReview = (reviewId) => {
    try {
      if (!selectedBook || !currentUser) return;

      // Find the review
      const review = selectedBook.reviews.find(r => r.id === reviewId);
      
      // Check if user is the author of the review
      if (review.user_id !== currentUser.id) {
        setError("You can only delete your own reviews");
        return;
      }

      // Show confirmation dialog
      setReviewToDelete(reviewId);
      setShowDeleteReviewConfirm(true);

    } catch (err) {
      console.error('Error preparing to delete review:', err);
      setError(err.message);
    }
  };

  const confirmDeleteReview = async () => {
    try {
      // Delete review from the database
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewToDelete);

      if (error) throw error;

      // Remove review from local state
      const updatedReviews = selectedBook.reviews.filter(r => r.id !== reviewToDelete);
      
      // Recalculate average rating
      const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = updatedReviews.length > 0 ? totalRating / updatedReviews.length : 0;

      // Update the books state
      const updatedBooks = books.map(book => 
        book.id === selectedBook.id
          ? { 
              ...book, 
              reviews: updatedReviews,
              totalReviews: updatedReviews.length,
              averageRating,
              currentUserReviewed: updatedReviews.some(r => r.user_id === currentUser.id)
            }
          : book
      );

      setBooks(updatedBooks);
      setSelectedBook({
        ...selectedBook,
        reviews: updatedReviews,
        totalReviews: updatedReviews.length,
        averageRating,
        currentUserReviewed: updatedReviews.some(r => r.user_id === currentUser.id)
      });

      // Close the confirmation dialog
      setShowDeleteReviewConfirm(false);
      setReviewToDelete(null);

    } catch (err) {
      console.error('Error deleting review:', err);
      setError(err.message);
    }
  };

  // Function to handle deleting a comment
  const handleDeleteComment = (reviewId, commentId) => {
    try {
      if (!selectedBook || !currentUser) return;

      // Find the review
      const review = selectedBook.reviews.find(r => r.id === reviewId);
      if (!review) return;

      // Find the comment
      const comment = review.comments.find(c => c.id === commentId);
      
      // Check if user is the author of the comment
      if (comment.user_id !== currentUser.id) {
        setError("You can only delete your own comments");
        return;
      }

      // Show confirmation dialog
      setCommentToDelete(commentId);
      setCommentParentReviewId(reviewId);
      setShowDeleteCommentConfirm(true);

    } catch (err) {
      console.error('Error preparing to delete comment:', err);
      setError(err.message);
    }
  };

  const confirmDeleteComment = async () => {
    try {
      // Delete comment from the database
      const { error } = await supabase
        .from('review_comments')
        .delete()
        .eq('id', commentToDelete);

      if (error) throw error;

      // Update comments in local state
      const updatedBooks = books.map(book => {
        if (book.id === selectedBook.id) {
          return {
            ...book,
            reviews: book.reviews.map(rev => {
              if (rev.id === commentParentReviewId) {
                return {
                  ...rev,
                  comments: rev.comments.filter(c => c.id !== commentToDelete)
                };
              }
              return rev;
            })
          };
        }
        return book;
      });

      setBooks(updatedBooks);
      setSelectedBook(updatedBooks.find(b => b.id === selectedBook.id));

      // Close the confirmation dialog
      setShowDeleteCommentConfirm(false);
      setCommentToDelete(null);
      setCommentParentReviewId(null);

    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err.message);
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

if (loading) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p>Loading books and reviews...</p>
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
      {/* Main content error alerts */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="h-8 px-2"
            >
              <X size={16} />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <h1 className={`text-3xl font-bold text-black mb-8 ${header2Font.className}`}>
        {selectedBook ? (
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setSelectedBook(null)} 
              className="flex items-center gap-2 text-black hover:text-gray-600"
            >
              <ChevronLeft size={24} />
              {selectedBook.title}
            </button>
            {/* Only show Add Review button if user hasn't already reviewed this book */}
            {!selectedBook.currentUserReviewed && (
              <Button onClick={() => setShowCreateReviewDialog(true)}>
                Add Review
              </Button>
            )}
          </div>
        ) : "Book Reviews"}
      </h1>

      {selectedBook ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{selectedBook.title}</h2>
                  <p className="text-gray-600">by {selectedBook.author}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {renderStars(Math.round(selectedBook.averageRating))}
                    <span className="text-gray-500">({selectedBook.totalReviews} reviews)</span>
                  </div>
                </div>
                <div className="w-32 h-48 flex-shrink-0">
                  <img 
                    src={selectedBook.image_url || placeholderImage} 
                    alt={selectedBook.title} 
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => { e.target.src = placeholderImage }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {selectedBook.reviews.length > 0 ? (
              selectedBook.reviews.map(review => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    {editingReviewId === review.id ? (
                      // Editing form for review
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Your Rating</label>
                          <div className="flex gap-1">
                            {renderEditableStars(editedReview.rating, (rating) => 
                              setEditedReview({...editedReview, rating})
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Review Content</label>
                          <Textarea
                            value={editedReview.content}
                            onChange={(e) => setEditedReview({...editedReview, content: e.target.value})}
                            rows={5}
                            placeholder="Edit your review..."
                            maxLength={MAX_REVIEW_LENGTH}
                          />
                          <p className="text-sm text-gray-500 text-right mt-1">
                            {editedReview.content.length}/{MAX_REVIEW_LENGTH} characters
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setEditingReviewId(null);
                              setEditedReview({ content: '', rating: 0 });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleEditReview(review.id)}
                            disabled={!editedReview.content || !editedReview.rating}
                          >
                            <Save size={16} className="mr-1" />
                            Update Review
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Normal review view
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            {review.authorPhoto && (
                              <img 
                                src={review.authorPhoto} 
                                alt={review.author}
                                className="w-8 h-8 rounded-full" 
                              />
                            )}
                            <p className="font-medium">{review.author}</p>
                          </div>
                          
                          {/* Edit/Delete buttons for review */}
                          {currentUser && currentUser.id === review.user_id && (
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => startEditingReview(review)}
                                className="h-8 px-2"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteReview(review.id)}
                                className="h-8 px-2 text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2 mb-4">
                          {renderStars(review.rating)}
                          <span className="text-gray-500 text-sm">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.content}</p>
                      </>
                    )}
                    
                    <div className="mt-6 space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <MessageSquare size={16} />
                        Comments ({review.comments.length})
                      </h4>
                      
                      <div className="flex gap-4 mt-4">
                        <Input 
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(review.id)}
                          maxLength={MAX_COMMENT_LENGTH}
                        />
                        <Button onClick={() => handleAddComment(review.id)}>Post</Button>
                      </div>
                      <p className="text-sm text-gray-500 text-right">
                        {newComment.length}/{MAX_COMMENT_LENGTH} characters
                      </p>
                      
                      {review.comments.length > 0 ? (
                        review.comments.map(comment => (
                          <div key={comment.id} className="mt-4 pl-4 border-l-2 border-gray-200">
                            {editingCommentId === comment.id ? (
                              // Editing form for comment
                              <div className="space-y-3">
                                <Textarea
                                  value={editedCommentText}
                                  onChange={(e) => setEditedCommentText(e.target.value)}
                                  rows={3}
                                  placeholder="Edit your comment..."
                                  maxLength={MAX_COMMENT_LENGTH}
                                />
                                <p className="text-sm text-gray-500 text-right">
                                  {editedCommentText.length}/{MAX_COMMENT_LENGTH} characters
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
                                    onClick={() => handleEditComment(review.id, comment.id)}
                                    disabled={!editedCommentText.trim()}
                                  >
                                    <Save size={16} className="mr-1" />
                                    Update Comment
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // Normal comment view
                              <>
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    {comment.commenterPhoto && (
                                      <img 
                                        src={comment.commenterPhoto} 
                                        alt={comment.commenter}
                                        className="w-6 h-6 rounded-full" 
                                      />
                                    )}
                                    <p className="font-medium">{comment.commenter}</p>
                                    <span className="text-gray-500 text-xs">
                                      {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  {/* Edit/Delete buttons for comment */}
                                  {currentUser && currentUser.id === comment.user_id && (
                                    <div className="flex gap-2 ml-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => startEditingComment(comment)}
                                        className="h-6 px-2"
                                      >
                                        <Edit size={14} />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteComment(review.id, comment.id)}
                                        className="h-6 px-2 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <p className="text-gray-700 mt-1">{comment.content}</p>
                              </>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm italic">No comments yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Alert>
                <AlertDescription>No reviews yet. Be the first to review this book!</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.length > 0 ? (
            books.map(book => (
              <Card 
                key={book.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedBook(book)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-48 mb-4">
                      <img 
                        src={book.image_url || placeholderImage} 
                        alt={book.title} 
                        className="w-full h-full object-cover rounded-lg" 
                        onError={(e) => { e.target.src = placeholderImage }}
                      />
                    </div>
                    <div className="w-full min-h-[80px] flex flex-col items-center">
                      <h3 className="text-lg font-bold text-center line-clamp-2">{book.title}</h3>
                      <p className="text-gray-600 text-center mb-2 line-clamp-1">by {book.author}</p>
                      <div className="flex items-center gap-1">
                        {renderStars(Math.round(book.averageRating))}
                        <span className="text-gray-500 text-sm">({book.totalReviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-10 text-gray-500">
              No books have been added to this club yet.
            </div>
          )}
        </div>
      )}

      {!selectedBook && isHost && (
        <button
          onClick={() => setShowCreateBookDialog(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
        >
          <Plus size={32} />
        </button>
      )}

{showCreateBookDialog && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Add Book to Club</h2>
        <button onClick={() => {
          setShowCreateBookDialog(false);
          setSearchQuery('');
          setSearchResults([]);
          setBookDialogError(''); // Clear any errors when closing
        }} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>
      
      {/* Error message displayed within the dialog */}
      {bookDialogError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{bookDialogError}</span>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        {/* Search Box */}
        <div>
          <label className="block text-sm font-medium mb-1">Search by title or author</label>
          <div className="flex gap-2">
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter book title or author name"
              onKeyDown={(e) => e.key === 'Enter' && handleBookSearch()}
            />
            <Button 
              onClick={handleBookSearch}
              disabled={searching || !searchQuery.trim()}
            >
              {searching ? '...' : 'Search'}
            </Button>
          </div>
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 ? (
          <div className="space-y-4 mt-4">
            {searchResults.map(book => (
              <div key={book.id} className="border rounded-lg p-3 flex gap-3">
                <div className="w-16 h-24 flex-shrink-0">
                  <img 
                    src={book.thumbnail} 
                    alt={book.title}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => { e.target.src = placeholderImage }}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-medium line-clamp-2">{book.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-1">{book.author}</p>
                  </div>
                  <Button 
                    className="w-fit mt-2"
                    onClick={() => handleAddBookFromSearch(book)}
                  >
                    Add to Club
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery && !searching ? (
          <p className="text-gray-500 text-center py-4">Press search to find books.</p>
        ) : null}
      </div>
    </div>
  </div>
)}

      {showCreateReviewDialog && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Review for {selectedBook.title}</h2>
              <button onClick={() => {
                setShowCreateReviewDialog(false);
                setReviewDialogError(''); // Clear any errors when closing
              }} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            {/* Error message displayed within the dialog */}
            {reviewDialogError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{reviewDialogError}</span>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your Rating</label>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setNewReview({...newReview, rating: i + 1})}
                      className={`p-1 ${i < newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <Star size={24} fill={i < newReview.rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Review Content</label>
                <Textarea
                  value={newReview.content}
                  onChange={(e) => setNewReview({...newReview, content: e.target.value})}
                  rows={5}
                  placeholder="Share your thoughts about this book..."
                  maxLength={MAX_REVIEW_LENGTH}
                />
                <p className="text-sm text-gray-500 text-right mt-1">
                  {newReview.content.length}/{MAX_REVIEW_LENGTH} characters
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowCreateReviewDialog(false);
                  setReviewDialogError('');
                }}>Cancel</Button>
                <Button 
                  onClick={handleCreateReview} 
                  disabled={!newReview.content || !newReview.rating}
                >
                  Post Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Review Confirmation Dialog */}
      {showDeleteReviewConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Review</h2>
            <p className="mb-6">Are you sure you want to delete this review? This will also delete all comments.</p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteReviewConfirm(false);
                  setReviewToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDeleteReview}
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
                  setCommentParentReviewId(null);
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

export default ReviewsPage;