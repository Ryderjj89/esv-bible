import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Star } from 'lucide-react';
import { getBook } from '../services/api';

interface ChapterSelectorProps {
  book: string;
  onChapterSelect: (chapter: string) => void;
  onBack: () => void;
  formatBookName: (bookName: string) => string;
  user?: any;
}

const ChapterSelector: React.FC<ChapterSelectorProps> = ({ book, onChapterSelect, onBack, formatBookName, user }) => {
  const [chapters, setChapters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadChapters();
  }, [book]);

  // Load favorites when user is available
  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user, book]);

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/favorites', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const favoriteChapters: string[] = data.favorites
          .filter((fav: any) => fav.book === book && fav.chapter && !fav.verse_start) // Only chapter-level favorites for this book
          .map((fav: any) => fav.chapter);
        
        const chapterFavorites = new Set<string>(favoriteChapters);
        setFavorites(chapterFavorites);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const toggleFavorite = async (chapter: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent chapter selection when clicking star
    
    if (!user) return;

    const isFavorited = favorites.has(chapter);
    
    try {
      if (isFavorited) {
        // Remove favorite
        const response = await fetch('/api/favorites', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const chapterFavorite = data.favorites.find((fav: any) => 
            fav.book === book && fav.chapter === chapter && !fav.verse_start
          );
          
          if (chapterFavorite) {
            await fetch(`/api/favorites/${chapterFavorite.id}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            setFavorites(prev => {
              const newFavorites = new Set(prev);
              newFavorites.delete(chapter);
              return newFavorites;
            });
          }
        }
      } else {
        // Add favorite
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            book: book,
            chapter: chapter
          })
        });
        
        if (response.ok) {
          setFavorites(prev => new Set(prev).add(chapter));
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const loadChapters = async () => {
    try {
      setLoading(true);
      const response = await getBook(book);
      
      // The API now returns { chapters: ["1", "2", "3", ...] }
      if (response.chapters) {
        setChapters(response.chapters);
      } else {
        // Fallback: generate chapter numbers 1-50 (most books have fewer than 50 chapters)
        const fallbackChapters = Array.from({ length: 50 }, (_, i) => (i + 1).toString());
        setChapters(fallbackChapters);
      }
    } catch (error) {
      console.error('Failed to load chapters:', error);
      // Fallback: generate chapter numbers 1-50 (most books have fewer than 50 chapters)
      const fallbackChapters = Array.from({ length: 50 }, (_, i) => (i + 1).toString());
      setChapters(fallbackChapters);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-blue-600 animate-pulse mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading chapters...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Books</span>
        </button>
      </div>

      {/* Book Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {formatBookName(book)}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Select a chapter to read
        </p>
        {user && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Click the ★ to add chapters to your favorites
          </p>
        )}
      </div>

      {/* Chapters Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-w-4xl mx-auto">
        {chapters.map((chapter) => (
          <div key={chapter} className="relative">
            <button
              onClick={() => onChapterSelect(chapter)}
              className="group bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 text-center w-full"
            >
              <FileText className="mx-auto h-6 w-6 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {chapter}
              </span>
            </button>
            
            {/* Star button - only show for authenticated users */}
            {user && (
              <button
                onClick={(e) => toggleFavorite(chapter, e)}
                className="absolute top-1 right-1 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={favorites.has(chapter) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star 
                  className={`h-3 w-3 ${
                    favorites.has(chapter) 
                      ? 'text-yellow-500 fill-yellow-500' 
                      : 'text-gray-400 hover:text-yellow-500'
                  } transition-colors`}
                />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Chapter Count */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {chapters.length} chapters available
        </p>
      </div>
    </div>
  );
};

export default ChapterSelector;
