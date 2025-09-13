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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const loadBooks = async () => {
    try {
      const data: BookData = await getBooks();
      setBooks(data.books);
    } catch (error) {
      console.error('Failed to load books:', error);
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
                    {selectedBook}
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
          <BookSelector books={books} onBookSelect={handleBookSelect} />
        ) : !selectedChapter ? (
          <ChapterSelector
            book={selectedBook}
            onChapterSelect={handleChapterSelect}
            onBack={handleBackToBooks}
          />
        ) : (
          <BibleReader
            book={selectedBook}
            chapter={selectedChapter}
            onBack={handleBackToChapters}
          />
        )}
      </main>
    </div>
  );
}

export default App;
