"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ChevronLeft,
} from "lucide-react";

export default function setting() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      router.push("/setting");
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
      </div>
    </div>
  );
}
