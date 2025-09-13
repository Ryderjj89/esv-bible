import React from 'react';
import { BookOpen } from 'lucide-react';

interface BookSelectorProps {
  books: string[];
  onBookSelect: (book: string) => void;
}

const BookSelector: React.FC<BookSelectorProps> = ({ books, onBookSelect }) => {
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
          <button
            key={book}
            onClick={() => onBookSelect(book)}
            className="group bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 text-center"
          >
            <BookOpen className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {book}
            </span>
          </button>
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
      </div>

      <BookGroup title="Old Testament" books={oldTestament} />
      <BookGroup title="New Testament" books={newTestament} />
    </div>
  );
};

export default BookSelector;
