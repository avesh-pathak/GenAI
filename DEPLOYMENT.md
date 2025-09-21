# 🚀 LegalEase AI - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Google Gemini API Key**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Quick Deployment Steps

### 1. Prepare Your Repository

Make sure your repository includes:
- ✅ `vercel.json` (already configured)
- ✅ `package.json` with correct scripts
- ✅ All source files
- ✅ `.env.example` for reference

### 2. Deploy to Vercel

**Option A: Using Vercel Dashboard**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect it as a Node.js project
5. Configure environment variables (see step 3)
6. Click "Deploy"

**Option B: Using Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Follow the prompts to configure your project
```

### 3. Configure Environment Variables

In your Vercel dashboard, go to your project settings and add these environment variables:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-project-name.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/tmp/uploads
```

### 4. Custom Domain (Optional)

1. In your Vercel project settings, go to "Domains"
2. Add your custom domain
3. Update the `CORS_ORIGIN` environment variable to match your domain

## Important Notes for Vercel Deployment

### File Upload Limitations
- Vercel has limitations on file uploads in serverless functions
- Files are stored in `/tmp` which is ephemeral
- For production, consider using external storage (AWS S3, Cloudinary, etc.)

### Function Timeout
- Vercel free tier has a 10-second function timeout
- Pro tier has 60 seconds (recommended for document processing)

### Memory Limits
- Free tier: 1024MB
- Pro tier: 3008MB (recommended for PDF processing)

## Vercel Configuration Details

The `vercel.json` file is already configured with:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "./api/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "./public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

### File Structure for Vercel

The project now includes:
- `api/index.js` - Serverless function entry point
- `server.js` - Main Express application
- `public/` - Static files (HTML, CSS, JS)
- `vercel.json` - Vercel deployment configuration

## Post-Deployment Checklist

- [ ] Test document upload functionality
- [ ] Verify AI analysis is working
- [ ] Check rate limiting
- [ ] Test on mobile devices
- [ ] Set up monitoring/analytics
- [ ] Configure custom domain (if needed)

## Troubleshooting

### Common Issues:

1. **"Function timeout"**
   - Upgrade to Vercel Pro for longer timeouts
   - Optimize document processing

2. **"API Key errors"**
   - Verify `GEMINI_API_KEY` is set correctly
   - Check API key permissions

3. **File upload failures**
   - Check file size limits
   - Verify supported file types

4. **CORS errors**
   - Update `CORS_ORIGIN` environment variable
   - Check domain configuration

## Support

For deployment issues:
- Check Vercel's [deployment documentation](https://vercel.com/docs)
- Review the application logs in Vercel dashboard
- Test locally first with `npm run dev`

## Production Monitoring

Consider adding:
- Error tracking (Sentry, LogRocket)
- Analytics (Google Analytics, Mixpanel)
- Uptime monitoring (UptimeRobot, Pingdom)
- Performance monitoring (New Relic, Datadog)