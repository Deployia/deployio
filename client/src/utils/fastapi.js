import axios from "axios";

const fastapi = axios.create({
  baseURL: import.meta.env.VITE_APP_FASTAPI_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default fastapi;
