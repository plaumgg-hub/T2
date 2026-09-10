FROM ghcr.io/puppeteer/puppeteer:latest

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    PORT=10000

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 10000

CMD ["node", "server.js"]
