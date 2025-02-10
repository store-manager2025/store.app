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

// 응답 인터셉터: 401 에러 발생 시 자동 로그아웃 처리
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 토큰이 만료되었거나 잘못된 경우
      console.warn("401 Unauthorized 발생 - 자동 로그아웃 처리");
      // 로컬 스토리지에서 토큰 삭제
      localStorage.removeItem("accessToken");
      // 필요에 따라 다른 사용자 정보들도 삭제
      // 예: localStorage.removeItem("userInfo");

      // 로그인 페이지 또는 루트 페이지로 리다이렉트
      // Next.js의 경우 window.location.href를 사용하거나,
      // 전역 상태 관리 라이브러리, 혹은 useRouter 훅을 사용해서 이동가능
      window.location.href = "/"; // 로그인 페이지 경로에 맞게 수정
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
