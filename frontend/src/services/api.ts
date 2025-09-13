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
