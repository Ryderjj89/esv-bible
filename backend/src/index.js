const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs').promises;
const { configureAuth, requireAuth, optionalAuth } = require('./auth');
const { preferencesOps, favoritesOps } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  originAgentCluster: false
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());

// Configure authentication
configureAuth(app);

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Bible data directory
const BIBLE_DATA_DIR = path.join(__dirname, '../../bible-data');

// Helper function to read markdown files
async function readMarkdownFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${filePath}`);
  }
}

// Helper function to get all books
async function getBooks() {
  try {
    const items = await fs.readdir(BIBLE_DATA_DIR);
    const bookDirs = [];

    for (const item of items) {
      const itemPath = path.join(BIBLE_DATA_DIR, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        // Check if directory contains markdown files
        try {
          const files = await fs.readdir(itemPath);
          if (files.some(file => file.endsWith('.md'))) {
            bookDirs.push(item);
          }
        } catch (error) {
          // Skip directories we can't read
          continue;
        }
      }
    }

    return bookDirs;
  } catch (error) {
    throw new Error('Failed to read bible data directory');
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ESV Bible API is running' });
});

app.get('/books', async (req, res) => {
  try {
    const books = await getBooks();
    res.json({ books });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/books/:book', async (req, res) => {
  try {
    const { book } = req.params;
    const bookDir = path.join(BIBLE_DATA_DIR, book);

    // Check if book directory exists
    const stat = await fs.stat(bookDir);
    if (!stat.isDirectory()) {
      return res.status(404).json({ error: `Book '${book}' not found` });
    }

    // Get all chapter files
    const files = await fs.readdir(bookDir);
    const chapterFiles = files.filter(file => file.endsWith('.md')).sort();

    if (chapterFiles.length === 0) {
      return res.status(404).json({ error: `No chapters found for book '${book}'` });
    }

    // Extract chapter numbers from filenames (e.g., "Chapter_01.md" -> "1")
    const chapters = chapterFiles.map(file => {
      const match = file.match(/Chapter_(\d+)\.md$/);
      return match ? parseInt(match[1], 10).toString() : null;
    }).filter(Boolean);

    res.json({ chapters });
  } catch (error) {
    res.status(404).json({ error: `Book '${req.params.book}' not found` });
  }
});

app.get('/books/:book/:chapter', async (req, res) => {
  try {
    const { book, chapter } = req.params;
    const chapterPath = path.join(BIBLE_DATA_DIR, book, `${chapter}.md`);

    const content = await readMarkdownFile(chapterPath);
    res.type('text/markdown').send(content);
  } catch (error) {
    res.status(404).json({ error: `Chapter ${chapter} not found in book '${book}'` });
  }
});

// User preferences routes
app.get('/api/preferences', requireAuth, (req, res) => {
  preferencesOps.getPreferences(req.user.id, (err, preferences) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to get preferences' });
    }
    res.json({
      font_size: preferences?.font_size || 'medium',
      dark_mode: !!preferences?.dark_mode
    });
  });
});

app.put('/api/preferences', requireAuth, (req, res) => {
  const { font_size, dark_mode } = req.body;
  
  // Validate font_size
  if (font_size && !['small', 'medium', 'large'].includes(font_size)) {
    return res.status(400).json({ error: 'Invalid font_size' });
  }

  preferencesOps.updatePreferences(req.user.id, { font_size, dark_mode }, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update preferences' });
    }
    res.json({ message: 'Preferences updated successfully' });
  });
});

// Favorites routes
app.get('/api/favorites', requireAuth, (req, res) => {
  favoritesOps.getFavorites(req.user.id, (err, favorites) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to get favorites' });
    }
    res.json({ favorites });
  });
});

app.post('/api/favorites', requireAuth, (req, res) => {
  const { book, chapter, verse_start, verse_end, note } = req.body;
  
  // Book is required, but chapter is optional (for book-level favorites)
  if (!book) {
    return res.status(400).json({ error: 'Book is required' });
  }

  const favorite = {
    book,
    chapter: chapter || null,
    verse_start: verse_start || null,
    verse_end: verse_end || null,
    note: note || null
  };

  favoritesOps.addFavorite(req.user.id, favorite, function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ error: 'Favorite already exists' });
      }
      return res.status(500).json({ error: 'Failed to add favorite' });
    }
    res.json({ 
      message: 'Favorite added successfully',
      id: this.lastID
    });
  });
});

app.delete('/api/favorites/:id', requireAuth, (req, res) => {
  const favoriteId = req.params.id;
  
  favoritesOps.removeFavorite(req.user.id, favoriteId, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to remove favorite' });
    }
    res.json({ message: 'Favorite removed successfully' });
  });
});

app.get('/api/favorites/check', requireAuth, (req, res) => {
  const { book, chapter, verse_start, verse_end } = req.query;
  
  if (!book) {
    return res.status(400).json({ error: 'Book is required' });
  }

  favoritesOps.isFavorited(
    req.user.id, 
    book, 
    chapter || null, 
    verse_start || null, 
    verse_end || null,
    (err, isFavorited) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check favorite status' });
      }
      res.json({ isFavorited });
    }
  );
});

// Catch-all handler: send back React's index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`ESV Bible API server running on port ${PORT}`);
  console.log(`Bible data directory: ${BIBLE_DATA_DIR}`);
});
