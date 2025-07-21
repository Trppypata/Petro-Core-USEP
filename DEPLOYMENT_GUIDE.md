# Deployment Guide - CORS Fix

## The Problem

Your app had hardcoded API URLs scattered throughout the codebase, causing CORS issues when deploying to different environments.

## The Solution

Now everything uses a single environment variable `VITE_API_URL` that you can easily change for different deployments.

## Deployment Steps

### 1. For Local Development

- Use the current `.env` file (already set to localhost)
- Run: `npm run dev`

### 2. For Vercel Deployment (Frontend)

**Option A: Use Environment Variables in Vercel Dashboard**

1. Go to your Vercel project settings
2. Add environment variable:
   - Name: `VITE_API_URL`
   - Value: `https://petro-core-usep-iw23.onrender.com/api`
3. Redeploy

**Option B: Use the production env file**

1. The `.env.production` file is already configured
2. Vercel will automatically use it for production builds

### 3. For Render Backend

1. Make sure your Render service has these environment variables:

   ```
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=https://tobjghstopxuntbewrxu.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

2. Update the CORS origins in `Server/src/index.ts` with your actual Vercel URL

### 4. Update CORS Origins

Once you deploy to Vercel and get your URL, update this line in `Server/src/index.ts`:

```typescript
"https://your-actual-vercel-url.vercel.app",
```

## Quick Test

1. Deploy backend to Render first
2. Test the API endpoint: `https://your-render-url.onrender.com/api/health`
3. Deploy frontend to Vercel
4. Update CORS origins with your Vercel URL
5. Redeploy backend

## Environment Variables Summary

### Frontend (.env)

```
VITE_SUPABASE_URL=https://tobjghstopxuntbewrxu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8001/api  # for development
```

### Frontend (.env.production or Vercel env vars)

```
VITE_SUPABASE_URL=https://tobjghstopxuntbewrxu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://petro-core-usep-iw23.onrender.com/api  # for production
```

### Backend (Render env vars)

```
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://tobjghstopxuntbewrxu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## Troubleshooting

- If you still get CORS errors, check that your Vercel URL is in the `allowedOrigins` array
- Make sure the backend is deployed and accessible before deploying frontend
- Check browser network tab to see which URL the frontend is trying to call
