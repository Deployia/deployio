FROM node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app

# install the static-server globally
RUN npm install -g serve

# copy build artifacts
COPY --from=build /app/dist ./dist

EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
