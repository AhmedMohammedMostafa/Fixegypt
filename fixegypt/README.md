# FixEgypt - Egyptian City Report Platform

A platform for Egyptian citizens to report city infrastructure issues like road damage, water issues, electricity problems, etc. Built with a modern hexagonal architecture.

## Features

- **User Management**
  - Registration with Egyptian National ID verification
  - JWT authentication with refresh tokens
  - Role-based authorization (citizen vs admin)
  - Email verification

- **Report Management**
  - Create reports with geolocation and image uploads
  - Track reports with status history
  - Admin dashboard for reviewing and managing reports

- **AI Integration**
  - Image analysis for report classification
  - Urgency detection from images and descriptions
  - Multiple AI provider options (Gemini, OpenRouter, Hugging Face)

- **Performance & Security**
  - API response caching
  - HTTP compression
  - Rate limiting
  - CORS protection
  - Content Security Policy
  - XSS protection

## Architecture

This project follows a hexagonal architecture (ports and adapters) with three layers:

1. **Domain Layer**: Core business entities and interfaces
   - User and Report entities
   - Repository interfaces
   - Domain services

2. **Application Layer**: Use cases that implement business logic
   - User registration, login
   - Report creation, updates
   - Admin operations

3. **Infrastructure Layer**: External implementations and adapters
   - MongoDB models and repositories
   - Express controllers and routes
   - Middleware for authentication, validation, etc.
   - Email and AI services

## Technology Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Validation**: Joi
- **File Upload**: Multer
- **AI Integration**: Gemini API, OpenRouter, or Hugging Face
- **Documentation**: Swagger
- **Testing**: Jest, Supertest
- **Logging**: Winston
- **Performance**: Compression, Caching

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB
- API keys for the chosen AI provider (Gemini, OpenRouter, or Hugging Face)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fixegypt.git
   cd fixegypt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```

4. Create uploads directory:
   ```bash
   mkdir uploads
   ```

5. Start the server:
   ```bash
   npm start
   ```

The API will be available at http://localhost:3000, and Swagger documentation at http://localhost:3000/api-docs.

## Environment Variables

Key environment variables include:

- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET` & `JWT_REFRESH_SECRET`: JWT signing secrets
- `AI_PROVIDER`: AI provider to use (gemini, openrouter, or huggingface)
- `AI_API_KEY`: API key for the chosen AI provider

See `.env.example` for all configuration options.

## API Documentation

The API documentation is available at `/api-docs` when the server is running. It provides detailed information about all endpoints, request bodies, responses, and authentication requirements.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 