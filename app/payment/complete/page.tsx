// pages/payment-completed.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function PaymentCompletedPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">Payment Completed</h1>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
