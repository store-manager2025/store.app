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
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        console.log("Attempting token refresh with:", refreshToken);
        const response = await axios.post("http://localhost:8383/auth/refresh", {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // 새 토큰 저장
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // 원래 요청 재시도
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("토큰 갱신 실패:", refreshError);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;