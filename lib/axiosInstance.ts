import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8383",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    console.log("Request sent with token:", token, "URL:", config.url);
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(new Error("No refresh token"));
      }
      
      try {
        const response = await axios.post("/api/auth/refresh", { refreshToken });
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        originalRequest.headers["Authorization"] = `Bearer ${response.data.accessToken}`;
        // 재발급 후 원래 요청 재시도
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;