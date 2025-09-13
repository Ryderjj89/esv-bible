import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { getBook } from '../services/api';

interface ChapterSelectorProps {
  book: string;
  onChapterSelect: (chapter: string) => void;
  onBack: () => void;
  formatBookName: (bookName: string) => string;
}

const ChapterSelector: React.FC<ChapterSelectorProps> = ({ book, onChapterSelect, onBack, formatBookName }) => {
  const [chapters, setChapters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChapters();
  }, [book]);

  const loadChapters = async () => {
    try {
      setLoading(true);
      const bookContent = await getBook(book);

      // Parse markdown to extract chapter numbers
      const lines = bookContent.split('\n');
      const chapterNumbers: string[] = [];

      for (const line of lines) {
        // Look for chapter headers like "# 1" or "# 1\n"
        const chapterMatch = line.match(/^#\s+(\d+)/);
        if (chapterMatch) {
          chapterNumbers.push(chapterMatch[1]);
        }
      }

      setChapters(chapterNumbers);
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
      </div>

      {/* Chapters Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-w-4xl mx-auto">
        {chapters.map((chapter) => (
          <button
            key={chapter}
            onClick={() => onChapterSelect(chapter)}
            className="group bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 text-center"
          >
            <FileText className="mx-auto h-6 w-6 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {chapter}
            </span>
          </button>
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
