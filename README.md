# Fauxigent MERN Template

This is a template project for a **MERN stack** application with **Vite** for the frontend and **Express** for the backend. The template comes pre-configured with:

- TailwindCSS for styling
- MongoDB connection
- Environment variables configuration for both development and production environments
- Proxying API requests from the frontend to the backend

## Project Structure

```bash
.
├── client/                # Frontend application (React with Vite)
├── node_modules/          # Node.js modules
├── package.json           # Project dependencies and scripts
├── package-lock.json      # Exact version of installed dependencies
└── server.js              # Backend Express server
```

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- Node.js (>=16.x)
- npm (>=7.x)
- MongoDB (if running locally)

### 1. Install Dependencies

Run the following command to install dependencies for both the backend and frontend.

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env` files for both the frontend and backend.

#### Frontend (`client/.env`)

```env
VITE_APP_BACKEND_URL_DEV=http://localhost:5000
VITE_APP_BACKEND_URL_PROD=https://your-production-domain.com
VITE_APP_ENV=development
VITE_APP_DOMAIN=your-domain.com
```

#### Backend (`.env`)

```env
MONGO_URI=mongodb://localhost:27017/your-database
PORT=5000
```

### 4. Run the Development Servers

To run both the backend (Express) and frontend (Vite) in parallel, you can use the following npm scripts:

- To start the **backend** server:

  ```bash
  npm run server
  ```

- To start the **frontend** (Vite) development server:

  ```bash
  npm run client
  ```

- To run both the frontend and backend together:

  ```bash
  npm run dev
  ```

### 5. Access the Application

Once both servers are running, you can access:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000/api/hello` (or other API routes)

## Scripts

- **`npm run dev`**: Runs both the frontend and backend servers concurrently using `concurrently`.
- **`npm run client`**: Starts the Vite frontend server.
- **`npm run server`**: Starts the Express backend server.
- **`npm run build`**: Builds the frontend production assets.

## Proxying API Requests

The Vite development server is configured to proxy API requests to the backend (on port `5000` by default) using the following configuration:

```js
server: {
  proxy: {
    "/api": "http://localhost:1234", // Proxy API requests to backend
    // adjust accordingly
  }
}
```

## Backend Configuration

The backend is built using Express and connected to MongoDB. It includes:

- A basic `server.js` file that sets up Express and middleware.
- An API route at `/api/hello` that returns a simple message for testing purposes.

### Example API Route (in `server.js`)

```javascript
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});
```

## Deployment

For production deployment, you will need to:

1. Update the `outDir` in the Vite config to your desired output directory for building the frontend assets.
