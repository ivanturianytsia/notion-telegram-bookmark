# Use a base image with Node.js installed
FROM node:16.19.0-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if present) to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the project files to the working directory
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the desired port(s) for your application
EXPOSE 3000

# Define the command to start your application
CMD [ "npm", "run", "start:prod" ]