import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8383", // 백엔드 서버의 URL
  withCredentials: true, // 쿠키 전송 필요시 true
});

// 요청 인터셉터: 각 요청에 토큰 자동 포함
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


export default axiosInstance;
