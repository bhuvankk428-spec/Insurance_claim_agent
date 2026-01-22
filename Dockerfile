# Use Node image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Build (for React / Next.js)
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "run", "preview"]

