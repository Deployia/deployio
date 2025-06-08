#!/bin/bash
# Local development environment setup script

# Check if .env.local exists, if not create it with default values
if [ ! -f "./client/.env.local" ]; then
    echo "Creating client/.env.local with development settings..."
    cat >./client/.env.local <<EOF
VITE_APP_ENV=development
VITE_APP_BACKEND_URL=http://localhost:3000/api/v1
VITE_APP_FASTAPI_URL=http://localhost:8000/service/v1
EOF
    echo "Created client/.env.local successfully"
else
    echo "client/.env.local already exists, skipping"
fi

# Display current environment settings
echo -e "\nCurrent environment settings:"
echo "================================"
echo -e "BACKEND:\t$(grep -r BACKEND_URL ./client/.env.local | cut -d '=' -f2)"
echo -e "FASTAPI:\t$(grep -r FASTAPI_URL ./client/.env.local | cut -d '=' -f2)"
echo -e "ENV:\t\t$(grep -r APP_ENV ./client/.env.local | cut -d '=' -f2)"
echo "================================"

# Option to edit environment variables
read -p "Do you want to edit these settings? (y/n): " edit_choice
if [[ $edit_choice == "y" || $edit_choice == "Y" ]]; then
    # Determine which editor to use
    if [ -n "$EDITOR" ]; then
        $EDITOR ./client/.env.local
    elif command -v nano >/dev/null; then
        nano ./client/.env.local
    elif command -v vim >/dev/null; then
        vim ./client/.env.local
    else
        echo "No suitable editor found. Please edit ./client/.env.local manually."
    fi
fi

echo -e "\nEnvironment setup complete!"
echo "Run npm run dev in the client directory to start development server"
