import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8383", // 백엔드 서버의 URL (필요에 따라 수정)
  withCredentials: true, // 쿠키 전송을 위해 반드시 true로 설정
});

export default axiosInstance;
