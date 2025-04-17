// app/api/searchBooks/route.js
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client using environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res)
{

  // Check if the request method is GET or POST
  if (req.method == 'GET')
  {
    const { query } = req.query;

    if (!query)
    {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Fetch data from Google Books API
    try{
    
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&key=${process.env.GOOGLE_BOOKS_API_KEY}`
      );

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) // Handle errors from the fetch request
    {
      console.error('Error fetching data from Google Books API:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  //handle POST requests
  else if (req.method == 'POST')
  {
    // Validate request body
    try
    {
      const { clubID, bookDetails } = req.body;

      if (!clubID || !bookDetails)
      {
        return res.status(400).json({ error: 'clubID and bookDetails are required' });
      }

      // Check if the bookDetails object has the required properties
      let { data: existingBook, error: lookupError } = await supabase
        .from('books')
        .select('id')
        .eq('id', bookDetails.id)
        .single();

      let bookId = bookDetails.id;

      // If the book does not exist in the database, insert it
      if (lookupError || !existingBook)
      {
        const { data: newBook, error: insertError } = await supabase
          .from('books')
          .insert([
            {
              id: bookDetails.id,
              author: bookDetails.authors || [],
              thumbnail: bookDetails.thumbnail,
              title: bookDetails.title,
            },
          ])
          .select()

        if (insertError){
          console.error('Error inserting new book:', insertError);
          return res.status(500).json({ error: 'Failed to add book', details: insertError });
        }

        // If the book was successfully inserted, get its ID
        if (newBook && newBook.length > 0)
        {
          bookId = newBook[0].id;
        }

      }

      // Check if the book is already in the club_books table, if not, insert it
    const { data: clubBook, error: clubBookError } = await supabase
      .from('club_books')
      .insert([
        {
          club_id: clubID,
          book_id: bookId,
        },
      ]);

      // Handle errors from the insert operation if club book already exists
      if (clubBookError)
      {
        if (clubBookError.code === '23505')
        {
          return res.status(409).json({ error: 'Book already exists in the club' });
        }

        throw clubBookError;
      }

      // If the book was successfully added to the club, return a success response
      return res.json({ success: 'Book added to club successfully', bookId });

    // Handle errors from the lookup operation
    } catch (error) {
      console.error('Error adding book to club:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Handle unsupported request methods
  else{
    res.setHeader('Allow', ['GET', 'POST']);
    return res.setStatus(405).json({ error: `Method ${req.method} Not Allowed` });
  }

}