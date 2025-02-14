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

export default function SettingPage() {
  const router = useRouter();
  const [itemsClicked, setItemsClicked] = useState(false);
  const [moveItemsButton, setMoveItemsButton] = useState(false);
  const [showEditButtons, setShowEditButtons] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      router.push("/");
    }
    const currentStoreId = localStorage.getItem("currentStoreId");
    if (!currentStoreId) {
      alert("Store ID가 존재하지 않습니다. 다시 로그인해주세요.");
      router.push("/");
    } else {
      setStoreId(currentStoreId);
    }
  }, [router]);

  const handleItemsClick = () => {
    setItemsClicked(true);
    setTimeout(() => {
      setMoveItemsButton(true);
    }, 300);
    setTimeout(() => {
      setShowEditButtons(true);
    }, 1100);
  };

  const handleEditItems = () => {
    // storeId를 이용해 /editmenu 페이지로 이동
    if (storeId) {
      router.push(`/editmenu?storeId=${storeId}`);
    } else {
      alert("Store ID가 존재하지 않습니다.");
    }
  };

  const handleEditCategories = () => {
    // storeId를 이용해 /editcategory 페이지로 이동
    if (storeId) {
      router.push(`/editcategory?storeId=${storeId}`);
    } else {
      alert("Store ID가 존재하지 않습니다.");
    }
  };

  return (
    <div className="flex items-center font-mono justify-center h-screen w-screen relative">
      <div className="relative w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl p-6 flex flex-col justify-center items-center">
        <button
          onClick={() => router.push("/pos")}
          className="absolute top-20 left-40 bg-transparent px-2 py-2 text-gray-500 text-sm rounded hover:text-gray-400"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <h1 className="text-[40px] font-sans font-bold text-gray-700 mb-[120px]">
          Customize POS Settings
        </h1>

        <div className="grid grid-cols-3 gap-8 w-full relative">
          <button
            className={`w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm ${
              itemsClicked ? "fade-out" : ""
            }`}
          >
            <ShoppingBag className="w-6 h-6 mr-2 ml-10" />
            Orders
          </button>
          <button
            className={`w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm ${
              itemsClicked ? "fade-out" : ""
            }`}
          >
            <SquareChartGantt className="w-6 h-6 mr-2 ml-10" />
            Management
          </button>
          <button
            className={`w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm ${
              itemsClicked ? "fade-out" : ""
            }`}
          >
            <ArrowRightLeft className="w-6 h-6 mr-2 ml-10" />
            Transfer
          </button>

          {/* Items 버튼 */}
          {!showEditButtons && (
            <button
              onClick={handleItemsClick}
              style={{
                position: moveItemsButton ? "absolute" : "static",
                left: moveItemsButton ? "50%" : undefined,
                top: moveItemsButton ? "200px" : undefined,
                transform: moveItemsButton ? "translateX(-50%)" : undefined,
                transition: "all 0.8s ease",
              }}
              className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
            >
              <Archive className="w-6 h-6 mr-2 ml-10" />
              Items
            </button>
          )}

          <button
            className={`w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm ${
              itemsClicked ? "fade-out" : ""
            }`}
          >
            <Settings className="w-6 h-6 mr-2 ml-10" />
            Settings
          </button>
          <button
            className={`w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm ${
              itemsClicked ? "fade-out" : ""
            }`}
          >
            <PanelRightClose className="w-6 h-6 mr-2 ml-10" />
            Close
          </button>
        </div>

        {/* Edit Items & Edit Categories 버튼 */}
        {showEditButtons && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "200px",
              transform: "translateX(-50%)",
            }}
            className="flex flex-row gap-4 fade-in"
          >
            <button
              onClick={handleEditItems}
              className="w-52 h-14 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm justify-center"
            >
              Edit Items
            </button>
            <button
              onClick={handleEditCategories}
              className="w-52 h-14 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm justify-center"
            >
              Edit Categories
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
