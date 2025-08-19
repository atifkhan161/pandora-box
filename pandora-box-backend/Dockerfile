FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Create volume for data persistence
VOLUME ["/app/data", "/app/logs"]

# Set environment variables
ENV NODE_ENV=production

# Run the application
CMD ["node", "dist/app.js"]