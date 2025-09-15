# Backend Speech Keyboard
A robust Node.js/Express backend server for a speech-to-text mobile application with intelligent transcription processing, user management, and customizable AI-powered text enhancement.

## ✨ Features

### 🎙️ Speech Transcription & Processing
- **High-Accuracy Transcription**: Powered by OpenAI Whisper for reliable speech-to-text conversion
- **Intelligent Text Enhancement**: AI-powered grammar correction and text improvement using GPT-4
- **Custom Prompts**: User-customizable prompts for personalized text processing styles
- **Audio Format Support**: Handles multiple audio formats with 10MB file size limit
- **Metadata Tracking**: Comprehensive tracking of audio duration, processing time, and token usage

### 🔧 User Management & Customization
- **Firebase Authentication**: Seamless integration with Firebase Auth and Apple Sign-In
- **Personal Prompts**: Users can create and manage custom text processing prompts
- **Transcript History**: Complete transcription history with search and filtering capabilities
- **User Statistics**: Detailed analytics including total transcripts, duration, and daily counts
- **Subscription Management**: Built-in support for free and premium subscription tiers

### 🛡️ Security & Performance
- **Rate Limiting**: Intelligent request throttling (100 requests per 15 minutes)
- **Security Headers**: Comprehensive security with Helmet middleware
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Robust request validation and sanitization
- **Structured Logging**: Detailed logging with Winston for debugging and monitoring

### 📊 Database & Infrastructure
- **PostgreSQL Integration**: Robust relational database with proper indexing
- **RESTful API Design**: Clean, well-documented API endpoints
- **Cloud-Ready**: Optimized for Render deployment with proxy support
- **Environment Configuration**: Flexible environment-based configuration
- **Database Migrations**: Version-controlled database schema with migration scripts

## 🛠️ Tech Stack

**Backend Framework**: Node.js + Express.js + TypeScript  
**Database**: PostgreSQL with connection pooling  
**Authentication**: Firebase Auth (Apple Sign-In integration)  
**AI/ML**: OpenAI Whisper (transcription) + GPT-4 (text processing)  
**Security**: Helmet + CORS + Express Rate Limit  
**Logging**: Winston with structured logging  
**File Upload**: Multer with memory storage  
**Testing**: Jest with comprehensive unit and integration tests  
**Deployment**: Render-optimized with trust proxy configuration  

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- PostgreSQL database
- OpenAI API key
- Firebase project (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend_Speech_Keyboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with the following:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/speech_keyboard
   # OR individual components:
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=speech_keyboard
   DB_USER=your_username
   DB_PASSWORD=your_password
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Logging
   LOG_LEVEL=info
   ```

4. **Set up database**
   ```bash
   # Run the migration script to create tables
   psql -d your_database -f db/migrations/createtables.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Verify installation**
   Visit `http://localhost:3000/health` to check server status

## 📖 API Documentation

### Authentication
All user-specific endpoints require Firebase authentication. Include the Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

### Core Endpoints

#### **Transcription**
- `POST /api/transcripts/transcribeAndCorrect` - Upload audio, transcribe, and process text
  - **Body**: `multipart/form-data` with `audio` file and optional `prompt` text
  - **Response**: Complete transcription with raw and processed text
  
#### **Transcript Management**  
- `GET /api/transcripts/user/:userId` - Get all transcripts for a user
- `GET /api/transcripts/:id` - Get specific transcript by ID
- `POST /api/transcripts` - Create new transcript record
- `PUT /api/transcripts/:id` - Update existing transcript
- `DELETE /api/transcripts/:id` - Delete transcript

#### **User Management**
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user account

#### **Custom Prompts**
- `GET /api/prompts/user/:userId` - Get user's custom prompts
- `GET /api/prompts/defaults` - Get system default prompts
- `POST /api/prompts` - Create new prompt
- `PUT /api/prompts/:id` - Update existing prompt
- `DELETE /api/prompts/:id` - Delete prompt

#### **System**
- `GET /health` - Server health check and status

### Request/Response Examples

**Transcribe Audio:**
```bash
curl -X POST http://localhost:3000/api/transcripts/transcribeAndCorrect \
  -H "Authorization: Bearer <firebase-token>" \
  -F "audio=@recording.wav" \
  -F "prompt=Make this sound professional and clear"
```

**Response:**
```json
{
  "success": true,
  "transcript": {
    "id": 123,
    "user_id": 1,
    "text_raw": "um so today we're gonna talk about...",
    "text_final": "Today, we're going to discuss...",
    "duration_secs": 45.2,
    "prompt_used": "Make this sound professional and clear",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "processing_time": 3500,
  "metadata": {
    "tokens_used": 150,
    "model": "gpt-4o"
  }
}
```

## 🗄️ Database Schema

### Core Tables

**Users Table**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  apple_uid VARCHAR(255) UNIQUE,           -- Firebase UID from Apple Sign-In  
  email VARCHAR(320),                      -- Optional email (may be private relay)
  subscription_status VARCHAR(50) DEFAULT 'free',
  credits_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Transcripts Table**
```sql
CREATE TABLE transcripts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audio_url VARCHAR(2048),                 -- Cloud storage URL
  duration_secs DECIMAL(10,2),            -- Audio duration
  text_raw TEXT,                          -- Raw Whisper output
  text_final TEXT,                        -- AI-processed text
  prompt_used TEXT,                       -- Prompt used for processing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Prompts Table**
```sql
CREATE TABLE prompts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- NULL for defaults
  title VARCHAR(255) NOT NULL,            -- Display name
  content TEXT NOT NULL,                  -- Actual prompt text
  is_default BOOLEAN DEFAULT false        -- System vs user prompts
);
```

### Performance Optimizations
- Indexed foreign keys for fast joins
- Optimized queries for user-specific data
- Connection pooling for database efficiency
- Proper constraints and validation

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Coverage Includes:**
- Unit tests for models and services
- Integration tests for API endpoints
- OpenAI service mocking for reliable testing
- Database transaction testing

## 🚀 Deployment

### Render Deployment (Recommended)

1. **Connect Repository**
   - Link your GitHub repository to Render
   - Render will auto-detect the Node.js environment

2. **Configure Environment Variables**
   Set the following in Render dashboard:
   ```env
   NODE_ENV=production
   OPENAI_API_KEY=your_openai_api_key
   # DATABASE_URL is automatically provided by Render PostgreSQL
   ```

3. **Database Setup**
   - Add PostgreSQL service in Render
   - Run migration script after database creation:
   ```bash
   # In Render shell or during build
   psql $DATABASE_URL -f db/migrations/createtables.sql
   ```

4. **Deploy**
   - Render automatically deploys on git push
   - Build command: `npm run build`
   - Start command: `npm start`

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
NODE_ENV=production npm start
```

