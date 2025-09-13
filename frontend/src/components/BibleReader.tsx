import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { getChapter, getBook } from '../services/api';

interface BibleReaderProps {
  book: string;
  chapter: string;
  onBack: () => void;
  formatBookName: (bookName: string) => string;
  user?: any;
}

const BibleReader: React.FC<BibleReaderProps> = ({ book, chapter, onBack, formatBookName, user }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    // Load font size preference from localStorage
    const saved = localStorage.getItem('fontSize');
    return (saved as 'small' | 'medium' | 'large') || 'medium';
  });

  useEffect(() => {
    loadChapter();
    loadChapters();
  }, [book, chapter]);

  // Load favorites when user is available
  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user, book, chapter]);

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/favorites', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const favoriteStrings: string[] = data.favorites
          .filter((fav: any) => fav.book === book && fav.chapter === chapter && fav.verse_start) // Only verse-level favorites for this chapter
          .map((fav: any) => fav.verse_end ? `${fav.verse_start}-${fav.verse_end}` : fav.verse_start.toString());
        
        const verseFavorites = new Set<string>(favoriteStrings);
        setFavorites(verseFavorites);
        console.log('Loaded verse favorites:', favoriteStrings);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const toggleFavorite = async (verseNumber: string) => {
    if (!user) return;

    const isFavorited = favorites.has(verseNumber);
    
    try {
      if (isFavorited) {
        // Remove favorite
        const response = await fetch('/api/favorites', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const verseFavorite = data.favorites.find((fav: any) => 
            fav.book === book && 
            fav.chapter === chapter && 
            fav.verse_start === parseInt(verseNumber)
          );
          
          if (verseFavorite) {
            const deleteResponse = await fetch(`/api/favorites/${verseFavorite.id}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            if (deleteResponse.ok) {
              setFavorites(prev => {
                const newFavorites = new Set(prev);
                newFavorites.delete(verseNumber);
                return newFavorites;
              });
              console.log('Removed verse favorite:', verseNumber);
            }
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
            chapter: chapter,
            verse_start: parseInt(verseNumber)
          })
        });
        
        if (response.ok) {
          setFavorites(prev => new Set(prev).add(verseNumber));
          console.log('Added verse favorite:', verseNumber);
        } else if (response.status === 409) {
          // 409 means it already exists, which is fine - just update the UI
          setFavorites(prev => new Set(prev).add(verseNumber));
          console.log('Verse favorite already exists, updated UI:', verseNumber);
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const loadChapters = async () => {
    try {
      const response = await getBook(book);
      if (response.chapters) {
        setChapters(response.chapters);
      }
    } catch (error) {
      console.error('Failed to load chapters:', error);
    }
  };

  const getCurrentChapterIndex = () => {
    return chapters.findIndex((ch: string) => ch === chapter);
  };

  const getPreviousChapter = () => {
    const currentIndex = getCurrentChapterIndex();
    return currentIndex > 0 ? chapters[currentIndex - 1] : null;
  };

  const getNextChapter = () => {
    const currentIndex = getCurrentChapterIndex();
    return currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  };

  const handlePreviousChapter = () => {
    const prevChapter = getPreviousChapter();
    if (prevChapter) {
      // Navigate to previous chapter - this would need to be passed from parent
      window.location.href = window.location.href.replace(`/chapter/${chapter}`, `/chapter/${prevChapter}`);
    }
  };

  const handleNextChapter = () => {
    const nextChapter = getNextChapter();
    if (nextChapter) {
      // Navigate to next chapter - this would need to be passed from parent
      window.location.href = window.location.href.replace(`/chapter/${chapter}`, `/chapter/${nextChapter}`);
    }
  };

  useEffect(() => {
    // Save font size preference to localStorage
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  const handleFontSizeChange = (newSize: 'small' | 'medium' | 'large') => {
    console.log(`Changing font size from ${fontSize} to ${newSize}`);
    setFontSize(newSize);
  };

  const loadChapter = async () => {
    try {
      setLoading(true);
      console.log(`Loading chapter: ${book}/${chapter}`);
      
      // Format chapter as "Chapter_XX" with leading zero
      const paddedChapter = chapter.padStart(2, '0');
      const chapterFileName = `Chapter_${paddedChapter}`;
      console.log(`Chapter file name: ${chapterFileName}`);
      
      const chapterContent = await getChapter(book, chapterFileName);
      setContent(chapterContent);
    } catch (error) {
      console.error('Failed to load chapter:', error);
      setContent('Error loading chapter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'font-size-small';
      case 'large':
        return 'font-size-large';
      default:
        return 'font-size-medium';
    }
  };

  const parseBibleText = (text: string) => {
    const lines = text.split('\n');
    const verses: JSX.Element[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      // Check if line starts with verse number (e.g., "1 ", "2 ", etc.)
      const verseMatch = line.match(/^(\d+)\s+(.+)$/);
      if (verseMatch) {
        const verseNumber = verseMatch[1];
        const verseText = verseMatch[2];

        verses.push(
          <div key={`verse-${verseNumber}`} className="mb-4 flex items-start hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors group">
            {/* Star button - only show for authenticated users */}
            {user && (
              <button
                onClick={() => toggleFavorite(verseNumber)}
                className={`mr-2 mt-1 p-1 rounded transition-all ${
                  favorites.has(verseNumber) 
                    ? 'opacity-100' 
                    : 'opacity-30 hover:opacity-100 group-hover:opacity-100'
                } hover:bg-gray-200 dark:hover:bg-gray-600`}
                title={favorites.has(verseNumber) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star 
                  className={`h-3 w-3 ${
                    favorites.has(verseNumber) 
                      ? 'text-yellow-500 fill-yellow-500' 
                      : 'text-gray-400 hover:text-yellow-500'
                  } transition-colors`}
                />
              </button>
            )}
            <div className="flex-1">
              <span className="verse-number font-semibold text-blue-600 dark:text-blue-400 mr-2">{verseNumber}</span>
              <span className="bible-text">{verseText}</span>
            </div>
          </div>
        );
      } else if (line.startsWith('#')) {
        // Chapter header
        const headerText = line.replace(/^#+\s*/, '');
        verses.push(
          <h2 key={`header-${i}`} className="chapter-title text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 mt-8">
            {headerText}
          </h2>
        );
      } else {
        // Regular text (continuation of previous verse or other content)
        verses.push(
          <p key={`text-${i}`} className="bible-text mb-4 text-gray-700 dark:text-gray-300">
            {line}
          </p>
        );
      }
    }

    return verses;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-blue-600 animate-pulse mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading chapter...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Chapters</span>
        </button>

        {/* Font Size Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Font Size:</span>
          <div className="flex space-x-1">
            <button
              onClick={() => handleFontSizeChange('small')}
              className={`px-3 py-1 text-xs rounded ${
                fontSize === 'small'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              } transition-colors`}
            >
              Small
            </button>
            <button
              onClick={() => handleFontSizeChange('medium')}
              className={`px-3 py-1 text-xs rounded ${
                fontSize === 'medium'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              } transition-colors`}
            >
              Medium
            </button>
            <button
              onClick={() => handleFontSizeChange('large')}
              className={`px-3 py-1 text-xs rounded ${
                fontSize === 'large'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              } transition-colors`}
            >
              Large
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {formatBookName(book)} {chapter}
        </h1>
        {user && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Hover over verses to see ★ and add them to your favorites
          </p>
        )}
      </div>

      {/* Bible Content */}
      <div className={`max-w-3xl mx-auto ${getFontSizeClass()}`}>
        {parseBibleText(content)}
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-center items-center mt-12 space-x-4">
        {/* Previous Chapter Button */}
        {getPreviousChapter() && (
          <button
            onClick={handlePreviousChapter}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
        )}

        {/* Back to Chapters Button */}
        <button
          onClick={onBack}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Chapters
        </button>

        {/* Next Chapter Button */}
        {getNextChapter() && (
          <button
            onClick={handleNextChapter}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BibleReader;
