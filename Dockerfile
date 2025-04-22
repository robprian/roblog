# Base image dengan Ghost
FROM ghost:5-alpine as ghost

# Node.js image untuk aplikasi utama
FROM node:18-alpine

# Buat direktori /robprian dan set permission
RUN mkdir -p /robprian/ghost /robprian/app /robprian/data

# Copy Ghost files ke /robprian/ghost
COPY --from=ghost /var/lib/ghost /robprian/ghost

# Set working directory untuk aplikasi utama
WORKDIR /robprian/app

# Copy dan install dependencies aplikasi
COPY package*.json ./
RUN npm install

# Copy seluruh kode aplikasi
COPY . .

# Set environment variables untuk Ghost
ENV NODE_ENV=production
ENV database__client=sqlite3
ENV database__connection__filename=/robprian/data/ghost.db

# Set permission untuk user robby
RUN adduser -D robby && \
    chown -R robby:robby /robprian

# Expose ports (Ghost = 2368, App = 8080)
EXPOSE 2368
EXPOSE 8080

# Start Ghost dan aplikasi utama sebagai user robby
USER robby
CMD ["/bin/sh", "-c", "cd /robprian/ghost && ghost start & npm start"]