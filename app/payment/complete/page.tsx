"use client";
import React from "react";
import { useRouter } from "next/navigation";

/** 결제 완료 페이지 */
export default function PaymentCompletedPage() {
  const router = useRouter();

  const handleBackToPos = () => {
    router.push("/pos");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen font-mono">
      <h1 className="text-4xl font-bold text-green-600 mb-4">결제가 완료되었습니다!</h1>
      <button
        onClick={handleBackToPos}
        className="py-2 px-4 bg-[#007aff] text-white rounded-md hover:bg-blue-600"
      >
        POS 페이지로 돌아가기
      </button>
    </div>
  );
}