# Development Setup

## Quick Start

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

This will start:
- Backend server on `http://localhost:3001`
- Frontend React app on `http://localhost:3000`

The frontend will automatically connect to the local backend server.

## Individual Components

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

## How it Works

- **Local Development**: Frontend uses `http://localhost:3001` (defined in `frontend/.env.local`)
- **Production**: Frontend uses Railway URL (defined in Railway environment variables)
- **Backend**: Runs on port 3001 locally, Railway assigns port in production

## Pi Connection

Your Pi should still connect to the live Railway server even during local development:
```bash
python pi_client.py https://pi-to-go-production.up.railway.app
```

Or if you want Pi to connect to your local backend for testing:
```bash
python pi_client.py http://your-local-ip:3001
```

## Deployment

No changes needed! Push to GitHub and Railway will:
- Deploy backend to production port
- Deploy frontend with production environment variables
- Everything works the same as local development