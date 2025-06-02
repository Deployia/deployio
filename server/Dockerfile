FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Make sure to replace 5000 with the actual port your server listens on if different
EXPOSE 5000

CMD ["node", "server.js"]