"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";

interface Store {
  storeId: string;
  storeName: string;
}

export default function HomePage() {
  const router = useRouter();

  // 기존 로그아웃 모달 상태
  const [showModal, setShowModal] = useState(false);
  // 모든 스토어 객체 배열
  const [stores, setStores] = useState<Store[]>([]);
  // 키패드 모달에서 선택된 스토어
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  // 스토어 로그인(비밀번호 입력) 모달 상태 및 입력된 숫자 문자열
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  // 로그인 에러 메시지 상태 (비밀번호 틀렸을 때 사용)
  const [loginError, setLoginError] = useState("");
  // 영업 개시 상태
  const [showStartModal, setShowStartModal] = useState(false);

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      
      if (!accessToken && refreshToken) {
        try {
          const response = await axiosInstance.post("/api/auth/refresh", { refreshToken });
          localStorage.setItem("accessToken", response.data.accessToken);
          localStorage.setItem("refreshToken", response.data.refreshToken);
          // 토큰 재발급 후 스토어 데이터 강제 재조회
          refetchStores();
        } catch (error) {
          console.error("Token refresh failed:", error);
          handleLogout();
        }
      } else if (!accessToken && !refreshToken) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        handleLogout();
      }
    };
    checkAndRefreshToken();
  }, []);

  // 스토어 목록 조회 (API 응답이 배열로 반환된다고 가정)
  useEffect(() => {
    const fetchStores = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        try {
          const response = await axiosInstance.get("/api/stores");
          setStores(response.data);
        } catch (error) {
          console.error("Error fetching stores: ", error);
        }
      }
    };
    fetchStores();
  }, []);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.error("Logout error: ", error);
    } finally {
      // 모든 localStorage 항목 제거
      localStorage.clear();
      router.push("/");
    }
  };

  // 플러스 버튼 클릭 -> 매장 생성 페이지 이동
  const handleGoCreate = () => {
    router.push("/create");
  };

  const refetchStores = async () => {
    try {
      const response = await axiosInstance.get("/api/stores");
      setStores(response.data);
    } catch (error) {
      console.error("Error refetching stores: ", error);
    }
  };

  // 스토어 버튼 클릭 시 해당 스토어에 대해 비밀번호 입력 모달 표시
  const handleStoreButtonClick = (store: Store) => {
    setEnteredPassword("");
    setLoginError("");
    setSelectedStore(store);
    setShowStoreModal(true);
  };

  // 숫자키 입력 (키패드의 숫자 버튼)
  const handleNumberClick = (num: string) => {
    if (loginError) {
      // 에러 메시지가 있다면 지우고 새로 입력 시작
      setLoginError("");
      setEnteredPassword("");
    }

    // 입력된 비밀번호가 4자리 이상이면 추가 입력 방지
    if (enteredPassword.length < 4) {
      setEnteredPassword((prev) => prev + num);
    }
  };

  // 입력 초기화 (“지움” 버튼)
  const handleClearClick = () => {
    setEnteredPassword("");
    setLoginError("");
  };

  const handleConfirmClick = async () => {
    if (!enteredPassword || !selectedStore) return;
    try {
      const response = await axiosInstance.post("/api/stores/login", {
        storeId: selectedStore.storeId,
        password: enteredPassword,
      });
      console.log("Login response:", response.data);
  
      // 스토어 정보 처리
      const { storeId } = response.data;
      if (!storeId) {
        throw new Error("스토어 정보가 응답에 포함되지 않았습니다.");
      }
  
      // 기존 토큰 유지, 스토어 ID만 업데이트
      localStorage.setItem("currentStoreId", storeId.toString());
  
      console.log("Store ID saved:", {
        storeId: localStorage.getItem("currentStoreId"),
        accessToken: localStorage.getItem("accessToken"),
        refreshToken: localStorage.getItem("refreshToken"),
      });
  
      setShowStoreModal(false);
      setShowStartModal(true);
    } catch (error: any) {
      console.error("로그인 요청 중 오류 발생:", error);
      if (error.response?.status === 401) {
        setLoginError("비밀번호가 틀렸습니다.");
        setEnteredPassword("");
      }
    }
  };

  const handleStartBusiness = async () => {
    if (!selectedStore) return;
    try {
      await axiosInstance.post(`/api/times/open/${selectedStore.storeId}`);
      console.log("Store opened successfully");
      setShowStartModal(false);
      router.push("/pos");
    } catch (error) {
      console.error("Error opening store:", error);
    }
  };

  const currentTime = new Date().toLocaleTimeString();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 relative">
      {/* 모든 스토어와 플러스 버튼을 한 행에 3개씩 그리드로 표시 */}
      <div
        className={`grid ${
          stores.length <= 1 ? "grid-cols-1" : "grid-cols-3"
        } gap-4`}
      >
        {stores.map((store) => (
          <button
            key={store.storeId}
            onClick={() => handleStoreButtonClick(store)}
            className="w-[100px] h-[100px] bg-gray-300 shadow-md text-white flex items-center justify-center rounded-[25px] hover:bg-gray-400 transition"
          >
            <span className="text-lg font-bold">{store.storeName}</span>
          </button>
        ))}
        {/* 플러스 버튼 */}
        <button
          onClick={handleGoCreate}
          className="w-[100px] h-[100px] bg-gray-300 shadow-md text-white flex items-center justify-center rounded-[25px] hover:bg-gray-400 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
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
      </div>

      {/* 중앙 하단 로그아웃 버튼 */}
      <button
        onClick={() => setShowModal(true)}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 border-none text-[#777] text-xs px-4 py-2 rounded hover:bg-gray-200/20 hover:text-gray-800 hover:backdrop-blur-3xl transition"
      >
        Logout
      </button>

      {/* 기존 로그아웃 모달 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="relative w-[340px] h-[200px] rounded-lg shadow-lg border border-white/30 bg-transparent"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.5 }}
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
                    onClick={() => setShowModal(false)}
                    className="px-7 border border-gray-400 rounded hover:bg-gray-400 transition"
                  >
                    x
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 스토어 로그인(비밀번호 입력) 모달 */}
      <AnimatePresence>
        {showStoreModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => setShowStoreModal(false)}
          >
            <motion.div
              className="relative w-[320px] h-[400px] rounded-xl shadow-lg border border-white/30 bg-white p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 입력한 숫자 또는 에러 메시지 표시 영역 */}
              <div className="mb-4 mt-12 text-center text-gray-800 h-10 flex items-center border-b border-gray-300 justify-center">
                {loginError ? (
                  <span className="text-xs text-red-500">{loginError}</span>
                ) : (
                  <span className="text-2xl">
                    {enteredPassword
                      .split("")
                      .map((char, index) =>
                        index === enteredPassword.length - 1 ? char : "●"
                      )
                      .join("")}
                  </span>
                )}
              </div>

              {/* 4행 3열 키패드 */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                  "Del",
                  "0",
                  "✓",
                ].map((key, index) => {
                  const handleClick = () => {
                    if (key === "Del") {
                      handleClearClick();
                    } else if (key === "✓") {
                      handleConfirmClick();
                    } else {
                      handleNumberClick(key);
                    }
                  };
                  return (
                    <button
                      key={index}
                      onClick={handleClick}
                      // style={{
                      //   clipPath:
                      //     "polygon(20% 0%,80% 0%,100% 50%,80% 100%,20% 100%,0% 50%)",
                      // }}
                      className="flex items-center justify-center h-12 bg-[#f5f5f5] rounded hover:bg-gray-200 transition"
                    >
                      {key}
                    </button>
                  );
                })}
              </div>

              {/* 모달 하단 50px 푸터 */}
              <div className="h-[45px] mt-2 flex items-center justify-center mb-2">
                <button
                  onClick={() => {
                    setShowStoreModal(false);
                    setEnteredPassword("");
                    setLoginError("");
                  }}
                  className="text-gray-500 hover:text-gray-700 w-full py-2 shadow-sm"
                >
                  close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Business Confirmation Modal */}
      <AnimatePresence>
        {showStartModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="relative w-[340px] h-[200px] rounded-lg shadow-lg border border-white/30 bg-white p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col items-center justify-center h-full text-gray-800">
                <span className="text-lg mb-2">현재 시간: {currentTime}</span>
                <span className="text-md mb-4">영업을 시작하시겠습니까?</span>
                <div className="flex space-x-4">
                  <button
                    onClick={handleStartBusiness}
                    className="px-7 border border-gray-400 rounded hover:bg-gray-400 transition"
                  >
                    예
                  </button>
                  <button
                    onClick={() => setShowStartModal(false)}
                    className="px-7 border border-gray-400 rounded hover:bg-gray-400 transition"
                  >
                    아니오
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
