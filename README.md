# ESV Bible Markdown

A Docker-based web service for serving the ESV Bible in Markdown format.

## Features

- Complete ESV Bible text in Markdown format
- Docker containerized for easy deployment
- RESTful API for accessing Bible content
- Optimized for remote hosting

## Setup

1. Clone this repository
2. Place ESV Bible Markdown files in the `bible-data` directory
3. Run `docker-compose up --build`

## Usage

The service will be available at `http://localhost:3000`

### API Endpoints

- `GET /books` - List all books
- `GET /books/:book` - Get specific book
- `GET /books/:book/:chapter` - Get specific chapter

## Development

For local development:
```bash
npm install
npm run dev
```

## Docker Deployment

Build and run with Docker Compose:
```bash
docker-compose up --build
```

## License

MIT
