# Render Deployment Configuration

## Backend Environment Variables

Set these environment variables in your Render backend service:

```
NODE_ENV=production
PORT=80
SUPABASE_URL=https://tobjghstopxuntbewrxu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
FRONTEND_URL=https://your-frontend-domain.onrender.com
```

## Frontend Environment Variables

For your frontend deployment, set these variables:

```
VITE_SUPABASE_URL=https://tobjghstopxuntbewrxu.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_URL=https://petro-core-usep.onrender.com/api
VITE_local_url=https://petro-core-usep.onrender.com
```

## Deployment Steps

### Backend Deployment on Render:

1. Connect your GitHub repository
2. Choose "Web Service"
3. Set the following:
   - **Root Directory**: `Server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18
4. Add the environment variables listed above
5. Deploy

### Frontend Deployment:

1. Update `Petro-Core/src/services/api.service.ts`:

   ```typescript
   const API_URL = "https://petro-core-usep.onrender.com/api";
   ```

2. If deploying frontend on Render:

   - **Root Directory**: `Petro-Core`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Node Version**: 18

3. Add the frontend environment variables

## CORS Configuration

The backend is now configured to allow these origins:

- localhost (for development)
- Your frontend Render URL
- Vercel/Netlify URLs (if you use those)

Update the `allowedOrigins` array in `Server/src/index.ts` with your actual frontend URL.

## Troubleshooting

1. **CORS Errors**: Check that your frontend URL is in the `allowedOrigins` array
2. **Environment Variables**: Verify all variables are set in Render dashboard
3. **Build Errors**: Check the build logs in Render dashboard
4. **Database Connection**: Ensure Supabase service role key is correct

## Important Notes

- The service role key should be kept secret and only used on the backend
- Frontend should only use the anon key
- Make sure to restart both services after environment variable changes
