'use client';
import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, ChevronLeft, Plus, X } from 'lucide-react';
import { Card, CardContent } from '../../../src/components/ui/card';
import { Button } from '../../../src/components/ui/button';
import { Input } from '../../../src/components/ui/input';
import { Textarea } from '../../../src/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '../../../src/components/ui/alert';
import { Baloo_2 } from 'next/font/google';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import supabase from '../../../supabaseClient';

const header2Font = Baloo_2({
  weight: ['800'],
  subsets: ['latin'],
});

const ReviewsPage = () => { 
  const router = useRouter();  
  const params = useParams();
  const clubId = params.clubId; 
  const [selectedBook, setSelectedBook] = useState(null);
  const [showCreateBookDialog, setShowCreateBookDialog] = useState(false);
  const [showCreateReviewDialog, setShowCreateReviewDialog] = useState(false);
  const [newReview, setNewReview] = useState({ content: '', rating: 0 });
  const [review, setReviewError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Sample data
  useEffect(() => {
    const fetchData = async () =>{
      try {
        setLoading(true);
        if (!clubId) return;

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
                }));

              return {
                id: review.id,
                author: review.user.username,
                authorPhoto: review.user.photo_url,
                content: review.review_text,
                rating: review.rating,
                created_at: review.created_at,
                comments: reviewComments
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
              reviews: bookReviews
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
        
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={20}
        className={i < rating ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-300'}
      />
    ));
  };

  //ENTER NEW FUNCTIONS HERE

  const handleBookSearch = async () => {
    if(!searchQuery.trim()) return;
    
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
        thumbnail: item.volumeInfo.imageLinks?.thumbnail || '/book-covers/placeholder.jpg',
      };
    }) || [];

    setSearchResults(formattedResults);   
    } catch (error) {
      console.error('Error fetching search results:', error);
      setError('Failed to search for book. Please try again.');
    } finally {
      setSearching(false);
    }
};

const handleAddBookFromSearch = async (book) => {
  try{
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
      throw new Error(errorData.error || errorData.message || `Failed to add book to club: ${response.status}`)
    }

    const result = await response.json();

    //after successfully adding book to club, refresh the book list
    window.location.reload();

    //close the dialog
    setShowCreateBookDialog(false);
    setSearchQuery('');
    setSearchResults([]);
  } catch (error) {
    console.error('Error adding book:', error);
    setError(error.message || 'Failed to add book. Please try again.');
  }
};

  const handleCreateReview = async() => {
    try {
      setReviewError(null);

      if (!selectedBook) return;
      
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !clubId) return;


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
        comments: []
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
            averageRating
          };
        }
        return book;
      });
      
      setBooks(updatedBooks);
      setSelectedBook(updatedBooks.find(b => b.id === selectedBook.id));
      setShowCreateReviewDialog(false);
      setNewReview({ content: '', rating: 0 });
      
    } catch (err) {
      console.error('Error creating review:', err);
      setError(err.message);
    }
  };

  const handleAddComment = async(reviewId) => {
    try {
      if (!newComment.trim() || !selectedBook) return;
      
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
        created_at: commentData[0].created_at
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
        {selectedBook ? (
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setSelectedBook(null)} 
              className="flex items-center gap-2 text-black hover:text-gray-600"
            >
              <ChevronLeft size={24} />
              {selectedBook.title}
            </button>
            <Button onClick={() => setShowCreateReviewDialog(true)}>
              Add Review
            </Button>
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
                <img src={selectedBook.image_url} alt={selectedBook.title} className="w-32 h-48 object-cover rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {selectedBook.reviews.length > 0 ? (
              selectedBook.reviews.map(review => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="mb-4">
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
                      <div className="flex items-center gap-1 mt-2">
                        {renderStars(review.rating)}
                        <span className="text-gray-500 text-sm">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700">{review.content}</p>
                    
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
                        />
                        <Button onClick={() => handleAddComment(review.id)}>Post</Button>
                      </div>
                      
                      {review.comments.length > 0 ? (
                        review.comments.map(comment => (
                          <div key={comment.id} className="mt-4 pl-4 border-l-2 border-gray-200">
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
                            <p className="text-gray-700 mt-1">{comment.content}</p>
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
                    <img 
                      src={book.image_url || '/book-covers/placeholder.jpg'} 
                      alt={book.title} 
                      className="w-32 h-48 object-cover rounded-lg mb-4" 
                    />
                    <h3 className="text-lg font-bold text-center">{book.title}</h3>
                    <p className="text-gray-600 text-center mb-2">by {book.author}</p>
                    <div className="flex items-center gap-1">
                      {renderStars(Math.round(book.averageRating))}
                      <span className="text-gray-500 text-sm">({book.totalReviews} reviews)</span>
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

      {!selectedBook && (
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
        }} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
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
                <img 
                  src={book.thumbnail} 
                  alt={book.title}
                  className="w-16 h-24 object-cover rounded"
                  onError={(e) => e.target.src = '/book-covers/placeholder.jpg'}
                />
                <div className="flex-1">
                  <h4 className="font-medium">{book.title}</h4>
                  <p className="text-sm text-gray-600">{book.author}</p>
                  <Button 
                    className="mt-2"
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
              <button onClick={() => setShowCreateReviewDialog(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
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
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateReviewDialog(false)}>Cancel</Button>
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
    </div>
  </div>
);
};

export default ReviewsPage;