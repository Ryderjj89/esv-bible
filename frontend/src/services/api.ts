import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'text/plain',
  },
});

export interface BookData {
  books: string[];
}

export const getBooks = async (): Promise<BookData> => {
  const response = await api.get('/books');
  return response.data;
};

export const getBook = async (book: string): Promise<{ chapters: string[] }> => {
  const response = await api.get(`/books/${book}`);
  return response.data;
};

export const getChapter = async (book: string, chapter: string): Promise<string> => {
  const response = await api.get(`/books/${book}/${chapter}`);
  return response.data;
};

export const checkHealth = async (): Promise<{ status: string; message: string }> => {
  const response = await api.get('/health');
  return response.data;
};

// Search interfaces
export interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  fullText: string;
  context: Array<{
    book: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  relevance: number;
  highlight: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  hasMore: boolean;
}

export interface SearchOptions {
  book?: string;
  limit?: number;
  context?: boolean;
}

// Search API functions
export const searchBible = async (query: string, options: SearchOptions = {}): Promise<SearchResponse> => {
  const params = new URLSearchParams({
    q: query,
    ...(options.book && { book: options.book }),
    ...(options.limit && { limit: options.limit.toString() }),
    ...(options.context !== undefined && { context: options.context.toString() })
  });

  const response = await api.get(`/api/search?${params}`);
  return response.data;
};

export const getSearchSuggestions = async (query: string, limit: number = 10): Promise<string[]> => {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString()
  });

  const response = await api.get(`/api/search/suggestions?${params}`);
  return response.data.suggestions;
};
