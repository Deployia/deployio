#!/bin/bash

# Production Log Directory Check Script
# This script helps diagnose production logging issues

echo "=== DeployIO Production Log Diagnostics ==="
echo "Date: $(date)"
echo

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Run this script from the project root."
    exit 1
fi

echo "📁 Checking log directories..."

# Check host log directories
echo
echo "1. Host Log Directories:"
for service in "server" "ai-service"; do
    log_dir="./${service}/logs"
    if [ -d "$log_dir" ]; then
        echo "   ✅ ${log_dir} exists"
        echo "      Permissions: $(ls -ld "$log_dir" | awk '{print $1, $3, $4}')"
        if [ -w "$log_dir" ]; then
            echo "      Status: Writable ✅"
        else
            echo "      Status: Not writable ❌"
        fi

        # Check for log files
        log_count=$(find "$log_dir" -name "*.log" 2>/dev/null | wc -l)
        echo "      Log files: $log_count"

        if [ $log_count -gt 0 ]; then
            echo "      Recent logs:"
            find "$log_dir" -name "*.log" -exec ls -la {} \; | head -5
        fi
    else
        echo "   ❌ ${log_dir} does not exist"
        echo "      Creating directory..."
        mkdir -p "$log_dir"
        chmod 755 "$log_dir"
        echo "      ✅ Created ${log_dir}"
    fi
    echo
done

echo "2. Docker Container Status:"
docker-compose ps

echo
echo "3. Checking container log mounts:"
for service in "backend" "ai-service"; do
    echo "   Checking ${service}..."
    if docker-compose ps | grep -q "${service}"; then
        container_name=$(docker-compose ps -q ${service})
        if [ ! -z "$container_name" ]; then
            echo "      Container ID: $container_name"
            echo "      Mount info:"
            docker inspect $container_name | jq -r '.[0].Mounts[] | select(.Destination == "/app/logs") | "        Source: \(.Source), Destination: \(.Destination), RW: \(.RW)"'

            echo "      Container /app/logs permissions:"
            docker exec $container_name ls -la /app/logs 2>/dev/null || echo "        ❌ Cannot access /app/logs in container"

            echo "      Testing write access in container:"
            docker exec $container_name touch /app/logs/test-write.log 2>/dev/null &&
                echo "        ✅ Can write to /app/logs" &&
                docker exec $container_name rm /app/logs/test-write.log ||
                echo "        ❌ Cannot write to /app/logs"
        fi
    else
        echo "      ❌ Service not running"
    fi
    echo
done

echo "4. Log File Analysis:"
for service in "server" "ai-service"; do
    log_dir="./${service}/logs"
    if [ -d "$log_dir" ]; then
        echo "   ${service} logs:"
        for log_file in "$log_dir"/*.log; do
            if [ -f "$log_file" ]; then
                echo "      📄 $(basename "$log_file")"
                echo "         Size: $(du -h "$log_file" | cut -f1)"
                echo "         Modified: $(stat -c %y "$log_file" 2>/dev/null || stat -f %Sm "$log_file" 2>/dev/null)"
                echo "         Last 3 lines:"
                tail -n 3 "$log_file" | sed 's/^/           /'
            fi
        done
    fi
    echo
done

echo "5. Recommended Actions:"
echo "   If logs are not being written:"
echo "   1. Ensure log directories exist and are writable:"
echo "      mkdir -p ./server/logs ./ai-service/logs"
echo "      chmod 755 ./server/logs ./ai-service/logs"
echo
echo "   2. Restart services to remount volumes:"
echo "      docker-compose down"
echo "      docker-compose up -d"
echo
echo "   3. Check application logging configuration:"
echo "      - Verify LOG_LEVEL environment variables"
echo "      - Check Winston configuration in server/config/logger.js"
echo "      - Verify Python logging in ai-service/config/logging.py"
echo
echo "   4. Monitor logs in real-time:"
echo "      docker-compose logs -f backend"
echo "      docker-compose logs -f ai-service"

echo
echo "=== Diagnostics Complete ==="
