#!/bin/bash

echo "🔍 Checking MongoDB status..."

# Kiểm tra xem MongoDB có đang chạy không
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB is already running"
    ps aux | grep mongod | grep -v grep
else
    echo "❌ MongoDB is not running"
    echo ""
    echo "🚀 Starting MongoDB..."
    
    # Thử các cách khởi động MongoDB khác nhau
    if command -v brew &> /dev/null; then
        echo "Using Homebrew to start MongoDB..."
        brew services start mongodb-community
        sleep 3
    elif command -v mongod &> /dev/null; then
        echo "Starting MongoDB directly..."
        mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork
        sleep 3
    else
        echo "❌ MongoDB not found. Please install MongoDB first:"
        echo "   brew install mongodb-community"
        exit 1
    fi
fi

echo ""
echo "🧪 Testing MongoDB connection..."

# Test connection
if mongo --eval "db.runCommand('ping').ok" localhost:27017/test --quiet; then
    echo "✅ MongoDB connection successful!"
    echo ""
    echo "📊 Database info:"
    mongo --eval "
        print('MongoDB version:', version());
        print('Available databases:');
        db.adminCommand('listDatabases').databases.forEach(function(db) {
            print('  -', db.name);
        });
    " --quiet
else
    echo "❌ Cannot connect to MongoDB"
    echo ""
    echo "🛠️  Troubleshooting steps:"
    echo "1. Install MongoDB: brew install mongodb-community"
    echo "2. Start MongoDB: brew services start mongodb-community"
    echo "3. Check logs: tail -f /usr/local/var/log/mongodb/mongo.log"
fi
