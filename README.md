# Speech Keyboard Backend

A Node.js/Express backend server for a speech-to-text mobile application that handles transcription processing, user management, and API services.

## Features

- RESTful API with Express.js
- PostgreSQL database integration
- User management with Firebase Auth integration (planned)
- Structured logging with Winston
- Security middleware (Helmet, CORS, Rate Limiting)
- Environment-based configuration
- Ready for Render deployment

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.js  # Database connection setup
│   └── logger.js    # Logging configuration
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── models/         # Database models
├── routes/         # API route definitions
├── services/       # Business logic services
└── utils/          # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (>= 16.0.0)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your database credentials

5. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Deployment

### Render Deployment

1. Connect your GitHub repository to Render
2. Set the following environment variables in Render:
   - `DATABASE_URL` (automatically provided by Render PostgreSQL)
   - `NODE_ENV=production`
   - Any other required environment variables

3. Render will automatically detect and use the `npm start` command

### Environment Variables

Required environment variables:

- `PORT` - Server port (default: 3000)
- `DATABASE_URL` or `DB_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (default: info)

## Future Features (Planned)

- Firebase Auth integration
- Audio file upload and processing
- Speech-to-text with OpenAI Whisper
- Text cleanup with GPT
- Transcription history
- Custom prompts management
- Subscription and billing
- Rate limiting per user