FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package manifest and install production dependencies
COPY package.json package.json
RUN npm ci --omit=dev

# Copy source files
COPY . .

ENV NODE_ENV=production

# Default command
CMD ["npm", "start"]