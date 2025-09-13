import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { getChapter, getBook } from '../services/api';

interface BibleReaderProps {
  book: string;
  chapter: string;
  onBack: () => void;
  formatBookName: (bookName: string) => string;
}

const BibleReader: React.FC<BibleReaderProps> = ({ book, chapter, onBack, formatBookName }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    // Load font size preference from localStorage
    const saved = localStorage.getItem('fontSize');
    return (saved as 'small' | 'medium' | 'large') || 'medium';
  });

  useEffect(() => {
    loadChapter();
    loadChapters();
  }, [book, chapter]);

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
    return chapters.findIndex(ch => ch === chapter);
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
          <div key={`verse-${verseNumber}`} className="mb-4">
            <span className="verse-number">{verseNumber}</span>
            <span className="bible-text">{verseText}</span>
          </div>
        );
      } else if (line.startsWith('#')) {
        // Chapter header
        const headerText = line.replace(/^#+\s*/, '');
        verses.push(
          <h2 key={`header-${i}`} className="chapter-title">
            {headerText}
          </h2>
        );
      } else {
        // Regular text (continuation of previous verse or other content)
        verses.push(
          <p key={`text-${i}`} className="bible-text mb-4">
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
        <h1 className="book-title">
          {formatBookName(book)} {chapter}
        </h1>
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
