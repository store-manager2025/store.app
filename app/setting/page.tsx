"use client";
import React, { useEffect } from "react";
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

export default function setting() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      router.push("/");
    }
  }, [router]);

  const handleGoBack = () => {
    router.push("/pos");
  };

  return (
    <div className="flex items-center font-mono justify-center h-screen w-screen">
      <div className="w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl p-6 flex flex-col justify-center items-center">
        <button
          onClick={handleGoBack}
          className="absolute top-20 left-40 bg-transparent px-2 py-2 text-gray-500 text-sm rounded hover:text-gray-400"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <h1
          className="text-[40px] font-sans font-bold text-transparent 
                        bg-clip-text bg-gradient-to-r from-gray-500 
                        to-gray-700 transform rotate-3d mb-[120px] 
                        tracking-wide
                        drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.2)]
                        "
        >
          Customize POS Settings
        </h1>
        <div className="grid grid-cols-3 gap-8">
          <button className="w-80 h-20 font-bold text-left flex flex-row 
                             items-center bg-transparent text-gray-700 
                             border border-gray-500 hover:text-white hover:bg-[#333] 
                             rounded-lg shadow-sm"
                             onClick={() => router.push("/setting/orders")}
                             >
            <ShoppingBag className="w-6 h-6 mr-2 ml-10" />
            Orders
          </button>
          <button className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm">
            <SquareChartGantt className="w-6 h-6 mr-2 ml-10" />
            Management
          </button>
          <button className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm">
            <ArrowRightLeft className="w-6 h-6 mr-2 ml-10" />
            Transfer
          </button>
          <button className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm">
            <Archive className="w-6 h-6 mr-2 ml-10" />
            Items
          </button>
          <button className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm">
            <Settings className="w-6 h-6 mr-2 ml-10" />
            Settings
          </button>
          <button className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm">
            <PanelRightClose className="w-6 h-6 mr-2 ml-10" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
