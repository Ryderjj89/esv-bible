# ESV Bible Markdown

A Docker-based web service for serving the ESV Bible in Markdown format with chapter-by-chapter organization.

## Project Structure

```
esv-bible/
├── backend/           # Backend API server
│   ├── src/
│   │   └── index.js   # Express server
│   ├── package.json
│   └── Dockerfile
├── frontend/          # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── bible-data/        # ESV Bible markdown files (auto-downloaded)
├── docker-compose.yml
└── README.md
```

## Features

- Complete ESV Bible text in Markdown format from [lguenth/mdbible](https://github.com/lguenth/mdbible)
- Organized by book and chapter for easy navigation
- Docker containerized for easy deployment
- Modern React frontend with responsive design
- RESTful API for accessing Bible content
- Persistent volume storage for Bible data
- Optimized for remote hosting

## Setup

1. Clone this repository
2. Run `docker-compose up` (uses pre-built image from Docker Hub)
3. The ESV Bible data is included in the Docker image

## Usage

The service will be available at `http://localhost:3000`

### API Endpoints

- `GET /health` - Health check endpoint
- `GET /books` - List all available books
- `GET /books/:book` - Get complete book (all chapters combined)
- `GET /books/:book/:chapter` - Get specific chapter

### Example Usage

```bash
# List all books
curl http://localhost:3000/books

# Get the book of Genesis
curl http://localhost:3000/books/Genesis

# Get Genesis chapter 1
curl http://localhost:3000/books/Genesis/1
```

## Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

## Docker Deployment

Run with Docker Compose using pre-built Docker Hub image:
```bash
docker-compose up
```

The application uses the `ryderjj89/esv-bible:latest` image from Docker Hub. The Bible data is included in the Docker image and stored in a persistent Docker volume named `bible_data` for efficient storage and updates.

## Data Source

Bible content is sourced from [lguenth/mdbible](https://github.com/lguenth/mdbible/tree/main/by_chapter), which provides the ESV Bible organized by book and chapter in Markdown format.

## License

MIT
