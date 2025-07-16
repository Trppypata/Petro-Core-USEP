# Environment Variables Setup for Petro-Core Project

This document explains how to set up and use environment variables across the Petro-Core system.

## Backend Environment Variables (Server)

The backend server uses a `.env` file located in the `Server` directory.

### Development Environment

Create a file named `.env` in the `Server` directory with the following content:

```
PORT=8001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Replace `your_supabase_url` and `your_service_role_key` with your actual Supabase credentials.

### Production Environment

Create a file named `.env.production` in the `Server` directory with the following content:

```
PORT=80
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=production
```

To use the production environment variables, run the server with:

```
NODE_ENV=production npm start
```

## Frontend Environment Variables (Petro-Core)

The frontend uses Vite's environment variable system. Vite automatically loads variables from `.env`, `.env.local`, `.env.development`, or `.env.production` files.

### Development Environment

Create a file named `.env` in the `Petro-Core` directory with the following content:

```
VITE_local_url=http://localhost:8001
VITE_API_URL=https://petro-core-usep-iw23.onrender.com/api
```

### Production Environment

Create a file named `.env.production` in the `Petro-Core` directory with the following content:

```
VITE_local_url=https://your-production-api.com
VITE_API_URL=https://your-production-api.com/api
```

Replace `https://your-production-api.com` with your actual production API URL.

## Using Environment Variables

### In the Backend

In your server code, access variables using `process.env`:

```typescript
const port = process.env.PORT || 8001;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

### In the Frontend

In your frontend code, access variables using `import.meta.env`:

```typescript
const apiUrl =
  import.meta.env.VITE_API_URL ||
  "https://petro-core-usep-iw23.onrender.com/api";
const baseUrl = import.meta.env.VITE_local_url || "http://localhost:8001";
```

## Cross-System Consistency

To ensure your entire system (frontend and backend) works together:

1. Keep the port numbers consistent between your frontend environment variables and backend server port
2. When deploying to production, update both the frontend and backend environment files
3. For local development, ensure your frontend is pointing to the correct backend URL

## Troubleshooting

- If you update environment variables while the applications are running, you'll need to restart them for changes to take effect
- Make sure environment files are not committed to version control (they should be in your `.gitignore`)
- For Vite, only variables prefixed with `VITE_` are exposed to your frontend code
