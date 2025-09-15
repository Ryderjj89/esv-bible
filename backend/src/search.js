const fs = require('fs').promises;
const path = require('path');

class BibleSearchEngine {
  constructor(bibleDataDir) {
    this.bibleDataDir = bibleDataDir;
    this.searchIndex = new Map();
    this.isIndexed = false;
  }

  // Parse verses from markdown content
  parseVersesFromMarkdown(content, book, chapter) {
    const verses = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and headers
      if (!line || line.startsWith('#')) {
        continue;
      }
      
      // Match verse patterns:
      // - "1. In the beginning..." (numbered list format)
      // - "1 In the beginning..." (simple number format)
      // - "**1** In the beginning..." (bold number format)
      const verseMatch = line.match(/^(\*\*)?(\d+)(\*\*)?[.\s]\s*(.+)$/);
      
      if (verseMatch) {
        const verseNumber = parseInt(verseMatch[2]);
        const verseText = verseMatch[4];
        
        verses.push({
          book,
          chapter,
          verse: verseNumber,
          text: verseText,
          fullText: line
        });
      }
    }
    
    return verses;
  }

  // Get context verses around a specific verse
  getContextVerses(allVerses, targetVerse, contextSize = 2) {
    const targetIndex = allVerses.findIndex(v => v.verse === targetVerse);
    if (targetIndex === -1) return [];

    const start = Math.max(0, targetIndex - contextSize);
    const end = Math.min(allVerses.length, targetIndex + contextSize + 1);
    
    return allVerses.slice(start, end);
  }

  // Calculate relevance score for search results
  calculateRelevance(text, query) {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    let score = 0;
    
    // Exact phrase match gets highest score
    if (lowerText.includes(lowerQuery)) {
      score += 100;
    }
    
    // Word matches
    const queryWords = lowerQuery.split(/\s+/);
    const textWords = lowerText.split(/\s+/);
    
    for (const queryWord of queryWords) {
      for (const textWord of textWords) {
        if (textWord === queryWord) {
          score += 50; // Exact word match
        } else if (textWord.includes(queryWord)) {
          score += 25; // Partial word match
        }
      }
    }
    
    // Boost score for shorter verses (more focused results)
    if (text.length < 100) score += 10;
    
    return score;
  }

  // Build search index from all bible files
  async buildSearchIndex() {
    console.log('Building search index...');
    this.searchIndex.clear();
    
    try {
      const books = await this.getBooks();
      
      for (const book of books) {
        const bookPath = path.join(this.bibleDataDir, book);
        const files = await fs.readdir(bookPath);
        const chapterFiles = files.filter(file => file.endsWith('.md')).sort();
        
        for (const chapterFile of chapterFiles) {
          const chapterMatch = chapterFile.match(/Chapter_(\d+)\.md$/);
          if (!chapterMatch) continue;
          
          const chapter = parseInt(chapterMatch[1]);
          const filePath = path.join(bookPath, chapterFile);
          
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const verses = this.parseVersesFromMarkdown(content, book, chapter);
            
            // Index each verse
            for (const verse of verses) {
              const key = `${book}_${chapter}_${verse.verse}`;
              this.searchIndex.set(key, verse);
            }
          } catch (error) {
            console.error(`Error reading chapter file ${filePath}:`, error);
          }
        }
      }
      
      this.isIndexed = true;
      console.log(`Search index built with ${this.searchIndex.size} verses`);
    } catch (error) {
      console.error('Error building search index:', error);
      throw error;
    }
  }

  // Get all books
  async getBooks() {
    try {
      const items = await fs.readdir(this.bibleDataDir);
      const bookDirs = [];

      for (const item of items) {
        const itemPath = path.join(this.bibleDataDir, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory()) {
          try {
            const files = await fs.readdir(itemPath);
            if (files.some(file => file.endsWith('.md'))) {
              bookDirs.push(item);
            }
          } catch (error) {
            continue;
          }
        }
      }

      return bookDirs;
    } catch (error) {
      throw new Error('Failed to read bible data directory');
    }
  }

  // Search function
  async search(query, options = {}) {
    const {
      bookFilter = null,
      limit = 50,
      includeContext = true,
      contextSize = 2
    } = options;

    // Build index if not already built
    if (!this.isIndexed) {
      await this.buildSearchIndex();
    }

    if (!query || query.trim().length < 2) {
      return [];
    }

    const results = [];
    const lowerQuery = query.toLowerCase().trim();

    // Search through indexed verses
    for (const [key, verse] of this.searchIndex) {
      // Apply book filter if specified
      if (bookFilter && verse.book !== bookFilter) {
        continue;
      }

      // Check if verse text contains the query
      if (verse.text.toLowerCase().includes(lowerQuery)) {
        const relevance = this.calculateRelevance(verse.text, query);
        
        let context = [];
        if (includeContext) {
          // Get all verses for this chapter to provide context
          const chapterVerses = Array.from(this.searchIndex.values())
            .filter(v => v.book === verse.book && v.chapter === verse.chapter)
            .sort((a, b) => a.verse - b.verse);
          
          context = this.getContextVerses(chapterVerses, verse.verse, contextSize);
        }

        results.push({
          book: verse.book,
          chapter: verse.chapter,
          verse: verse.verse,
          text: verse.text,
          fullText: verse.fullText,
          context,
          relevance,
          highlight: this.highlightText(verse.text, query)
        });
      }
    }

    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  // Highlight search terms in text
  highlightText(text, query) {
    if (!query) return text;
    
    const queryWords = query.toLowerCase().split(/\s+/);
    let highlightedText = text;
    
    for (const word of queryWords) {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    }
    
    return highlightedText;
  }

  // Get search suggestions (for autocomplete)
  async getSearchSuggestions(query, limit = 10) {
    if (!this.isIndexed) {
      await this.buildSearchIndex();
    }

    const suggestions = new Set();
    const lowerQuery = query.toLowerCase();

    for (const verse of this.searchIndex.values()) {
      const words = verse.text.toLowerCase().split(/\s+/);
      
      for (const word of words) {
        if (word.startsWith(lowerQuery) && word.length > lowerQuery.length) {
          suggestions.add(word);
          if (suggestions.size >= limit) break;
        }
      }
      
      if (suggestions.size >= limit) break;
    }

    return Array.from(suggestions).slice(0, limit);
  }
}

module.exports = BibleSearchEngine;
