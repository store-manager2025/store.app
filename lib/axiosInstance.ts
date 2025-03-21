import axios from "axios";

const API_BASE_URL = "http://localhost:8383"; // 백엔드 서버 주소

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
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
    
    // 401 에러 & 재시도하지 않은 경우만 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // 리프레시 토큰이 없으면 로그인 페이지로 리디렉션
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(error);
      }
      
      try {
        // 전체 URL을 사용하여 리프레시 토큰 요청
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, { 
          refreshToken 
        });
        
        if (refreshResponse.data?.accessToken) {
          localStorage.setItem("accessToken", refreshResponse.data.accessToken);
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem("refreshToken", refreshResponse.data.refreshToken);
          }
          
          // 인증 헤더 업데이트
          axios.defaults.headers.common["Authorization"] = `Bearer ${refreshResponse.data.accessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${refreshResponse.data.accessToken}`;
          
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error("토큰 갱신 실패:", refreshError);
        alert("인증이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.clear();
        window.location.href = "/";
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
