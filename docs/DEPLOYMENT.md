# 🚀 Deployment Guide - Custom Figma MCP Server

This guide covers deploying your Figma MCP server to various cloud platforms for remote access.

## 📋 Pre-Deployment Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Build the project:**
```bash
npm run build
```

3. **Test locally:**
```bash
npm run dev:web
# Visit: http://localhost:3000
```

---

## 🌐 Deployment Options

### 1. **Vercel (Recommended - Free)**

#### Quick Deploy:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable
vercel env add FIGMA_ACCESS_TOKEN
# Enter: figd_NP6ZtpGH0DppWRqngL8c4R-Qm5A26rVg1ykzTJs4
```

#### Your URL will be:
```
https://custom-figma-mcp-[random].vercel.app
```

### 2. **Railway (Easy - Free Tier)**

#### Deploy Steps:
1. Push to GitHub
2. Go to [Railway.app](https://railway.app)
3. Connect GitHub repo
4. Set environment variable: `FIGMA_ACCESS_TOKEN=figd_NP6ZtpGH0DppWRqngL8c4R-Qm5A26rVg1ykzTJs4`
5. Deploy automatically

#### Your URL will be:
```
https://custom-figma-mcp-production.up.railway.app
```

### 3. **Docker Deployment**

#### Local Docker:
```bash
# Build image
docker build -t figma-mcp .

# Run container
docker run -p 3000:3000 -e FIGMA_ACCESS_TOKEN=figd_NP6ZtpGH0DppWRqngL8c4R-Qm5A26rVg1ykzTJs4 figma-mcp
```

#### Docker Compose:
```bash
# Set environment variable
export FIGMA_ACCESS_TOKEN=figd_NP6ZtpGH0DppWRqngL8c4R-Qm5A26rVg1ykzTJs4

# Deploy
docker-compose up -d
```

### 4. **Heroku**

```bash
# Install Heroku CLI and login
heroku create your-figma-mcp

# Set environment variable
heroku config:set FIGMA_ACCESS_TOKEN=figd_NP6ZtpGH0DppWRqngL8c4R-Qm5A26rVg1ykzTJs4

# Deploy
git push heroku main
```

### 5. **DigitalOcean App Platform**

1. Connect GitHub repo
2. Set environment variable: `FIGMA_ACCESS_TOKEN`
3. Set build command: `npm run build`
4. Set run command: `npm run start:web`

---

## 🔧 API Endpoints (Once Deployed)

Your deployed server will have these endpoints:

### **Health Check:**
```
GET https://your-domain.com/health
```

### **List All Tools:**
```
GET https://your-domain.com/api/tools
```

### **Get Figma File:**
```
GET https://your-domain.com/api/file
```

### **Get Components:**
```
GET https://your-domain.com/api/components
```

### **Web Interface:**
```
GET https://your-domain.com/
```

---

## 🔗 Integration with Remote AI Tools

### **Claude Desktop (Remote):**
```json
{
  "mcpServers": {
    "figma-remote": {
      "command": "curl",
      "args": ["-X", "POST", "https://your-domain.com/api/mcp"],
      "env": {}
    }
  }
}
```

### **API Integration:**
```javascript
// Example: Call from any application
const response = await fetch('https://your-domain.com/api/file');
const figmaData = await response.json();
```

---

## 🛡️ Security Considerations

### **Environment Variables:**
- ✅ Never commit tokens to Git
- ✅ Use platform environment variable systems
- ✅ Rotate tokens periodically

### **CORS Configuration:**
The server includes CORS headers for cross-origin requests.

### **Rate Limiting:**
Consider adding rate limiting for production:
```bash
npm install express-rate-limit
```

---

## 📊 Monitoring & Logs

### **Health Monitoring:**
```bash
# Check if server is healthy
curl https://your-domain.com/health
```

### **View Logs:**
- **Vercel:** `vercel logs`
- **Railway:** View in dashboard
- **Heroku:** `heroku logs --tail`

---

## 🔄 Updates & Maintenance

### **Update Deployment:**
```bash
# For Vercel
vercel --prod

# For Railway
git push origin main  # Auto-deploys

# For Docker
docker build -t figma-mcp . && docker-compose up -d
```

### **Environment Updates:**
```bash
# Update Figma token
vercel env rm FIGMA_ACCESS_TOKEN
vercel env add FIGMA_ACCESS_TOKEN
```

---

## 🧪 Testing Deployed Server

### **Quick Test:**
```bash
# Replace with your deployed URL
curl "https://your-domain.com/api/tools"
```

### **Full Test:**
```bash
# Test file retrieval
curl "https://your-domain.com/api/file" | jq .
```

---

## 🎯 Production Checklist

- [ ] Environment variables set securely
- [ ] Health check endpoint working
- [ ] CORS configured properly
- [ ] Logs accessible
- [ ] Domain/URL accessible
- [ ] API endpoints responding
- [ ] Error handling working
- [ ] Performance acceptable

---

## 🆘 Troubleshooting

### **Common Issues:**

1. **"Figma access token not provided"**
   - Check environment variable is set correctly
   - Verify token is valid

2. **CORS errors:**
   - Server includes CORS headers
   - Check if client is using correct URL

3. **Server not responding:**
   - Check health endpoint: `/health`
   - Review platform logs

4. **Build failures:**
   - Ensure all dependencies in package.json
   - Check Node.js version compatibility

---

Your Figma MCP server is now ready for remote deployment! 🚀 