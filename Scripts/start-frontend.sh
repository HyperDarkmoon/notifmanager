#!/bin/bash

# Notification Manager Frontend Startup Script
# This script starts the React development/production server

echo "========================================="
echo "Starting Notification Manager Frontend"
echo "========================================="

# Frontend directory
FRONTEND_DIR="E:/notifmanager"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Error: Frontend directory $FRONTEND_DIR not found!"
    echo "Please ensure the frontend is located at $FRONTEND_DIR"
    exit 1
fi

# Navigate to frontend directory
cd "$FRONTEND_DIR" || exit 1

echo "Current directory: $(pwd)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found in $FRONTEND_DIR"
    echo "Please ensure this is a valid Node.js project directory."
    exit 1
fi

# Check if node_modules exists, if not run npm install
if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
fi

# Check if build directory exists for production mode
if [ -d "build" ]; then
    echo "Build directory found. Starting production server..."
    
    # Check if serve is installed globally
    if command -v serve &> /dev/null; then
        echo "Using 'serve' to host production build..."
        serve -s build -l 3000
    else
        echo "Installing serve globally..."
        npm install -g serve
        if [ $? -eq 0 ]; then
            echo "Starting production server with serve..."
            serve -s build -l 3000
        else
            echo "Failed to install serve. Starting development server instead..."
            npm start
        fi
    fi
else
    echo "No build directory found. Starting development server..."
    npm start
fi

echo "Frontend server startup script completed."
