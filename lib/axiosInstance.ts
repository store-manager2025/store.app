import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8383", // 백엔드 서버의 URL
  withCredentials: true, // 쿠키 전송 필요시 true
});

// 요청 인터셉터 추가: 각 요청에 토큰 자동 포함
axiosInstance.interceptors.request.use(
  (config) => {
    // localStorage에서 accessToken을 가져옴
    const token = localStorage.getItem("accessToken");
    if (token) {
      // 토큰이 존재하면 Authorization 헤더에 Bearer 토큰 형식으로 추가
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
