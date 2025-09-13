import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { getChapter } from '../services/api';

interface BibleReaderProps {
  book: string;
  chapter: string;
  onBack: () => void;
}

const BibleReader: React.FC<BibleReaderProps> = ({ book, chapter, onBack }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  useEffect(() => {
    loadChapter();
  }, [book, chapter]);

  const loadChapter = async () => {
    try {
      setLoading(true);
      const chapterContent = await getChapter(book, chapter);
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
        return 'text-base';
      case 'large':
        return 'text-xl';
      default:
        return 'text-lg';
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
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-3 py-1 text-xs rounded ${
                  fontSize === size
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                } transition-colors`}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chapter Title */}
      <div className="text-center mb-8">
        <h1 className="book-title">
          {book} {chapter}
        </h1>
      </div>

      {/* Bible Content */}
      <div className={`max-w-3xl mx-auto leading-relaxed ${getFontSizeClass()}`}>
        {parseBibleText(content)}
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-center mt-12 space-x-4">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Chapters
        </button>
      </div>
    </div>
  );
};

export default BibleReader;
