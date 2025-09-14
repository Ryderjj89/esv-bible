import React, { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp, X, Book, FileText, Quote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Favorite {
  id: number;
  book: string;
  chapter?: string;
  verse_start?: number;
  verse_end?: number;
  note?: string;
  created_at: string;
}

interface FavoritesMenuProps {
  user: any;
  formatBookName: (bookName: string) => string;
  getBookUrlName: (bookName: string) => string;
}

const FavoritesMenu: React.FC<FavoritesMenuProps> = ({ user, formatBookName, getBookUrlName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load favorites when user is available
  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/favorites', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: number) => {
    try {
      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setFavorites(favorites.filter(f => f.id !== favoriteId));
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  const navigateToFavorite = (favorite: Favorite) => {
    const urlBookName = getBookUrlName(favorite.book);
    
    if (favorite.chapter) {
      // Navigate to chapter
      navigate(`/book/${urlBookName}/chapter/${favorite.chapter}`);
    } else {
      // Navigate to book
      navigate(`/book/${urlBookName}`);
    }
    setIsOpen(false);
  };

  const getFavoriteDisplayText = (favorite: Favorite) => {
    const bookName = formatBookName(favorite.book);
    
    if (favorite.verse_start && favorite.verse_end) {
      return `${bookName} ${favorite.chapter}:${favorite.verse_start}-${favorite.verse_end}`;
    } else if (favorite.verse_start) {
      return `${bookName} ${favorite.chapter}:${favorite.verse_start}`;
    } else if (favorite.chapter) {
      return `${bookName} Chapter ${favorite.chapter}`;
    } else {
      return bookName;
    }
  };

  // Organize favorites by type
  const organizedFavorites = {
    books: favorites.filter(f => !f.chapter),
    chapters: favorites.filter(f => f.chapter && !f.verse_start),
    verses: favorites.filter(f => f.verse_start)
  };

  const renderFavoriteSection = (title: string, items: Favorite[], icon: React.ReactNode) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-2">
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          {icon}
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            {title} ({items.length})
          </span>
        </div>
        {items.map((favorite) => (
          <div
            key={favorite.id}
            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 group"
          >
            <button
              onClick={() => navigateToFavorite(favorite)}
              className="flex-1 text-left"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {getFavoriteDisplayText(favorite)}
              </div>
              {favorite.note && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {favorite.note}
                </div>
              )}
            </button>
            <button
              onClick={() => removeFavorite(favorite.id)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-opacity"
              title="Remove favorite"
            >
              <X className="h-3 w-3 text-red-500" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (!user) {
    return null; // Don't show favorites menu for non-authenticated users
  }

  return (
    <div className="relative">
      {/* Favorites Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
      >
        <Star className="h-4 w-4" />
        <span className="hidden sm:inline">Favorites</span>
        <span className="sm:hidden">★</span>
        {favorites.length > 0 && (
          <span className="bg-yellow-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
            {favorites.length}
          </span>
        )}
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {/* Favorites Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] sm:max-w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden transform sm:transform-none -translate-x-4 sm:translate-x-0">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">My Favorites</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading favorites...</div>
            ) : favorites.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No favorites yet</p>
                <p className="text-sm">Click the ★ next to books, chapters, or verses to add them here</p>
              </div>
            ) : (
              <div className="py-1">
                {renderFavoriteSection(
                  "Books", 
                  organizedFavorites.books, 
                  <Book className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                )}
                {renderFavoriteSection(
                  "Chapters", 
                  organizedFavorites.chapters, 
                  <FileText className="h-3 w-3 text-green-600 dark:text-green-400" />
                )}
                {renderFavoriteSection(
                  "Verses", 
                  organizedFavorites.verses, 
                  <Quote className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoritesMenu;
