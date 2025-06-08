FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
# Install wget for healthcheck
RUN apk add --no-cache wget

COPY . .

EXPOSE 3000

CMD ["npm", "start"]