import axios from "axios";
import { getFastApiBaseUrl } from "./apiConfig";

const fastapi = axios.create({
  baseURL: getFastApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default fastapi;
