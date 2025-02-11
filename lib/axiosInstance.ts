import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8383", // 백엔드 서버의 URL
  withCredentials: true, // 쿠키 전송 필요시 true
});

// 요청 인터셉터: 각 요청에 accessToken 포함
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 에러 발생 시 refreshToken으로 새 토큰 발급
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          // refreshToken 요청
          const response = await axiosInstance.post("/auth/refresh", { refreshToken });
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
          // 새 토큰 저장
          localStorage.setItem("accessToken", newAccessToken);
          localStorage.setItem("refreshToken", newRefreshToken);
          // 헤더 갱신
          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          // 원래 요청 재시도
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error("토큰 갱신 실패:", refreshError);
          // refresh 실패 시 추가 처리 (예: 로그아웃 처리)
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
