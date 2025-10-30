import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "x-user-sub": "dev-user-sub" // replace with Supabase JWT-derived sub in prod
  }
});

export default api;
