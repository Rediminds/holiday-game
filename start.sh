#!/bin/sh

# Start Socket.io server in background
node server.js &

# Start Next.js server
node server.js
