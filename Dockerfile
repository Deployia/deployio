FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install wait-port --no-save

COPY . .

EXPOSE 3000

CMD ["npx", "wait-port", "mongodb:27017", "--strict", "--timeout", "30000", "--", "npm", "start"]