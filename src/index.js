const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Bible data directory
const BIBLE_DATA_DIR = path.join(__dirname, '../bible-data');

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
    const files = await fs.readdir(BIBLE_DATA_DIR);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    return markdownFiles.map(file => file.replace('.md', ''));
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
    const filePath = path.join(BIBLE_DATA_DIR, `${book}.md`);

    const content = await readMarkdownFile(filePath);
    res.type('text/markdown').send(content);
  } catch (error) {
    res.status(404).json({ error: `Book '${req.params.book}' not found` });
  }
});

app.get('/books/:book/:chapter', async (req, res) => {
  try {
    const { book, chapter } = req.params;
    const filePath = path.join(BIBLE_DATA_DIR, `${book}.md`);

    const content = await readMarkdownFile(filePath);

    // Simple chapter extraction (this could be improved with better parsing)
    const lines = content.split('\n');
    const chapterPattern = new RegExp(`^# ${chapter}\\s*$`, 'i');
    const chapterLines = [];
    let inChapter = false;

    for (const line of lines) {
      if (chapterPattern.test(line)) {
        inChapter = true;
        chapterLines.push(line);
      } else if (inChapter && line.startsWith('# ')) {
        // Next chapter starts
        break;
      } else if (inChapter) {
        chapterLines.push(line);
      }
    }

    if (chapterLines.length === 0) {
      return res.status(404).json({ error: `Chapter ${chapter} not found in ${book}` });
    }

    res.type('text/markdown').send(chapterLines.join('\n'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`ESV Bible API server running on port ${PORT}`);
  console.log(`Bible data directory: ${BIBLE_DATA_DIR}`);
});
