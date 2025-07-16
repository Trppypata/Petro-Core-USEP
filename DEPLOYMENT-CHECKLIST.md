# 🚀 Petro-Core Deployment Checklist

## ✅ Pre-Deployment Fixes Applied

- [x] Fixed CORS configuration for production
- [x] Updated backend package.json scripts
- [x] Created deployment configuration guide

## 🔧 Next Steps for You

### 1. Update Frontend API URL

In `Petro-Core/src/services/api.service.ts`, change the hardcoded URL:

```typescript
const API_URL = "https://petro-core-usep.onrender.com/api";
```

### 2. Add Your Frontend URL to CORS

In `Server/src/index.ts`, update the `allowedOrigins` array with your actual frontend URL:

```typescript
const allowedOrigins = [
  "http://localhost:5173", // Keep for development
  "https://your-actual-frontend-domain.onrender.com", // Add your real URL here
  // ... other origins
];
```

### 3. Set Environment Variables in Render

**Backend Service Environment Variables:**

```
NODE_ENV=production
PORT=80
SUPABASE_URL=https://tobjghstopxuntbewrxu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=https://your-frontend-domain.onrender.com
```

**Frontend Service Environment Variables:**

```
VITE_SUPABASE_URL=https://tobjghstopxuntbewrxu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://petro-core-usep.onrender.com/api
VITE_local_url=https://petro-core-usep.onrender.com
```

### 4. Render Backend Configuration

- **Root Directory**: `Server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18

### 5. Render Frontend Configuration

- **Root Directory**: `Petro-Core`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18

## 🐛 Common CORS Issues & Solutions

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**: Add your frontend domain to the `allowedOrigins` array

### Issue: "CORS policy: Request header field authorization is not allowed"

**Solution**: Already fixed - Authorization header is now in `allowedHeaders`

### Issue: "Credentials are not supported if the CORS header 'Access-Control-Allow-Origin' is '\*'"

**Solution**: Already fixed - Using specific origins instead of '\*'

## 🔍 Testing Your Deployment

1. **Check Backend Health**: Visit `https://petro-core-usep.onrender.com/api/health`
2. **Check CORS**: Open browser DevTools while using your frontend
3. **Check Environment Variables**: Look for console logs showing correct URLs

## 📞 If You Still Have Issues

1. Check Render deployment logs for errors
2. Verify all environment variables are set correctly
3. Make sure both services are fully deployed and running
4. Test API endpoints directly using Postman or curl

## 🎯 Key Points

- Never use wildcards (\*) in production CORS
- Always set credentials: true when using authentication
- Environment variables must be set in Render dashboard
- Restart services after changing environment variables
