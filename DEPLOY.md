# Holiday Game - GCS Deployment Guide

## Docker Setup

This application is containerized with two services:
1. **Next.js Frontend** (port 3000)
2. **Socket.io Backend** (port 3001)

## Local Testing with Docker Compose

```bash
# Build and run both services
docker-compose up --build

# Access the app at http://localhost:3000
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL | `http://localhost:3001` |
| `PORT` | Socket.io server port | `3001` |

## GCS Deployment Options

### Option 1: Cloud Run (Recommended for simplicity)

1. **Build and push images:**
```bash
# Set your project ID
export PROJECT_ID=your-gcp-project-id

# Build Next.js frontend
docker build -f Dockerfile.nextjs -t gcr.io/$PROJECT_ID/holiday-game-web .
docker push gcr.io/$PROJECT_ID/holiday-game-web

# Build Socket.io backend
docker build -f Dockerfile.socket -t gcr.io/$PROJECT_ID/holiday-game-socket .
docker push gcr.io/$PROJECT_ID/holiday-game-socket
```

2. **Deploy Socket.io server first:**
```bash
gcloud run deploy holiday-game-socket \
  --image gcr.io/$PROJECT_ID/holiday-game-socket \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --session-affinity
```

3. **Get the Socket URL and deploy frontend:**
```bash
# Get the socket service URL
SOCKET_URL=$(gcloud run services describe holiday-game-socket --format='value(status.url)')

# Deploy frontend with socket URL
gcloud run deploy holiday-game-web \
  --image gcr.io/$PROJECT_ID/holiday-game-web \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NEXT_PUBLIC_SOCKET_URL=$SOCKET_URL
```

### Option 2: GKE (Kubernetes)

Use the Kubernetes manifests in `/k8s` directory (to be created).

## Important Notes

1. **WebSocket Support**: Cloud Run supports WebSockets with session affinity enabled.

2. **State Persistence**: Currently `gameState.json` is stored in the container. For production, consider:
   - Cloud Storage for file storage
   - Firestore or Cloud SQL for state persistence

3. **CORS**: Update `server.js` to restrict CORS origins in production.

## Updating Socket URL for Production

When deploying, update `NEXT_PUBLIC_SOCKET_URL` to your deployed Socket.io service URL.
