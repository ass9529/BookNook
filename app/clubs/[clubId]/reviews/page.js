'use client';
import React, { useState } from 'react';
import { Star, MessageSquare, ChevronLeft, Plus, X } from 'lucide-react';
import { Card, CardContent } from '../../../src/components/ui/card';
import { Button } from '../../../src/components/ui/button';
import { Input } from '../../../src/components/ui/input';
import { Textarea } from '../../../src/components/ui/textarea';
import { Baloo_2 } from 'next/font/google';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

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
  const [newBook, setNewBook] = useState({ title: '', author: '', image_url: '' });
  const [newReview, setNewReview] = useState({ content: '', rating: 0 });
  const [newComment, setNewComment] = useState('');

  // Sample data
  const [books, setBooks] = useState([{
    id: 1,
    title: "The Midnight Library",
    author: "Matt Haig",
    image_url: "/book-covers/midnight-library.jpg",
    averageRating: 4.5,
    totalReviews: 2,
    reviews: [{
      id: 1,
      author: "Alice",
      content: "An amazing journey through possibilities!",
      rating: 5,
      comments: [{
        id: 1,
        commenter: "Bob",
        content: "Totally agree!",
      }]
    }]
  }]);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={20}
        className={i < rating ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-300'}
      />
    ));
  };

  const handleCreateBook = () => {
    const newId = books.length + 1;
    setBooks([...books, {
      id: newId,
      ...newBook,
      averageRating: 0,
      totalReviews: 0,
      reviews: []
    }]);
    setShowCreateBookDialog(false);
    setNewBook({ title: '', author: '', image_url: '' });
  };

  const handleCreateReview = () => {
    const updatedBooks = books.map(book => {
      if (book.id === selectedBook.id) {
        const newReviewId = book.reviews.length + 1;
        return {
          ...book,
          reviews: [...book.reviews, {
            id: newReviewId,
            author: "User",
            content: newReview.content,
            rating: newReview.rating,
            comments: []
          }],
          totalReviews: book.reviews.length + 1,
          averageRating: ((book.averageRating * book.reviews.length) + newReview.rating) / (book.reviews.length + 1)
        };
      }
      return book;
    });
    
    setBooks(updatedBooks);
    setSelectedBook(updatedBooks.find(b => b.id === selectedBook.id));
    setShowCreateReviewDialog(false);
    setNewReview({ content: '', rating: 0 });
  };

  const handleAddComment = (reviewId) => {
    if (!newComment.trim()) return;

    const updatedBooks = books.map(book => {
      if (book.id === selectedBook.id) {
        return {
          ...book,
          reviews: book.reviews.map(review => {
            if (review.id === reviewId) {
              const newCommentId = review.comments.length + 1;
              return {
                ...review,
                comments: [...review.comments, {
                  id: newCommentId,
                  commenter: "User",
                  content: newComment
                }]
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
  };

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
            <button onClick={() => router.push('/settings')} className={`relative group w-full px-4 py-2 text-white font-medium overflow-hidden top-28 ${header2Font.className}`}>
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
                      <span className="text-gray-500">({selectedBook.reviews.length} reviews)</span>
                    </div>
                  </div>
                  <img src={selectedBook.image_url} alt={selectedBook.title} className="w-32 h-48 object-cover rounded-lg" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {selectedBook.reviews.map(review => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <p className="font-medium">{review.author}</p>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.content}</p>
                    
                    <div className="mt-6 space-y-4">
                      <div className="flex gap-4 mt-4">
                        <Input 
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(review.id)}
                        />
                        <Button onClick={() => handleAddComment(review.id)}>Post</Button>
                      </div>
                      
                      {review.comments.map(comment => (
                        <div key={comment.id} className="mt-4 pl-4 border-l-2 border-gray-200">
                          <p className="font-medium">{comment.commenter}</p>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map(book => (
              <Card 
                key={book.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedBook(book)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <img src={book.image_url} alt={book.title} className="w-32 h-48 object-cover rounded-lg mb-4" />
                    <h3 className="text-lg font-bold text-center">{book.title}</h3>
                    <p className="text-gray-600 text-center mb-2">by {book.author}</p>
                    <div className="flex items-center gap-1">
                      {renderStars(Math.round(book.averageRating))}
                      <span className="text-gray-500 text-sm">({book.totalReviews} reviews)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Book</h2>
                <button onClick={() => setShowCreateBookDialog(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Book Title</label>
                  <Input value={newBook.title} onChange={(e) => setNewBook({...newBook, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Book Author</label>
                  <Input value={newBook.author} onChange={(e) => setNewBook({...newBook, author: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cover Image URL</label>
                  <Input value={newBook.image_url} onChange={(e) => setNewBook({...newBook, image_url: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateBookDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateBook} disabled={!newBook.title || !newBook.author}>Add Book</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCreateReviewDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Review for {selectedBook?.title}</h2>
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
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateReviewDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateReview} disabled={!newReview.content || !newReview.rating}>Post Review</Button>
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