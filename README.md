# Authentication API

A Node.js Express backend with authentication features including user registration, login, password management, and secure cookie-based JWT authentication.

## Features

- User Registration with email, username, and password
- User Login with secure HTTP-only cookie authentication
- Secure logout that clears authentication cookies
- Forgot Password functionality with email notifications
- Reset Password with secure token validation
- Update Password for authenticated users
- Secure password storage with bcrypt hashing
- MongoDB integration using Mongoose
- Error handling and validation
- Rate limiting for API security

## Project Structure

```
├── config/             # Configuration files
├── controllers/        # Request handlers
│   └── authController.js
├── middleware/         # Middleware functions
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── models/             # Database models
│   └── User.js
├── routes/             # Express routes
│   └── authRoutes.js
├── services/           # Business logic
│   ├── authService.js
│   └── emailService.js
├── .env                # Environment variables
├── .env.example        # Example environment variables
├── server.js           # Entry point
└── package.json        # Dependencies
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Start the server: `npm start`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user (sets HTTP-only cookie)
- `POST /api/auth/login` - Login (sets HTTP-only cookie with JWT token)
- `GET /api/auth/logout` - Logout (clears auth cookie)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password with token
- `PUT /api/auth/update-password` - Update password (requires authentication)

## Environment Variables

Create a `.env` file with the following variables:

```
# MongoDB Connection String
MONGO_URI=mongodb://localhost:27017/routemate

# JWT Secret Key
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d
JWT_COOKIE_EXPIRES_IN=1

# Node Environment
NODE_ENV=development

# Server Port
PORT=5000

# Frontend URLs
FRONTEND_URL_DEV=http://localhost:3000
FRONTEND_URL_PROD=https://yourproductionurl.com

# Email Configuration for Nodemailer
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM=your_email@gmail.com

# Password Reset Token Expiry (in minutes)
PASSWORD_RESET_EXPIRES=30

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/v1/auth/github/callback
```

## Dependencies

- express - Web framework
- mongoose - MongoDB ODM
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- nodemailer - Email sending
- dotenv - Environment variables
- cors - CORS support
- express-rate-limit - API rate limiting
- morgan - HTTP request logger
