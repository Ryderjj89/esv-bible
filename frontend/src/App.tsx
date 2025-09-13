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
function HomePage({ books, formatBookName }: { books: string[], formatBookName: (name: string) => string }) {
  const navigate = useNavigate();
  
  const handleBookSelect = (book: string) => {
    navigate(`/book/${book}`);
  };

  return <BookSelector books={books} onBookSelect={handleBookSelect} formatBookName={formatBookName} />;
}

// Component for book chapters page
function BookPage({ books, formatBookName }: { books: string[], formatBookName: (name: string) => string }) {
  const { bookName } = useParams<{ bookName: string }>();
  const navigate = useNavigate();

  const handleChapterSelect = (chapter: string) => {
    navigate(`/book/${bookName}/chapter/${chapter}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!bookName || !books.includes(bookName)) {
    return <div>Book not found</div>;
  }

  return (
    <ChapterSelector
      book={bookName}
      onChapterSelect={handleChapterSelect}
      onBack={handleBack}
      formatBookName={formatBookName}
    />
  );
}

// Component for chapter reading page
function ChapterPage({ formatBookName }: { formatBookName: (name: string) => string }) {
  const { bookName, chapterNumber } = useParams<{ bookName: string, chapterNumber: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(`/book/${bookName}`);
  };

  if (!bookName || !chapterNumber) {
    return <div>Chapter not found</div>;
  }

  return (
    <BibleReader
      book={bookName}
      chapter={chapterNumber}
      onBack={handleBack}
      formatBookName={formatBookName}
    />
  );
}

function App() {
  const [books, setBooks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

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
            <div className="flex items-center space-x-4">
              <Book className="h-8 w-8 text-blue-600" />
              <button 
                onClick={() => navigate('/')}
                className="text-xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
              >
                ESV Bible
              </button>
            </div>

            {/* Navigation Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
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

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage books={books} formatBookName={formatBookName} />} />
          <Route path="/book/:bookName" element={<BookPage books={books} formatBookName={formatBookName} />} />
          <Route path="/book/:bookName/chapter/:chapterNumber" element={<ChapterPage formatBookName={formatBookName} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
