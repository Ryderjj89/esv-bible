import React, { useState, useEffect } from 'react';
import { Book, ChevronRight, Moon, Sun } from 'lucide-react';
import BookSelector from './components/BookSelector';
import ChapterSelector from './components/ChapterSelector';
import BibleReader from './components/BibleReader';
import { getBooks } from './services/api';

interface BookData {
  books: string[];
}

function App() {
  const [books, setBooks] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [error, setError] = useState<string>('');

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

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
    setSelectedChapter('');
  };

  const handleChapterSelect = (chapter: string) => {
    setSelectedChapter(chapter);
  };

  const handleBackToBooks = () => {
    setSelectedBook('');
    setSelectedChapter('');
  };

  const handleBackToChapters = () => {
    setSelectedChapter('');
  };

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
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                ESV Bible
              </h1>
            </div>

            {/* Navigation Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              {selectedBook && (
                <>
                  <button
                    onClick={handleBackToBooks}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Books
                  </button>
                  <ChevronRight className="h-4 w-4" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatBookName(selectedBook)}
                  </span>
                  {selectedChapter && (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      <button
                        onClick={handleBackToChapters}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        Chapters
                      </button>
                      <ChevronRight className="h-4 w-4" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Chapter {selectedChapter}
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
        {!selectedBook ? (
          <BookSelector books={books} onBookSelect={handleBookSelect} formatBookName={formatBookName} />
        ) : !selectedChapter ? (
          <ChapterSelector
            book={selectedBook}
            onChapterSelect={handleChapterSelect}
            onBack={handleBackToBooks}
            formatBookName={formatBookName}
          />
        ) : (
          <BibleReader
            book={selectedBook}
            chapter={selectedChapter}
            onBack={handleBackToChapters}
            formatBookName={formatBookName}
          />
        )}
      </main>
    </div>
  );
}

export default App;
