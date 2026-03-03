import axios from "axios";

const BASE_URL = "http://localhost:5000/api"; // update if needed

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// api.defaults.headers.common["Content-Type"] = "application/json";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, newToken = null) => {
  failedQueue.forEach(promise => {
    if (error) return promise.reject(error);
    promise.resolve(newToken);
  });
  failedQueue = [];
};

// Add access token to every request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error)
);

// Handle refresh logic
api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers["Authorization"] = "Bearer " + token;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse?.data?.data?.accessToken;
        if (!newAccessToken) throw new Error("Refresh failed");

        // Save new token
        localStorage.setItem("token", newAccessToken);
        api.defaults.headers.common["Authorization"] = "Bearer " + newAccessToken;

        // Process queued calls
        processQueue(null, newAccessToken);

        // Retry original request
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh failed — logout
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
