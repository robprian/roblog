# Base image dengan Ghost
FROM ghost:5-alpine as ghost

# Node.js image untuk aplikasi utama
FROM node:18-alpine

# Install OpenSSH
RUN apk add --no-cache openssh

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

# Konfigurasi SSH dan user ghazi
RUN mkdir -p /root/.ssh && \
    chmod 700 /root/.ssh && \
    mkdir /var/run/sshd && \
    chmod 755 /var/run/sshd && \
    mkdir -p /robprian && \
    chmod 777 /robprian

# Setup .bash_profile dan .bashrc untuk ghazi
RUN echo '# Load .bashrc jika ada\nif [ -f ~/.bashrc ]; then\n    source ~/.bashrc\nfi\n\n# Alias contoh\nalias ll="ls -lah"' > /robprian/.bash_profile && \
    echo 'export PS1="\[\e[32m\][robby] \[\e[36m\]\u@\h:\w\$ \[\e[m\]"' > /robprian/.bashrc

COPY sshd_config /etc/ssh/sshd_config
RUN chmod 600 /etc/ssh/sshd_config

# Generate dan setup SSH keys
RUN ssh-keygen -A && \
    cp /etc/ssh/ssh_host_* /robprian/ && \
    rm -f /etc/ssh/ssh_host_* && \
    ln -sf /robprian/* /etc/ssh/

# Set permission untuk users
RUN adduser -D robby && \
    chown -R robby:robby /robprian && \
    adduser -D ghazi && \
    chown -R ghazi:ghazi /robprian

# Expose ports (Ghost = 2368, App = 8080, SSH = 2222)
EXPOSE 2368
EXPOSE 8080
EXPOSE 2222

# Start Ghost, aplikasi utama, dan SSH server
CMD ["/bin/sh", "-c", "cd /robprian/ghost && ghost start & /usr/sbin/sshd -D -o \"ListenAddress 0.0.0.0:2222\" -e & npm start"]