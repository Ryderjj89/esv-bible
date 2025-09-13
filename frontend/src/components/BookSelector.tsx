import React, { useState, useEffect } from 'react';
import { BookOpen, Star } from 'lucide-react';

interface BookSelectorProps {
  books: string[];
  onBookSelect: (book: string) => void;
  formatBookName: (bookName: string) => string;
  user?: any;
}

const BookSelector: React.FC<BookSelectorProps> = ({ books, onBookSelect, formatBookName, user }) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Load favorites when user is available or when component mounts
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites(new Set()); // Clear favorites when no user
    }
  }, [user]);

  // Also reload favorites when books change (page refresh)
  useEffect(() => {
    if (user && books.length > 0) {
      loadFavorites();
    }
  }, [books, user]);

  const loadFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/favorites', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const favoriteBooks: string[] = data.favorites
          .filter((fav: any) => !fav.chapter) // Only book-level favorites
          .map((fav: any) => fav.book);
        
        const bookFavorites = new Set<string>(favoriteBooks);
        setFavorites(bookFavorites);
        console.log('Loaded book favorites:', favoriteBooks);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (book: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent book selection when clicking star
    
    if (!user) return;

    const isFavorited = favorites.has(book);
    
    try {
      if (isFavorited) {
        // Remove favorite
        const response = await fetch('/api/favorites', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const bookFavorite = data.favorites.find((fav: any) => fav.book === book && !fav.chapter);
          
          if (bookFavorite) {
            const deleteResponse = await fetch(`/api/favorites/${bookFavorite.id}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            if (deleteResponse.ok) {
              setFavorites(prev => {
                const newFavorites = new Set(prev);
                newFavorites.delete(book);
                return newFavorites;
              });
              console.log('Removed book favorite:', book);
            }
          }
        }
      } else {
        // Add favorite - simplified like ChapterSelector
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            book: book
          })
        });
        
        if (response.ok) {
          setFavorites(prev => new Set(prev).add(book));
          console.log('Added book favorite:', book);
        } else {
          console.error('Failed to add favorite:', response.status, response.statusText);
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // Group books by testament
  const oldTestament = books.slice(0, 39); // First 39 books
  const newTestament = books.slice(39); // Remaining books

  const BookGroup: React.FC<{ title: string; books: string[] }> = ({ title, books }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {books.map((book) => (
          <div key={book} className="relative">
            <button
              onClick={() => onBookSelect(book)}
              className="group bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 text-center w-full"
            >
              <BookOpen className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {formatBookName(book)}
              </span>
            </button>
            
            {/* Star button - only show for authenticated users */}
            {user && (
              <button
                onClick={(e) => toggleFavorite(book, e)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={favorites.has(book) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star 
                  className={`h-4 w-4 ${
                    favorites.has(book) 
                      ? 'text-yellow-500 fill-yellow-500' 
                      : 'text-gray-400 hover:text-yellow-500'
                  } transition-colors`}
                />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          ESV Bible
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Select a book to begin reading
        </p>
        {user && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Click the ★ to add books to your favorites
          </p>
        )}
      </div>

      <BookGroup title="Old Testament" books={oldTestament} />
      <BookGroup title="New Testament" books={newTestament} />
    </div>
  );
};

export default BookSelector;
