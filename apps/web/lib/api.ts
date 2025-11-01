import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// This will be set by the AuthProvider after user logs in
let currentUserSub: string | null = null;

export function setAuthUser(userSub: string | null) {
  currentUserSub = userSub;
}

// Add request interceptor to include user ID in all requests
api.interceptors.request.use(
  (config) => {
    if (currentUserSub) {
      config.headers['x-user-sub'] = currentUserSub;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