### Environment Variables (Production)

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for transcription/processing
- `NODE_ENV=production` - Enables production optimizations

**Optional:**
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging verbosity (default: info)

## 🔧 Configuration

### OpenAI Setup
1. **Get API Key**
   - Visit [OpenAI Platform](https://platform.openai.com)
   - Create account and generate API key
   - Add to environment variables

2. **Models Used**
   - **Whisper-1**: Speech-to-text transcription (~$0.006/minute)
   - **GPT-4**: Text processing and grammar correction (~$0.01-0.03/request)

3. **Usage Monitoring**
   - Monitor costs in OpenAI dashboard
   - Set usage limits and alerts
   - Consider implementing user credit systems

### Database Configuration
- **Connection Pooling**: Automatic connection management
- **Migrations**: Version-controlled schema changes
- **Backup Strategy**: Regular automated backups recommended
- **Monitoring**: Query performance and connection monitoring

## 📊 Project Structure

```
src/
├── app.ts                      # Main application entry point
├── config/
│   ├── database.ts            # Database connection and pooling
│   ├── logger.ts              # Winston logging configuration  
│   └── serviceProvider.ts     # Dependency injection setup
├── controllers/
│   ├── transcriptController.ts # Audio upload and transcription logic
│   ├── userController.ts      # User management endpoints
│   └── promptController.ts    # Custom prompt management
├── models/
│   ├── Transcript.ts          # Transcript database model
│   ├── User.ts               # User database model
│   └── Prompt.ts             # Prompt database model
├── routes/
│   ├── transcriptRoutes.ts    # Transcription API routes
│   ├── userRoutes.ts         # User management routes
│   └── promptRoutes.ts       # Prompt management routes
├── services/
│   └── OpenAIService.ts      # OpenAI Whisper & GPT integration
├── interfaces/
│   ├── TranscriptionProvider.ts # Transcription service interface
│   └── TextProcessor.ts       # Text processing interface  
├── types/
│   ├── database.ts           # Database type definitions
│   └── environment.d.ts      # Environment variable types
└── __tests__/                # Comprehensive test suite
    ├── controllers/
    └── services/

db/
└── migrations/
    └── createtables.sql      # Database schema creation

docs/                         # Additional documentation
```

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Security Headers**: Comprehensive protection with Helmet
- **Input Validation**: Strict validation for all endpoints  
- **SQL Injection Protection**: Parameterized queries throughout
- **File Upload Security**: Size limits and type validation
- **Environment Isolation**: Proper secrets management
- **CORS Configuration**: Controlled cross-origin access

## 🔍 Monitoring & Debugging

### Logging
- **Structured Logging**: JSON format for easy parsing
- **Log Levels**: Error, Warn, Info, Debug levels
- **Request Tracking**: Full request/response logging
- **Performance Metrics**: Processing time and token usage tracking

### Health Monitoring
```bash
# Check server health
curl http://localhost:3000/health

# Response includes:
{
  "status": "OK",
  "message": "Speech Keyboard Backend is running", 
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow code standards** (`npm run lint`)
4. **Add comprehensive tests** (`npm test`)
5. **Commit changes** (`git commit -m 'Add amazing feature'`)
6. **Push to branch** (`git push origin feature/amazing-feature`)
7. **Open Pull Request**

### Development Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Jest Testing**: Minimum 80% test coverage
- **Conventional Commits**: Clear, descriptive commit messages

## 📝 License

This project is licensed under the ISC License - see the package.json file for details.

## 🙏 Acknowledgments

- **OpenAI** for Whisper and GPT-4 models enabling high-quality transcription and text processing
- **Firebase** for seamless authentication and real-time database services
- **Express.js** community for the robust web framework foundation
- **PostgreSQL** for reliable, scalable data storage
- **Winston** for comprehensive logging capabilities

---

**Built with ❤️ for seamless speech-to-text experiences**

For support or questions, please check the issues section or contact the development team.