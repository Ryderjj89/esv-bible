const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = path.join(__dirname, '../data/bible.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory:', dataDir);
}

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeTables();
  }
});

// Initialize database tables
function initializeTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid_sub TEXT UNIQUE NOT NULL,
      email TEXT,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User preferences table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      font_size TEXT DEFAULT 'medium' CHECK(font_size IN ('small', 'medium', 'large')),
      dark_mode BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id)
    )
  `);

  // Favorites table
  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book TEXT NOT NULL,
      chapter TEXT NOT NULL,
      verse_start INTEGER,
      verse_end INTEGER,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, book, chapter, verse_start, verse_end)
    )
  `);

  console.log('Database tables initialized');
}

// User operations
const userOps = {
  // Find or create user by OpenID Connect subject
  findOrCreateUser: (profile, callback) => {
    const { sub, email, name } = profile;
    
    db.get(
      'SELECT * FROM users WHERE openid_sub = ?',
      [sub],
      (err, user) => {
        if (err) {
          return callback(err);
        }
        
        if (user) {
          // Update user info
          db.run(
            'UPDATE users SET email = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [email, name, user.id],
            (err) => {
              if (err) return callback(err);
              callback(null, user);
            }
          );
        } else {
          // Create new user
          db.run(
            'INSERT INTO users (openid_sub, email, name) VALUES (?, ?, ?)',
            [sub, email, name],
            function(err) {
              if (err) return callback(err);
              
              const newUser = {
                id: this.lastID,
                openid_sub: sub,
                email,
                name
              };
              
              // Create default preferences
              db.run(
                'INSERT INTO user_preferences (user_id) VALUES (?)',
                [newUser.id],
                (prefErr) => {
                  if (prefErr) console.error('Error creating default preferences:', prefErr);
                  callback(null, newUser);
                }
              );
            }
          );
        }
      }
    );
  },

  // Find user by ID
  findById: (id, callback) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], callback);
  }
};

// Preferences operations
const preferencesOps = {
  // Get user preferences
  getPreferences: (userId, callback) => {
    db.get(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId],
      callback
    );
  },

  // Update user preferences
  updatePreferences: (userId, preferences, callback) => {
    const { font_size, dark_mode } = preferences;
    
    db.run(
      `UPDATE user_preferences 
       SET font_size = ?, dark_mode = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ?`,
      [font_size, dark_mode ? 1 : 0, userId],
      callback
    );
  }
};

// Favorites operations
const favoritesOps = {
  // Get user favorites
  getFavorites: (userId, callback) => {
    db.all(
      'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      callback
    );
  },

  // Add favorite
  addFavorite: (userId, favorite, callback) => {
    const { book, chapter, verse_start, verse_end, note } = favorite;
    
    db.run(
      `INSERT INTO favorites (user_id, book, chapter, verse_start, verse_end, note) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, book, chapter, verse_start, verse_end, note],
      callback
    );
  },

  // Remove favorite
  removeFavorite: (userId, favoriteId, callback) => {
    db.run(
      'DELETE FROM favorites WHERE id = ? AND user_id = ?',
      [favoriteId, userId],
      callback
    );
  },

  // Check if verse is favorited
  isFavorited: (userId, book, chapter, verse_start, verse_end, callback) => {
    db.get(
      'SELECT id FROM favorites WHERE user_id = ? AND book = ? AND chapter = ? AND verse_start = ? AND verse_end = ?',
      [userId, book, chapter, verse_start, verse_end],
      (err, row) => {
        if (err) return callback(err);
        callback(null, !!row);
      }
    );
  }
};

module.exports = {
  db,
  userOps,
  preferencesOps,
  favoritesOps
};
