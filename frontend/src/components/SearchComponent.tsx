import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Book, ChevronRight, Loader2 } from 'lucide-react';
import { searchBible, SearchResult, SearchResponse } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface SearchComponentProps {
  formatBookName: (bookName: string) => string;
  getBookUrlName: (bookName: string) => string;
  books?: string[];
  onClose?: () => void;
  isModal?: boolean;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  formatBookName,
  getBookUrlName,
  books = [],
  onClose,
  isModal = false
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();

  // Debounced search function
  const debouncedSearch = useCallback(async (searchQuery: string, bookFilter?: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const searchOptions = {
        ...(bookFilter && { book: bookFilter }),
        limit: 50,
        context: true
      };

      const response: SearchResponse = await searchBible(searchQuery, searchOptions);
      setResults(response.results);
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search input changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      debouncedSearch(query, selectedBook);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, selectedBook, debouncedSearch]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    const urlBookName = getBookUrlName(formatBookName(result.book));
    navigate(`/book/${urlBookName}/chapter/${result.chapter}`);
    if (onClose) onClose();
  };

  // Highlight search terms in text
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;
    
    const words = searchQuery.toLowerCase().split(/\s+/);
    let highlightedText = text;
    
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
    });
    
    return highlightedText;
  };

  const containerClasses = isModal 
    ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    : "w-full max-w-4xl mx-auto";

  const contentClasses = isModal
    ? "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
    : "bg-white dark:bg-gray-800 rounded-lg shadow-lg";

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Search Bible
            </h2>
          </div>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for verses, words, or phrases..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
              )}
            </div>
            
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Books</option>
              {books.map((book) => (
                <option key={book} value={book}>
                  {formatBookName(book)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {error && (
            <div className="p-4 text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-2">Try different keywords or check your spelling</p>
            </div>
          )}

          {!loading && !error && !hasSearched && query.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Book className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Enter a search term to find verses</p>
              <p className="text-sm mt-2">Search for words, phrases, or topics across the entire Bible</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((result, index) => (
                <div
                  key={`${result.book}-${result.chapter}-${result.verse}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  {/* Reference */}
                  <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                    <span>{formatBookName(result.book)}</span>
                    <ChevronRight className="h-3 w-3 mx-1" />
                    <span>Chapter {result.chapter}</span>
                    <ChevronRight className="h-3 w-3 mx-1" />
                    <span>Verse {result.verse}</span>
                  </div>

                  {/* Verse Text */}
                  <div 
                    className="text-gray-900 dark:text-gray-100 leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightText(result.text, query) 
                    }}
                  />

                  {/* Context */}
                  {result.context && result.context.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Context:</p>
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {result.context.map((contextVerse, idx) => (
                          <div key={idx} className="flex">
                            <span className="text-gray-400 mr-2 min-w-[2rem]">
                              {contextVerse.verse}
                            </span>
                            <span className={contextVerse.verse === result.verse ? 'font-medium' : ''}>
                              {contextVerse.verse === result.verse 
                                ? <span dangerouslySetInnerHTML={{ __html: highlightText(contextVerse.text, query) }} />
                                : contextVerse.text
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
            Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchComponent;
