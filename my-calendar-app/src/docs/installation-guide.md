# Installation Guide

This guide provides detailed instructions for setting up the Academic Calendar application on your local environment.

## System Requirements

- **Node.js**: Version 14.x or higher
- **npm**: Version 6.x or higher (comes with Node.js)
- **Disk Space**: At least 200MB free space
- **Supported OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/academic-calendar.git
cd academic-calendar
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies for both frontend and backend components.

### 3. Environment Configuration

Create a `.env` file in the root directory:

```
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration (SQLite)
DB_PATH=./src/calendar_database.db
```

### 4. Database Setup

The application uses SQLite which doesn't require a separate server installation. The database file will be created automatically when you start the server for the first time.

### 5. Starting the Development Server

You'll need to run both the frontend and backend services:

#### Start the Backend Server

```bash
node src/server.js
```

This will start the API server on port 5001 (or the port you specified in your .env file).

#### Start the Frontend Development Server

In a new terminal window:

```bash
npm start
```

This will start the React development server and automatically open your browser to `http://localhost:3000`.

### 6. Building for Production

To create a production-ready build:

```bash
npm run build
```

This creates optimized files in the `build` folder.

To serve the production build:

```bash
# Install serve globally
npm install -g serve

# Serve the production build
serve -s build
```

## Docker Installation (Alternative)

If you prefer using Docker:

### 1. Build the Docker Image

```bash
docker build -t academic-calendar .
```

### 2. Run the Container

```bash
docker run -p 3000:3000 -p 5001:5001 academic-calendar
```

## Troubleshooting

### Common Issues

#### API Connection Failed

If the frontend cannot connect to the backend:

1. Ensure the backend server is running on port 5001
2. Check that your firewall isn't blocking local connections
3. Verify that the API_BASE_URL in src/constants.js is correctly set to 'http://localhost:5001/api'

#### Database Errors

If you encounter database errors:

1. Delete the database file (calendar_database.db) to reset the database
2. Restart the server to recreate the database schema
3. Check file permissions if running on Linux/macOS

#### Port Conflicts

If port 3000 or 5001 is already in use:

1. For the frontend, you can specify a different port:
   ```bash
   PORT=3001 npm start
   ```

2. For the backend, modify the PORT in your .env file and update the API_BASE_URL in src/constants.js accordingly

### Getting Support

If you encounter issues not covered in this guide:

1. Check the project issues on GitHub
2. Post a new issue with detailed information about the problem
3. Include relevant error messages and your environment details

## Updating the Application

To update to the latest version:

```bash
git pull
npm install
```

Then restart both the frontend and backend servers.
