#!/bin/bash

# Docker Init Script for Deployio Documentation
# This script runs during container startup to seed documentation

set -e

echo "🐳 Docker Init: Starting documentation initialization..."

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB connection..."
node -e "
const mongoose = require('mongoose');
const connectWithRetry = () => {
  mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL)
    .then(() => {
      console.log('✅ MongoDB connected');
      mongoose.disconnect();
      process.exit(0);
    })
    .catch(() => {
      console.log('⏳ MongoDB not ready, retrying in 5s...');
      setTimeout(connectWithRetry, 5000);
    });
};
connectWithRetry();
"

# Check if documentation should be seeded
if [ "${SEED_DOCS_ON_STARTUP}" = "true" ]; then
    echo "🌱 Seeding documentation from environment variable..."
    node scripts/seed-docs.js
elif [ "${FORCE_SEED_DOCS}" = "true" ]; then
    echo "🌱 Force seeding documentation..."
    node scripts/seed-docs.js --force
else
    echo "ℹ️  Skipping documentation seeding (set SEED_DOCS_ON_STARTUP=true to enable)"
fi

echo "✅ Docker Init: Documentation initialization completed"
