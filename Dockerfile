# Combined Dockerfile for single container deployment
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy all source
COPY . .

# Build Next.js
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built app and server
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./
COPY --from=builder /app/users.json ./
COPY --from=builder /app/gameState.json ./

# Create uploads directory
RUN mkdir -p ./public/uploads

# Expose both ports
EXPOSE 3000 3001

# Start script runs both servers
COPY <<EOF /app/start.sh
#!/bin/sh
node server.js &
npx next start -p 3000
EOF

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
