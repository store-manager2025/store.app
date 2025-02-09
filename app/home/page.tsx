"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axiosInstance";
import { motion, AnimatePresence } from "framer-motion"; // ✅ Framer Motion 추가

export default function HomePage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false); // ✅ 모달 상태 추가

  // ✅ useEffect를 사용하여 토큰 체크 및 자동 로그아웃 처리
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      handleLogout(); // 로그아웃 처리 후 로그인 페이지로 이동
    }
  }, []);

  // ✅ 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout"); // 백엔드 로그아웃 요청
    } catch (error) {
      console.error("Logout error: ", error);
    } finally {
      localStorage.removeItem("accessToken"); // 토큰 삭제
      router.push("/"); // 로그인 페이지로 이동
    }
  };

  const handleGoCreate = () => {
    router.push("/create");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 relative">
      {/* 중앙 플러스 아이콘 버튼 */}
      <button
        onClick={handleGoCreate}
        className="w-[100px] h-[100px] bg-gray-300 shadow-md text-white flex items-center justify-center rounded-[25px] hover:bg-gray-400 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* 중앙 하단 로그아웃 버튼 */}
      <button
        onClick={() => setShowModal(true)} // ✅ 클릭 시 모달 표시
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 border-none text-[#777] text-xl px-4 py-2 rounded hover:bg-gray-200/50 hover:backdrop-blur-3xl transition"
      >
        LOG OUT
      </button>

      {/* ✅ 페이드인 효과 적용된 로그아웃 모달 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-lg"
            initial={{ opacity: 0 }} // 초기 투명
            animate={{ opacity: 1 }} // 점점 나타남
            exit={{ opacity: 0 }} // 점점 사라짐
            transition={{ duration: 0.5 }} // 0.3초 애니메이션
          >
            <motion.div
              className="relative w-[340px] h-[200px] rounded-lg shadow-lg border border-white/30 bg-transparent"
              initial={{ scale: 0.9, opacity: 0 }} // 작게 시작
              animate={{ scale: 1, opacity: 1 }} // 확대 & 나타남
              exit={{ scale: 0.9, opacity: 0 }} // 축소 & 사라짐
              transition={{ duration: 0.5 }} // 부드러운 효과
            >
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-[#555]">
                <h1 className="text-md font-light">Logout</h1>
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={handleLogout}
                    className="px-7 border border-gray-400 rounded hover:bg-gray-400 transition"
                  >
                    o
                  </button>
                  <button
                    onClick={() => setShowModal(false)} // ✅ "아니오" 클릭 시 모달 닫힘
                    className="px-7 border border-gray-400 rounded hover:bg-gray-400 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
