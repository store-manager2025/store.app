"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../lib/axiosInstance";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 로그인 페이지 접근 시 토큰이 있으면 홈(`/home`)으로 이동
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.push("/home");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/auth/login", {
        username: email,
        password: password,
      });
      // 백엔드 응답 예시: { message, name, accessToken, refreshToken }
      const { accessToken, refreshToken } = response.data;
      if (accessToken && refreshToken) {
        // accessToken과 refreshToken을 모두 저장
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        if (autoLogin) {
          localStorage.setItem("autoLogin", "true");
        } else {
          localStorage.removeItem("autoLogin");
        }
      }
      router.push("/home");
    } catch (error: any) {
      console.error("Login failed: ", error);
      setErrorMsg("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <form onSubmit={handleSubmit} className="bg-white backdrop-blur-lg p-6 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-8 text-center">NONAMEYET</h2>
        {errorMsg && <p className="text-red-500 text-sm mb-2">{errorMsg}</p>}
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            className="w-full border border-gray-300 p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {/* 자동 로그인 체크박스 */}
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="autoLogin"
            checked={autoLogin}
            onChange={(e) => setAutoLogin(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="autoLogin" className="text-sm">
            자동 로그인
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-400 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
