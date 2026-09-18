FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose backend port
EXPOSE 5000

# Start command - defaults to dev (nodemon)
CMD ["npm", "run", "dev"]
