const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  originAgentCluster: false
}));
app.use(cors());
app.use(express.json());

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

    // Combine all chapters
    let fullBook = `# ${book}\n\n`;
    for (const chapterFile of chapterFiles) {
      const chapterPath = path.join(bookDir, chapterFile);
      const chapterContent = await readMarkdownFile(chapterPath);
      fullBook += chapterContent + '\n\n';
    }

    res.type('text/markdown').send(fullBook);
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
