# Running BeehaviorAI on Localhost

Quick reference guide with terminal commands to run the application locally on your laptop.

## Prerequisites

Make sure you have installed:
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** database (local or remote)

## Step-by-Step Terminal Commands

### 1. Navigate to Project Directory
```bash
cd "/Users/raymond/HITPAY GITHUB REPO/BeehaviorAI"
```

### 2. Create Environment Variables File
```bash
# Create .env file in the root directory
touch .env
```

Edit the `.env` file with your editor:
```bash
nano .env
# or
code .env
# or
open -a TextEdit .env
```

Add the following content:
```bash
# Database connection (REQUIRED)
DATABASE_URL=postgresql://username:password@localhost:5432/behaviorhub

# Session security (REQUIRED - generate with command below)
SESSION_SECRET=your-random-secret-string-here

# OpenAI API key (REQUIRED for AI features)
OPENAI_API_KEY=your-openai-api-key-here

# Port configuration (use 5001 to avoid macOS AirPlay conflict)
PORT=5001

# Node environment
NODE_ENV=development

# OIDC Authentication (not needed for local dev - auto-bypassed)
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-oidc-client-id
```

### 3. Generate Session Secret
```bash
openssl rand -base64 32
```
Copy the output and paste it as your `SESSION_SECRET` value in the `.env` file.

### 4. Install Dependencies
```bash
npm install
```

If you encounter npm cache permission issues, use:
```bash
npm install --cache ./.npm-cache
```

### 5. Set Up Database Schema
```bash
npm run db:push
```

This creates all necessary database tables:
- users
- organizations
- organization_users
- students
- behavior_logs
- meeting_notes
- follow_ups
- sessions

### 6. Start Development Server
```bash
npm run dev
```

The server will start and show:
```
Running in local development mode - OIDC authentication bypassed
Created local development user
[time] [express] serving on port 5001
```

### 7. Access the Application
Open your browser and navigate to:
```
http://localhost:5001
```

You'll be automatically logged in as "Local Developer" user.

## Useful Commands

### Check if Server is Running
```bash
curl http://localhost:5001
# Should return HTTP 200
```

### Check What's Using a Port
```bash
lsof -iTCP -sTCP:LISTEN -n -P | grep 5001
```

### Stop the Server
```bash
# Find the process
ps aux | grep "tsx server/index.ts"

# Kill it
pkill -f "tsx server/index.ts"
```

### View Server Logs
If running in background:
```bash
tail -f /tmp/server.log
```

### Type Checking
```bash
npm run check
```

### Build for Production
```bash
npm run build
npm start
```

## Common Issues & Solutions

### Port 5000 Already in Use (macOS)
macOS uses port 5000 for AirPlay Receiver. Solution:
```bash
# Use port 5001 instead (already configured in .env)
# Just run: npm run dev
```

### Database Connection Error
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test PostgreSQL connection
psql $DATABASE_URL
```

### Module Not Found Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### npm Cache Permission Issues
```bash
# Clear cache or use alternative location
npm install --cache ./.npm-cache
```

## Environment Variables Quick Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ Yes | Random secret for session encryption |
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for AI features |
| `PORT` | ❌ No | Server port (default: 5000, use 5001 for macOS) |
| `NODE_ENV` | ❌ No | Set to "development" |
| `ISSUER_URL` | ❌ No | Not needed for local dev (bypassed) |
| `REPL_ID` | ❌ No | Not needed for local dev (bypassed) |

## Quick Start Script

Save this as a shell script (`start-local.sh`):
```bash
#!/bin/bash
cd "/Users/raymond/HITPAY GITHUB REPO/BeehaviorAI"

echo "Checking .env file..."
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please create it first."
    exit 1
fi

echo "Installing dependencies..."
npm install

echo "Pushing database schema..."
npm run db:push

echo "Starting development server..."
npm run dev
```

Make it executable and run:
```bash
chmod +x start-local.sh
./start-local.sh
```

## Development Workflow

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Make code changes** - Hot reload will update automatically

3. **Check the browser:**
   - Open `http://localhost:5001`
   - You're automatically logged in as "Local Developer"

4. **Stop the server:**
   - Press `Ctrl+C` in the terminal, or
   - Find and kill the process: `pkill -f "tsx server/index.ts"`

## Notes

- ✅ **Authentication is bypassed** in local development - you're auto-logged in
- ✅ **All data saves to your database** - real database operations work
- ✅ **Port 5001** is used to avoid macOS AirPlay conflict
- ✅ **Hot reload** works - changes reflect immediately
- ✅ **No Replit OIDC needed** - local dev mode handles authentication

## Troubleshooting Commands

### Check Node Version
```bash
node --version
# Should be v18 or higher
```

### Check npm Version
```bash
npm --version
```

### Verify Database Connection
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### View Application Logs
```bash
# If running in foreground, logs appear in terminal
# If running in background:
tail -50 /tmp/server.log
```

### Reset Everything
```bash
# Stop server
pkill -f "tsx server/index.ts"

# Clean install
rm -rf node_modules .npm-cache
npm install

# Restart
npm run dev
```

---

**Ready to code!** The app is running at `http://localhost:5001` 🚀
