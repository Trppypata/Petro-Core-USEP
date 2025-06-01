# Petro-Core USEP

A geology-focused web application for rock and mineral identification and education.

## Project Structure

- **Petro-Core/** - Frontend React application
- **Server/** - Backend Node.js API server

## Setup Instructions

1. Clone the repository
2. Install dependencies for both frontend and backend:

```bash
# Install frontend dependencies
cd Petro-Core
npm install

# Install backend dependencies
cd ../Server
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env` in both directories
   - Fill in required environment variables (database connection, Supabase, etc.)

## Running the Application

### Using Batch Files (Windows)

For convenience, use these batch files:

- `start-frontend.bat` - Starts only the frontend server
- `start-backend.bat` - Starts only the backend server
- `start-all.bat` - Starts both frontend and backend servers in separate windows

### Manual Commands

Start the frontend:
```bash
cd Petro-Core
npm run dev
```

Start the backend:
```bash
cd Server
npm run dev
```

## Important Notes

- Always run npm commands from the correct directories (Petro-Core or Server)
- The frontend runs on port 5173 by default, the backend on port 8001
- Wait for the backend server to fully start before using the application
- Make sure image paths and API URLs are correctly configured in environment variables

## Features

- Rock and mineral database with detailed properties
- Image gallery for rock and mineral specimens
- Field work resources
- Admin management interface
- Responsive design across devices

## Tech Stack

- Frontend: React, TypeScript, Vite, TailwindCSS
- Backend: Node.js, Express, PostgreSQL/Supabase
- Storage: Supabase storage for images 