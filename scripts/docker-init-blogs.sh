#!/bin/bash

# Blog initialization script for Docker containers
# This script runs blog seeding when the container starts

set -e

echo "🚀 Starting Deployio Blog Initialization..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until npm run db:check >/dev/null 2>&1; do
    echo "   Database not ready, retrying in 5 seconds..."
    sleep 5
done
echo "✅ Database connection established"

# Check if blogs are already seeded
echo "🔍 Checking blog seeding status..."
BLOG_COUNT=$(node -e "
const mongoose = require('mongoose');
const Blog = require('./models/Blog');
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/deployio');
Blog.countDocuments().then(count => {
  console.log(count);
  process.exit(0);
}).catch(() => {
  console.log(0);
  process.exit(0);
});
" 2>/dev/null || echo "0")

echo "📊 Found ${BLOG_COUNT} blog posts in database"

# Determine seeding strategy based on environment
if [ "${NODE_ENV}" = "production" ]; then
    echo "🏭 Production environment detected"

    if [ "${BLOG_COUNT}" -eq "0" ]; then
        echo "🌱 No blogs found, running initial seeding..."
        node scripts/seed-blogs.js --force
    else
        echo "📝 Blogs exist, running sync to update any changes..."
        node scripts/seed-blogs.js --force
    fi

elif [ "${NODE_ENV}" = "development" ]; then
    echo "🔧 Development environment detected"

    # In development, always run seeding to ensure latest content
    echo "🔄 Running blog sync for development..."
    node scripts/seed-blogs.js --force

else
    echo "🧪 Test/other environment detected"

    if [ "${BLOG_COUNT}" -eq "0" ]; then
        echo "🌱 No blogs found, running initial seeding..."
        node scripts/seed-blogs.js --force
    else
        echo "✅ Blogs exist, skipping seeding in test environment"
    fi
fi

echo "✅ Blog initialization completed successfully!"
echo ""
echo "📖 Blog Statistics:"
echo "   Total blog posts: $(node -e "
const mongoose = require('mongoose');
const Blog = require('./models/Blog');
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/deployio');
Blog.countDocuments().then(count => {
  console.log(count);
  mongoose.connection.close();
}).catch(() => console.log('0'));
" 2>/dev/null || echo "0")"

echo "   Published posts: $(node -e "
const mongoose = require('mongoose');
const Blog = require('./models/Blog');
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/deployio');
Blog.countDocuments({status: 'published'}).then(count => {
  console.log(count);
  mongoose.connection.close();
}).catch(() => console.log('0'));
" 2>/dev/null || echo "0")"

echo "   Featured posts: $(node -e "
const mongoose = require('mongoose');
const Blog = require('./models/Blog');
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/deployio');
Blog.countDocuments({featured: true, status: 'published'}).then(count => {
  console.log(count);
  mongoose.connection.close();
}).catch(() => console.log('0'));
" 2>/dev/null || echo "0")"

echo ""
echo "🎉 Ready to serve blog content!"
echo "   Blog API: http://localhost:${PORT:-3000}/api/v1/blog"
echo "   Blog UI:  http://localhost:${PORT:-3000}/blog"
echo ""
