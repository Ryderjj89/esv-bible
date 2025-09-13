FROM node:18-alpine

WORKDIR /app

# Install git for cloning the bible repository
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Clone ESV Bible markdown repository
RUN git clone https://github.com/lguenth/mdbible.git /tmp/mdbible && \
    mkdir -p /app/bible-data && \
    cp -r /tmp/mdbible/by_chapter/* /app/bible-data/ && \
    rm -rf /tmp/mdbible

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
