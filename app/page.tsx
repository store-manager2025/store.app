"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../lib/axiosInstance";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/auth/login", {
        username: email,
        password: password,
      });
      // 백엔드 응답 예시: { message, name, accessToken }
      const { accessToken } = response.data;
      if (accessToken) {
        // 이후 API 호출시 사용할 토큰을 localStorage에 저장 (또는 다른 저장소 활용)
        localStorage.setItem("accessToken", accessToken);
      }
      // 로그인 성공 시 홈 화면으로 이동
      router.push("/home");
    } catch (error: any) {
      console.error("Login failed: ", error);
      setErrorMsg("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
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
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
        >
          Log In
        </button>
      </form>
    </div>
  );
}
