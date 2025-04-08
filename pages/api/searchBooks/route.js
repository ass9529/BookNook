// app/api/books/search/route.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res)
{

  if (req.method == 'GET')
  {
    const { query } = req.query;

    if (!query)
    {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    try
    {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&key=${process.env.GOOGLE_BOOKS_API_KEY}`
      );

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error)
    {
      console.error('Error fetching data from Google Books API:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  //handle POST requests
  else if (req.method == 'POST')
  {
    try
    {
      const { clubID, bookDetails } = req.body;

      if (!clubID || !bookDetails)
      {
        return res.status(400).json({ error: 'clubID and bookDetails are required' });
      }

      let { data: existingBook, error: lookupError } = await supabase
        .from('books')
        .select('id')
        .eq('id', bookDetails.id)
        .single();

      let bookId = bookDetails.id;

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

        if (newBook && newBook.length > 0)
        {
          bookId = newBook[0].id;
        }

      }

    const { data: clubBook, error: clubBookError } = await supabase
      .from('club_books')
      .insert([
        {
          club_id: clubID,
          book_id: bookId,
        },
      ]);

      if (clubBookError)
      {
        if (clubBookError.code === '23505')
        {
          return res.status(409).json({ error: 'Book already exists in the club' });
        }

        throw clubBookError;
      }

      return res.json({ success: 'Book added to club successfully', bookId });

    } catch (error) {
      console.error('Error adding book to club:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  else{
    res.setHeader('Allow', ['GET', 'POST']);
    return res.setStatus(405).json({ error: `Method ${req.method} Not Allowed` });
  }

}