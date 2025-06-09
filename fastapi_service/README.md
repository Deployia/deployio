# FastAPI Service

A clean, modular FastAPI service with centralized configuration and logging.

## Architecture Overview

```
fastapi_service/
├── main.py                 # Application entry point
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container configuration
├── .env                   # Development environment variables
├── .env.production        # Production environment variables
├── config/                # Configuration modules
│   ├── __init__.py       # Main app factory and setup
│   ├── cors.py           # CORS configuration
│   ├── database.py       # Database connection management
│   ├── logging.py        # Centralized logging configuration
│   └── settings.py       # Application settings
├── middleware/           # Custom middleware
│   ├── __init__.py
│   ├── error_handler.py  # Global error handling
│   └── jwt_auth.py       # JWT authentication
├── models/              # Pydantic models
│   ├── __init__.py
│   ├── auth.py          # Authentication models
│   └── response.py      # Response models
└── routes/              # API routes
    ├── __init__.py
    ├── health.py        # Health check endpoints
    └── protected.py     # Protected routes
```

## Key Features

### 🏗️ Clean Architecture

- **Modular design**: Each component has a specific responsibility
- **Centralized configuration**: All settings in dedicated config modules
- **Structured logging**: Centralized logging setup with proper formatters
- **No unused dependencies**: Only essential packages in requirements.txt

### 📝 Logging System

- **Location**: `config/logging.py`
- **Configuration**: Dictionary-based logging configuration
- **Features**:
  - Structured format with timestamps
  - Separate handlers for different log types
  - Database logger silencing to reduce noise
  - Debug/Info level switching based on environment
- **Usage**: `logger = logging.getLogger(__name__)` in any module

### 🔧 Configuration Management

- **Settings**: Centralized in `config/settings.py` using Pydantic
- **Environment-specific**: Separate `.env` files for dev/prod
- **Type validation**: Automatic validation and type conversion

### 🛡️ Middleware

- **Error handling**: Global exception handlers
- **JWT Authentication**: Token validation and user session management
- **CORS**: Environment-specific CORS configuration
- **Security**: Trusted host and compression middleware

## Usage

### Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

### Production

```bash
# Build Docker image
docker build -t fastapi-service .

# Run container
docker run -p 8000:8000 fastapi-service
```

## API Endpoints

- `GET /service/v1/health` - Health check
- `GET /service/v1/hello` - Simple greeting
- `GET /service/v1/test-logging` - Logging demonstration
- `GET /service/v1/protected` - JWT-protected endpoint

## Environment Variables

| Variable      | Description               | Default                              |
| ------------- | ------------------------- | ------------------------------------ |
| `DEBUG`       | Enable debug mode         | `false`                              |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/deployio` |
| `JWT_SECRET`  | JWT signing secret        | Required                             |
| `HOST`        | Server host               | `0.0.0.0`                            |
| `PORT`        | Server port               | `8000`                               |
| `CLIENT_URL`  | Frontend URL for CORS     | `http://localhost:5173`              |

## Logging Examples

```python
import logging

# Get logger for current module
logger = logging.getLogger(__name__)

# Log messages
logger.info("Application started")
logger.debug("Debug information")  # Only shown when DEBUG=true
logger.error("Error occurred")
```

## Clean Architecture Benefits

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Easy to mock and test individual components
3. **Scalability**: Easy to add new features without affecting existing code
4. **Configuration**: Centralized and environment-aware settings
5. **Monitoring**: Structured logging for better observability
