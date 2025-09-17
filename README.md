# ESV Bible in Markdown

A Docker-based ESV Bible application with markdown content, featuring a React frontend and Node.js backend.

> **Created with AI**: This entire application was built using Visual Studio Code with [Cline](https://github.com/cline/cline), an AI coding assistant that helped develop every aspect of the project from initial setup to final deployment.

## Features

### Core Bible Reading Experience
- **Complete ESV Bible** in markdown format with all 66 books
- **Powerful search engine** - Find any verse, word, or phrase across the entire Bible
- **Clean URLs** like `/book/Genesis/chapter/1` for easy sharing
- **Mobile responsive** design with adaptive navigation and touch-friendly controls
- **Dark mode** support with persistent preferences across sessions
- **Font size controls** (Small, Medium, Large) with instant preview
- **Chapter navigation** with Previous/Next buttons for seamless reading
- **Verse-by-verse display** with clear formatting and numbering
- **Professional typography** optimized for extended reading sessions
- **Fast loading** with optimized content delivery

### Advanced User Features (When Authenticated)
- **Three-level favorites system**:
  - **Book favorites** - Save entire books for quick access
  - **Chapter favorites** - Bookmark specific chapters
  - **Verse favorites** - Save individual verses
- **Real-time favorites updates** - Changes appear instantly
- **Organized favorites menu** - Categorized sections with icons and counts
- **Cross-device sync** - Preferences and favorites sync across all devices
- **User preferences storage** - Font size and dark mode settings preserved

### Technical Features
- **Optional OpenID Connect authentication** for user features
- **SQLite database** for user data with automatic setup
- **RESTful API** for all user operations
- **Docker containerization** with persistent volume support
- **Multi-stage builds** for optimized production deployment
- **Professional favicon** with book icon
- **SEO-friendly URLs** and metadata

## Quick Start

### Basic Setup (No Authentication)

#### Option 1: Use Pre-built Docker Image (Recommended)

1. **Run directly from Docker Hub**
   ```bash
   docker run -d -p 3000:3000 -v esv-bible_data:/app/backend/data --name esv-bible ryderjj89/esv-bible:latest
   ```

2. **Access the application**
   - Open http://localhost:3000 in your browser

#### Option 2: Build from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ryderjj89/esv-bible.git
   cd esv-bible
   ```

2. **Build and run with Docker (with persistent storage)**
   ```bash
   docker build -t esv-bible .
   docker run -p 3000:3000 -v esv-bible_data:/app/backend/data esv-bible
   ```

3. **Access the application**
   - Open http://localhost:3000 in your browser

### Docker Compose Setup (Recommended)

1. **Run with docker-compose**
   ```bash
   docker-compose up -d
   ```
   
   This will:
   - Build the application automatically
   - Create a persistent volume for database storage
   - Start the service in the background
   - Make the app available at http://localhost:3000

2. **View logs (optional)**
   ```bash
   docker-compose logs -f
   ```

3. **Stop the application**
   ```bash
   docker-compose down
   ```

4. **Update to latest version**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## Authentication Setup (Optional)

To enable user authentication and features like favorites and synced preferences, configure OpenID Connect:

### Environment Variables

Create a `.env` file in the root directory with the following variables:

#### Example Configuration (Authentik)

```env
# OpenID Connect Configuration (Required for authentication)
# Example using Authentik - replace auth.example.com with your domain
OIDC_ISSUER=https://auth.example.com/application/o/esv-bible/
OIDC_CLIENT_ID=your-client-id-from-authentik
OIDC_CLIENT_SECRET=your-client-secret-from-authentik
OIDC_AUTH_URL=https://auth.example.com/application/o/authorize/
OIDC_TOKEN_URL=https://auth.example.com/application/o/token/
OIDC_USERINFO_URL=https://auth.example.com/application/o/userinfo/

# Optional Configuration
OIDC_CALLBACK_URL=/auth/callback
SESSION_SECRET=your-session-secret-change-in-production
FRONTEND_URL=http://localhost:3000
NODE_ENV=production
```

#### Other Provider Examples

**Keycloak:**
```env
OIDC_ISSUER=https://keycloak.example.com/realms/your-realm
OIDC_AUTH_URL=https://keycloak.example.com/realms/your-realm/protocol/openid-connect/auth
OIDC_TOKEN_URL=https://keycloak.example.com/realms/your-realm/protocol/openid-connect/token
OIDC_USERINFO_URL=https://keycloak.example.com/realms/your-realm/protocol/openid-connect/userinfo
```

**Auth0:**
```env
OIDC_ISSUER=https://your-tenant.auth0.com/
OIDC_AUTH_URL=https://your-tenant.auth0.com/authorize
OIDC_TOKEN_URL=https://your-tenant.auth0.com/oauth/token
OIDC_USERINFO_URL=https://your-tenant.auth0.com/userinfo
```

## Bible Search Feature

### Powerful Search Engine
- **Full-text search** across all 66 books and ~31,000 verses
- **Real-time results** with 300ms debouncing for smooth typing
- **Contextual results** - See surrounding verses for better understanding
- **Direct verse navigation** - Click any result to jump directly to that verse
- **Book filtering** - Search within specific books or across the entire Bible
- **Highlighted search terms** - Visual emphasis on matching words in results
- **Mobile-optimized** - Touch-friendly search interface on all devices
- **Fast indexing** - In-memory search index for instant results

### Search Interface
- **Header search button** - Quick access from any page
- **Modal overlay** - Search without leaving your current reading
- **Dedicated search page** - Full-screen search experience at `/search`
- **Auto-complete suggestions** - Smart word completion as you type
- **Result relevance scoring** - Most relevant verses appear first
- **Context display** - See verses before and after each result

### Search API Endpoints

```
GET    /api/search          - Search Bible text
GET    /api/search/suggestions - Get search auto-complete suggestions
```

**Search Parameters:**
- `q` - Search query (minimum 2 characters)
- `book` - Filter by specific book (optional)
- `limit` - Maximum results to return (default: 50)
- `context` - Include surrounding verses (default: true)

## Features When Authenticated

### User Preferences
- **Font size** synced across devices (Small, Medium, Large)
- **Dark mode** preference synced across devices
- **Persistent settings** stored in database
- **Instant updates** - Changes apply immediately across all sessions

### Advanced Favorites System
- **Three-level bookmarking**:
  - **Books** - Save entire books like "Genesis" or "Matthew"
  - **Chapters** - Bookmark specific chapters like "John 3"
  - **Verses** - Save individual verses like "John 3:16"
- **Real-time updates** - Favorites appear instantly in menu without page refresh
- **Organized display** - Categorized sections with icons and counts
- **Quick navigation** - Click any favorite to jump directly to that content
- **Easy management** - Add/remove favorites with single click
- **Mobile optimized** - Touch-friendly interface on all devices
- **Cross-device sync** - Access your favorites from any device

### API Endpoints (Authenticated)

```
GET    /auth/user           - Get current user info
POST   /auth/logout         - Logout user
GET    /api/preferences     - Get user preferences
PUT    /api/preferences     - Update user preferences
GET    /api/favorites       - Get user favorites
POST   /api/favorites       - Add favorite (book/chapter/verse)
DELETE /api/favorites/:id   - Remove favorite
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

## Database

The application uses SQLite for user data when authentication is enabled:

- **Location**: `backend/data/bible.db`
- **Tables**: `users`, `user_preferences`, `favorites`
- **Automatic setup**: Database and tables created on first run
- **Persistent storage**: Data preserved across container restarts
- **Backup friendly**: Single file database for easy backups

## Docker Configuration

### Dockerfile
- **Multi-stage build** for optimized production image
- **Node.js backend** with React frontend
- **Persistent volume** support for database storage
- **Security optimized** with non-root user
- **Minimal image size** with production dependencies only

### docker-compose.yml
- **Single service** configuration for easy deployment
- **Volume mounting** for database persistence (`esv-bible-data` volume)
- **Automatic restart** policy for reliability
- **Port mapping** (3000:3000) for web access

## URL Structure

- **Home**: `/` - Book selection with Old/New Testament organization
- **Book chapters**: `/book/Genesis` - Chapter selection for Genesis
- **Chapter reading**: `/book/Genesis/chapter/1` - Genesis Chapter 1 with verse navigation
- **Clean URLs**: Professional book names without technical prefixes
- **SEO friendly**: Descriptive URLs for search engine optimization

## Mobile Experience

- **Responsive design** that adapts to all screen sizes
- **Touch-friendly** navigation with proper button sizing
- **Mobile-optimized** favorites menu positioned below header
- **Readable typography** optimized for mobile screens
- **Fast loading** on mobile networks
- **Offline capable** once initially loaded

## Browser Support

- **Modern browsers** with ES6+ support (Chrome, Firefox, Safari, Edge)
- **Mobile browsers** on iOS and Android
- **Keyboard accessible** controls for accessibility
- **Screen reader** compatible
- **Progressive enhancement** for older browsers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly on both desktop and mobile
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- **GitHub Issues**: Create an issue for bugs or feature requests
- **Documentation**: Check this README for setup instructions
- **Environment**: Review environment variable configuration
- **Logs**: Use `docker-compose logs` to troubleshoot issues

## Acknowledgments

- **Bible data source** - [mdbible](https://github.com/lguenth/mdbible) - Markdown formatted Bible text
- **React** - Frontend framework
- **Node.js** - Backend runtime
- **Docker** - Containerization platform
- **Cline AI** - Development assistant that built this entire application

---

**Note**: Authentication is completely optional. The application works fully without any authentication setup, providing a clean Bible reading experience. Authentication only adds user-specific features like favorites and synced preferences across devices.
