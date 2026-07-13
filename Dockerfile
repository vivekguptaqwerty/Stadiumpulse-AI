# Stage 1: Build React Frontend Client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build Express Backend Server
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Lean Production Runtime Image
FROM node:20-alpine AS final
WORKDIR /app
ENV NODE_ENV=production

# Expose port (Cloud Run will override via environment variable PORT)
EXPOSE 3001

# Copy compiled backend files and set up production dependencies
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy compiled frontend assets parallel to the server directory
COPY --from=client-build /app/client/dist ./client/dist

# Execute the application using compiled JavaScript from the server directory
WORKDIR /app/server
CMD ["node", "dist/server.js"]
