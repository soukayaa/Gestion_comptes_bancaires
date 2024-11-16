FROM node:18

# Installing the build tool
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Setting up the working directory
WORKDIR /usr/src/app

# Copy all package*.json files
COPY package*.json ./
COPY back/package*.json ./back/

# Install root dependencies
RUN npm install
RUN npm install express

# Installing back-end dependencies
WORKDIR /usr/src/app/back

# Clear possible node_modules
RUN rm -rf node_modules

# Installing back-end dependencies
RUN npm install
RUN npm install bcrypt@5.1.1 --build-from-source

# Copying Prisma files
COPY back/prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Return to root directory
WORKDIR /usr/src/app

# Copy all project files
COPY . .

# Modify the startup command to use the correct path
CMD ["/bin/sh", "-c", "cd /usr/src/app/back && npx prisma migrate deploy && cd /usr/src/app && NODE_PATH=/usr/src/app/node_modules node app.js"]
