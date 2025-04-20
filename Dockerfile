# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
# If you use yarn, uncomment the following line
# COPY yarn.lock ./

# Install app dependencies
# If you use npm:
RUN npm install
# If you use yarn:
# RUN yarn install --frozen-lockfile

# Bundle app source
COPY . .

# Make port 3002 available to the world outside this container
EXPOSE 3002

# Define environment variable
# ENV NODE_ENV=production

# Run the app when the container launches
CMD [ "node", "src/server.js" ]
