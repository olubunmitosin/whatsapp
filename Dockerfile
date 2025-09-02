# Use a Node.js base image with necessary dependencies
FROM ubuntu:22.04

# Set the working directory in the container
WORKDIR /app

# Set DEBIAN_FRONTEND to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# Install snapd before other packages.
RUN apt-get update && apt-get install -y snapd

# Install dependencies
RUN apt-get update && apt-get install -y snapcraft nodejs npm libxss1 libgtk-3-0 libnotify4 libnss3 libasound2

# Verify snapcraft installation
RUN which snapcraft

# Check Network connectivity.
RUN ping -c 4 snapcraft.io
RUN curl -I https://api.snapcraft.io

# Copy package.json and package-lock.json
COPY package*.json ./

# Install node dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the snap package
RUN snapcraft