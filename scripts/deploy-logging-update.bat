@echo off
REM DeployIO Services Update Script for Windows
REM This script updates the services with the new standardized logging and metrics

echo 🚀 Starting DeployIO services update...

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ❌ Error: docker-compose.yml not found. Please run this script from the project root.
    exit /b 1
)

REM Create logs directories if they don't exist
echo 📁 Creating logs directories...
if not exist "server\logs" mkdir "server\logs"
if not exist "ai-service\logs" mkdir "ai-service\logs"
if not exist "agent\logs" mkdir "agent\logs"

REM Stop existing services
echo 🛑 Stopping existing services...
docker-compose down --remove-orphans

REM Remove any existing log volumes to ensure clean start
echo 🧹 Cleaning up old volumes...
docker volume prune -f

REM Pull latest images
echo 📥 Pulling latest images...
docker-compose pull

REM Start services with new configuration
echo 🆙 Starting services with updated configuration...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak

REM Test the services
echo 🧪 Testing services...

REM Test each service using curl if available
where curl >nul 2>nul
if %errorlevel% equ 0 (
    echo Testing Backend...
    curl -f -s "http://localhost:5000/health" >nul 2>nul && echo ✅ Backend is responding || echo ❌ Backend not responding
    
    echo Testing AI Service...
    curl -f -s "http://localhost:8000/service/v1/health" >nul 2>nul && echo ✅ AI Service is responding || echo ❌ AI Service not responding
    
    echo Testing Agent...
    curl -f -s "http://localhost:8001/agent/v1/health" >nul 2>nul && echo ✅ Agent is responding || echo ❌ Agent not responding
) else (
    echo ⚠️ curl not found, skipping health checks
)

REM Show service status
echo 📊 Service Status:
docker-compose ps

echo.
echo 🎉 Update completed!
echo.
echo 📝 Next steps:
echo 1. Check the logs: docker-compose logs -f [service-name]
echo 2. Monitor metrics at your frontend dashboard
echo 3. Test log streaming in the admin panel
echo.
echo 🔧 If you encounter issues:
echo - Check container logs: docker-compose logs [service-name]
echo - Restart individual service: docker-compose restart [service-name]
echo - Check disk space
echo - Check permissions

pause
