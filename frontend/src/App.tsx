import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Book, ChevronRight, Moon, Sun } from 'lucide-react';
import BookSelector from './components/BookSelector';
import ChapterSelector from './components/ChapterSelector';
import BibleReader from './components/BibleReader';
import { getBooks } from './services/api';

interface BookData {
  books: string[];
}

// Component for the home page
function HomePage({ books, formatBookName, getBookUrlName }: { books: string[], formatBookName: (name: string) => string, getBookUrlName: (name: string) => string }) {
  const navigate = useNavigate();
  
  const handleBookSelect = (book: string) => {
    const urlName = getBookUrlName(book);
    navigate(`/book/${urlName}`);
  };

  return <BookSelector books={books} onBookSelect={handleBookSelect} formatBookName={formatBookName} />;
}

// Component for book chapters page
function BookPage({ books, formatBookName, getBookFromUrl }: { books: string[], formatBookName: (name: string) => string, getBookFromUrl: (urlName: string) => string }) {
  const { bookName } = useParams<{ bookName: string }>();
  const navigate = useNavigate();

  const actualBookName = bookName ? getBookFromUrl(bookName) : '';

  const handleChapterSelect = (chapter: string) => {
    navigate(`/book/${bookName}/chapter/${chapter}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!bookName || !actualBookName || !books.includes(actualBookName)) {
    return <div>Book not found</div>;
  }

  return (
    <ChapterSelector
      book={actualBookName}
      onChapterSelect={handleChapterSelect}
      onBack={handleBack}
      formatBookName={formatBookName}
    />
  );
}

// Component for chapter reading page
function ChapterPage({ formatBookName, getBookFromUrl }: { formatBookName: (name: string) => string, getBookFromUrl: (urlName: string) => string }) {
  const { bookName, chapterNumber } = useParams<{ bookName: string, chapterNumber: string }>();
  const navigate = useNavigate();

  const actualBookName = bookName ? getBookFromUrl(bookName) : '';

  const handleBack = () => {
    navigate(`/book/${bookName}`);
  };

  if (!bookName || !chapterNumber || !actualBookName) {
    return <div>Chapter not found</div>;
  }

  return (
    <BibleReader
      book={actualBookName}
      chapter={chapterNumber}
      onBack={handleBack}
      formatBookName={formatBookName}
    />
  );
}

function App() {
  const [books, setBooks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authAvailable, setAuthAvailable] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [error, setError] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  // Debug logging
  console.log('App component rendered');

  useEffect(() => {
    console.log('App useEffect triggered');
    loadBooks();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setAuthAvailable(true);
      } else if (response.status === 501) {
        // Authentication not configured
        setAuthAvailable(false);
      } else {
        // Authentication configured but user not logged in
        setAuthAvailable(true);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      setAuthAvailable(false);
    }
  };

  const handleLogin = () => {
    window.location.href = '/auth/login';
  };

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      // Optionally reload the page to reset any user-specific state
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    // Apply dark mode and save preference
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Helper function to format book names for display
  const formatBookName = (bookName: string): string => {
    // Remove leading numbers and underscores, replace underscores with spaces
    return bookName.replace(/^\d+_/, '').replace(/_/g, ' ');
  };

  // Helper function to convert display name back to file name
  const getBookFileName = (displayName: string): string => {
    // Find the book that matches the display name
    const book = books.find(b => formatBookName(b) === displayName);
    return book || displayName;
  };

  // Helper function to convert book file name to URL-safe name
  const getBookUrlName = (bookName: string): string => {
    // Remove leading numbers and convert spaces to underscores for URL
    return bookName.replace(/^\d+_/, '').replace(/ /g, '_');
  };

  // Helper function to convert URL name back to file name
  const getBookFromUrl = (urlName: string): string => {
    // Convert URL name back to display name, then find the file name
    const displayName = urlName.replace(/_/g, ' ');
    return getBookFileName(displayName);
  };

  const loadBooks = async () => {
    try {
      console.log('Loading books from API...');
      const data: BookData = await getBooks();
      console.log('Books loaded:', data);
      setBooks(data.books);
    } catch (error) {
      console.error('Failed to load books:', error);
      setError('Failed to load books. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Get current navigation info from URL
  const getCurrentNavInfo = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      return { currentBook: null, currentChapter: null };
    }
    
    if (pathParts[0] === 'book' && pathParts[1]) {
      const currentBook = pathParts[1];
      const currentChapter = pathParts[2] === 'chapter' && pathParts[3] ? pathParts[3] : null;
      return { currentBook, currentChapter };
    }
    
    return { currentBook: null, currentChapter: null };
  };

  const { currentBook, currentChapter } = getCurrentNavInfo();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Book className="mx-auto h-12 w-12 text-blue-600 animate-pulse" />
          <p className="mt-4 text-lg">Loading ESV Bible...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Book className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <button 
                onClick={() => navigate('/')}
                className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
              >
                ESV Bible
              </button>
            </div>

            {/* Navigation Breadcrumb - Hidden on small screens */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              {currentBook && (
                <>
                  <button
                    onClick={() => navigate('/')}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Books
                  </button>
                  <ChevronRight className="h-4 w-4" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatBookName(currentBook)}
                  </span>
                  {currentChapter && (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      <button
                        onClick={() => navigate(`/book/${currentBook}`)}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        Chapters
                      </button>
                      <ChevronRight className="h-4 w-4" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Chapter {currentChapter}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Mobile Navigation - Simplified */}
            <div className="flex md:hidden items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
              {currentBook && (
                <>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatBookName(currentBook)}
                  </span>
                  {currentChapter && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Ch. {currentChapter}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* User Authentication & Dark Mode */}
            <div className="flex items-center space-x-2">
              {/* Authentication Button */}
              {authAvailable && (
                <div className="hidden sm:block">
                  {user ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {user.name || user.email}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleLogin}
                      className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Login
                    </button>
                  )}
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage books={books} formatBookName={formatBookName} getBookUrlName={getBookUrlName} />} />
          <Route path="/book/:bookName" element={<BookPage books={books} formatBookName={formatBookName} getBookFromUrl={getBookFromUrl} />} />
          <Route path="/book/:bookName/chapter/:chapterNumber" element={<ChapterPage formatBookName={formatBookName} getBookFromUrl={getBookFromUrl} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
