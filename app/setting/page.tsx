"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Settings,
  ChevronLeft,
  SquareChartGantt,
  Archive,
  PanelRightClose,
  ArrowRightLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../lib/axiosInstance";
import { useFormStore } from "@/store/formStore";

export default function SettingPage() {
  const router = useRouter();
  const { storeId, setStoreId } = useFormStore(); 

  // 메인 UI (Heading + 6개 버튼) 표시 여부
  const [showMainUI, setShowMainUI] = useState(true);
  // 메인 UI 페이드아웃 트리거
  const [fadeOutMainUI, setFadeOutMainUI] = useState(false);

  // Edit UI (Edit Items / Edit Categories 버튼) 표시 여부
  const [showEditUI, setShowEditUI] = useState(false);
  // Edit UI 페이드아웃 트리거
  const [fadeOutEditUI, setFadeOutEditUI] = useState(false);
  // 영업 마감 상태
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      const currentStoreId = localStorage.getItem("currentStoreId");

      if (!token || !currentStoreId) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        router.push("/");
      } else {
        // 문자로 저장되어 있으므로 number 변환
        setStoreId(Number(currentStoreId));
      }
    }
  }, [router, setStoreId]);

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleCloseBusiness = async () => {
    if (!storeId) return;
    try {
      await axiosInstance.post(`/api/times/close/${storeId}`);
      console.log("Store closed successfully");
      setShowCloseModal(false);
      router.push("/home");
    } catch (error) {
      console.error("Error closing store:", error);
    }
  };

  /**
   * Items 버튼 클릭 => 메인 UI를 페이드아웃 -> 제거 -> Edit UI를 페이드인
   */
  const handleItemsClick = () => {
    // 1) 메인 UI 페이드아웃 시작
    setFadeOutMainUI(true);

    // 2) 애니메이션(0.4s) 후 메인 UI 제거 + Edit UI 표시
    setTimeout(() => {
      setShowMainUI(false);
      setFadeOutMainUI(false); // 초기화
      setShowEditUI(true);
    }, 400);
  };

  const handleOrdersClick = () => {
    router.push("setting/orders");
  }

  /**
   * 뒤로가기(상단 화살표) 클릭 시 동작
   * - 메인 UI가 숨겨져 있으면 => Edit UI를 페이드아웃 -> 제거 -> 메인 UI 페이드인
   * - 메인 UI가 보이는 상태라면 => /pos 로 페이지 이동
   */
  const handleBackClick = () => {
    if (showEditUI) {
      // 1) Edit UI 페이드아웃 시작
      setFadeOutEditUI(true);

      // 2) 0.4s 후 Edit UI 제거 + 메인 UI 표시
      setTimeout(() => {
        setShowEditUI(false);
        setFadeOutEditUI(false);
        setShowMainUI(true);
      }, 400);
    } else {
      // 메인 UI가 보이는 상태 => POS로 이동
      router.push("/pos");
    }
  };

  const handleEditItems = () => {
    if (storeId) {
      router.push(`/editmenu?storeId=${storeId}`);
    } else {
      alert("Store ID가 존재하지 않습니다.");
    }
  };

  const handleEditCategories = () => {
    if (storeId) {
      router.push(`/editcategory?storeId=${storeId}`);
    } else {
      alert("Store ID가 존재하지 않습니다.");
    }
  };

  return (
    <div className="flex items-center font-mono justify-center h-screen w-screen relative">
      <div className="relative w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl p-6 flex flex-col justify-center items-center">
        
        {/* 왼쪽 상단으로 돌아가기(또는 메인으로 복귀) 버튼 */}
        <button
          onClick={handleBackClick}
          className="absolute top-0 left-0 bg-transparent px-2 py-2 text-gray-500 text-sm rounded hover:text-gray-400"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {/* 메인 UI (Heading + 6개 버튼) */}
        {showMainUI && (
          <div
            className={`flex flex-col items-center justify-start ${
              fadeOutMainUI ? "fade-out fade-out-active" : ""
            }`}
          >
            {/* Heading */}
            <h1 className="text-[40px] font-sans font-bold text-gray-700 mb-[120px]">
              Customize POS Settings
            </h1>

            {/* 6개 버튼 */}
            <div className="grid grid-cols-3 gap-8 w-full relative">
              <button
              onClick={handleOrdersClick}
                className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                <ShoppingBag className="w-6 h-6 mr-2 ml-10" />
                Orders
              </button>
              <button
                className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                <SquareChartGantt className="w-6 h-6 mr-2 ml-10" />
                Management
              </button>
              <button
                className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                <ArrowRightLeft className="w-6 h-6 mr-2 ml-10" />
                Transfer
              </button>

              {/* Items 버튼 */}
              <button
                onClick={handleItemsClick}
                className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                <Archive className="w-6 h-6 mr-2 ml-10" />
                Items
              </button>

              <button
                className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                <Settings className="w-6 h-6 mr-2 ml-10" />
                Settings
              </button>
              <button
                onClick={handleCloseClick}
                className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                <PanelRightClose className="w-6 h-6 mr-2 ml-10" />
                Close
              </button>
            </div>
          </div>
        )}

        {/* Edit Items & Edit Categories 버튼 */}
        {showEditUI && (
          <div
            className={`fade-in ${fadeOutEditUI ? "fade-out fade-out-active" : "fade-in-active"}`}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="flex flex-row gap-4">
              <button
                onClick={handleEditItems}
                className="w-52 h-14 font-bold bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                Edit Items
              </button>
              <button
                onClick={handleEditCategories}
                className="w-52 h-14 font-bold bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                Edit Categories
              </button>
            </div>
          </div>
        )}

        {/* Close Business Confirmation Modal */}
        <AnimatePresence>
          {showCloseModal && (
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
                  <span className="text-md mb-4">영업을 마감하시겠습니까?</span>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleCloseBusiness}
                      className="px-7 border border-gray-400 rounded hover:bg-gray-400 transition"
                    >
                      예
                    </button>
                    <button
                      onClick={() => setShowCloseModal(false)}
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
    </div>
  );
}
