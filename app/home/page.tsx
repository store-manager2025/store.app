"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../../components/Modal";
import AlertModal from "@/components/AlertModal";
import useAlertModal from "@/hooks/useAlertModal";
import axios from "axios";

interface Store {
  storeId: string;
  storeName: string;
}

interface OperatingTime {
  storeId: number;
  closedAt: string | null;
}

export default function HomePage() {
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showStartModal, setShowStartModal] = useState(false);

  // useAlertModal 훅 사용
  const { alertState, showAlert, closeAlert } = useAlertModal();

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken && refreshToken) {
        try {
          const response = await axios.post("http://localhost:8383/auth/refresh", {
            refreshToken,
          });
          localStorage.setItem("accessToken", response.data.accessToken);
          localStorage.setItem("refreshToken", response.data.refreshToken);
          refetchStores();
        } catch (error) {
          console.error("Token refresh failed:", error);
          handleLogout();
        }
      } else if (!accessToken && !refreshToken) {
        showAlert("세션이 만료되었습니다. 다시 로그인해주세요.", "warning");
        handleLogout();
      }
    };
    checkAndRefreshToken();
  }, []);

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
      localStorage.clear();
      // 쿠키 삭제
      document.cookie =
        "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/");
    }
  };

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

  const handleStoreButtonClick = (store: Store) => {
    setEnteredPassword("");
    setLoginError("");
    setSelectedStore(store);
    setShowStoreModal(true);
  };

  const handleNumberClick = (num: string) => {
    if (loginError) {
      setLoginError("");
      setEnteredPassword("");
    }

    if (enteredPassword.length < 4) {
      setEnteredPassword((prev) => prev + num);
    }
  };

  const handleClearClick = () => {
    setEnteredPassword("");
    setLoginError("");
  };

  const handleCloseAlreadyOpenModal = () => {
    closeAlert();
    router.push("/pos"); // /pos로 이동
  };

  const handleConfirmClick = async () => {
    if (!enteredPassword || !selectedStore) return;

    try {
      const response = await axiosInstance.post("/api/stores/login", {
        storeId: selectedStore.storeId,
        password: enteredPassword,
      });
      console.log("Login response:", response.data);

      const { storeId } = response.data;
      if (!storeId) {
        throw new Error("스토어 정보가 응답에 포함되지 않았습니다.");
      }

      localStorage.setItem("currentStoreId", storeId.toString());

      console.log("Store ID saved:", {
        storeId: localStorage.getItem("currentStoreId"),
        accessToken: localStorage.getItem("accessToken"),
        refreshToken: localStorage.getItem("refreshToken"),
      });

      // 운영 시간 데이터 가져오기
      const operatingTimesResponse = await axiosInstance.get(
        "http://localhost:8383/api/times/all-info"
      );
      const operatingTimes = operatingTimesResponse.data;

      console.log("Operating Times:", operatingTimes); // 디버깅 로그

      // 운영 시간 확인 - 단순화된 로직으로 변경
      const isStoreAlreadyOpen = operatingTimes.some((time: OperatingTime) => {
        return (
          time.storeId.toString() === storeId.toString() &&
          time.closedAt === null
        );
      });

      console.log("Is Store Already Open:", isStoreAlreadyOpen); // 디버깅 로그

      setShowStoreModal(false);
      if (isStoreAlreadyOpen) {
        // AlertModal 사용
        showAlert("이미 오픈 되어있는 매장이 있습니다.", "warning", false);

        // 2초 후 자동으로 POS 페이지로 이동
        setTimeout(() => {
          closeAlert();
          router.push("/pos");
        }, 3000);
      } else {
        setShowStartModal(true); // 오픈되지 않은 경우 시작 모달 표시
      }
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
      showAlert("매장 오픈 중 오류가 발생했습니다.", "error");
    }
  };

  const currentTime = new Date().toLocaleTimeString();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 relative">
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

      <button
        onClick={() => setShowModal(true)}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 border-none text-[#777] text-xs px-4 py-2 rounded hover:bg-gray-200/20 hover:text-gray-800 hover:backdrop-blur-3xl transition"
      >
        Logout
      </button>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-[#555]">
          <h1 className="text-md">로그아웃 하시겠습니까?</h1>
          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleLogout}
              className="px-8 bg-blue-500 text-white rounded hover:bg-blue-400 transition"
            >
              예
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 border border-gray-400 rounded hover:bg-gray-400 transition"
            >
              아니오
            </button>
          </div>
        </div>
      </Modal>

      <AnimatePresence>
        {showStoreModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onClick={() => setShowStoreModal(false)}
          >
            <motion.div
              className="relative w-[320px] h-[400px] rounded-xl shadow-lg border border-white/30 bg-white p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              onClick={(e) => e.stopPropagation()}
            >
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
                      className="flex items-center justify-center h-12 bg-[#f5f5f5] rounded hover:bg-gray-200 transition"
                    >
                      {key}
                    </button>
                  );
                })}
              </div>

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

      <Modal isOpen={showStartModal} onClose={() => setShowStartModal(false)}>
        <div className="flex flex-col items-center justify-center h-full text-gray-800">
          <span className="text-lg mb-2">현재 시간: {currentTime}</span>
          <span className="text-md mb-4">영업을 시작하시겠습니까?</span>
          <div className="flex pt-1 space-x-4">
            <button
              onClick={handleStartBusiness}
              className="px-9 text-white bg-blue-500 pt-1 rounded hover:bg-blue-400 transition"
            >
              예
            </button>
            <button
              onClick={() => setShowStartModal(false)}
              className="px-6 border border-gray-200 pt-1 rounded hover:bg-gray-100 transition"
            >
              아니오
            </button>
          </div>
        </div>
      </Modal>

      {/* AlertModal 사용 */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
      />
    </div>
  );
}
