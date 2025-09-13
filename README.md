# ESV Bible in Markdown

A Docker-based ESV Bible application with markdown content, featuring a React frontend and Node.js backend.

## Features

- **Complete ESV Bible** in markdown format
- **Clean URLs** like `/book/Genesis/chapter/1`
- **Mobile responsive** design with adaptive navigation
- **Dark mode** support with persistent preferences
- **Font size controls** (Small, Medium, Large)
- **Chapter navigation** with Previous/Next buttons
- **Times New Roman typography** for traditional Bible reading
- **Professional favicon** with book icon
- **Optional OpenID Connect authentication** for user features
- **User preferences** sync (when authenticated)
- **Favorites system** for bookmarking verses (when authenticated)

## Quick Start

### Basic Setup (No Authentication)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ryderjj89/esv-bible.git
   cd esv-bible
   ```

2. **Build and run with Docker**
   ```bash
   docker build -t esv-bible .
   docker run -p 3000:3000 esv-bible
   ```

3. **Access the application**
   - Open http://localhost:3000 in your browser

### Docker Compose Setup

1. **Run with docker-compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Open http://localhost:3000 in your browser

## Authentication Setup (Optional)

To enable user authentication and features like favorites and synced preferences, configure OpenID Connect:

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# OpenID Connect Configuration (Required for authentication)
OIDC_ISSUER=https://your-oidc-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_AUTH_URL=https://your-oidc-provider.com/auth
OIDC_TOKEN_URL=https://your-oidc-provider.com/token
OIDC_USERINFO_URL=https://your-oidc-provider.com/userinfo

# Optional Configuration
OIDC_CALLBACK_URL=/auth/callback
SESSION_SECRET=your-session-secret-change-in-production
FRONTEND_URL=http://localhost:3000
NODE_ENV=production
```

## Features When Authenticated

### User Preferences
- **Font size** synced across devices
- **Dark mode** preference synced across devices
- **Persistent settings** stored in database

### Favorites System
- **Bookmark verses** for easy reference
- **Add notes** to favorite verses
- **Organize favorites** by book and chapter
- **Quick access** to saved verses

### API Endpoints (Authenticated)

```
GET    /auth/user           - Get current user info
POST   /auth/logout         - Logout user
GET    /api/preferences     - Get user preferences
PUT    /api/preferences     - Update user preferences
GET    /api/favorites       - Get user favorites
POST   /api/favorites       - Add favorite verse
DELETE /api/favorites/:id   - Remove favorite
GET    /api/favorites/check - Check if verse is favorited
```

## Development

### Prerequisites
- Node.js 16+
- Docker (optional)

### Local Development

1. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Start development servers**
   ```bash
   # Backend (from backend directory)
   npm run dev
   
   # Frontend (from frontend directory)
   npm start
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Database

The application uses SQLite for user data when authentication is enabled:

- **Location**: `backend/data/bible.db`
- **Tables**: `users`, `user_preferences`, `favorites`
- **Automatic setup**: Database and tables created on first run

## Docker Configuration

### Dockerfile
- Multi-stage build for optimized production image
- Node.js backend with React frontend
- Persistent volume for database storage

### docker-compose.yml
- Single service configuration
- Volume mounting for database persistence
- Environment variable support

## URL Structure

- **Home**: `/` - Book selection
- **Book chapters**: `/book/Genesis` - Chapter selection for Genesis
- **Chapter reading**: `/book/Genesis/chapter/1` - Genesis Chapter 1
- **Clean URLs**: Professional book names without technical prefixes

## Browser Support

- **Modern browsers** with ES6+ support
- **Mobile responsive** design
- **Touch-friendly** navigation
- **Keyboard accessible** controls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review environment variable configuration

---

**Note**: Authentication is completely optional. The application works fully without any authentication setup, providing a clean Bible reading experience. Authentication only adds user-specific features like favorites and synced preferences.
