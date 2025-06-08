#!/bin/bash

# Print environment variables to check they are loaded correctly
echo "Checking environment variables..."
echo "VITE_APP_ENV: $VITE_APP_ENV"
echo "VITE_APP_BACKEND_URL: $VITE_APP_BACKEND_URL"
echo "VITE_APP_FASTAPI_URL: $VITE_APP_FASTAPI_URL"

# Run the original command (serve -s dist -l 80)
exec "$@"
