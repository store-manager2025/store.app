"use client";
import React, { useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";

export default function PaymentPage() {
  const [totalAmount, setTotalAmount] = useState(22000); // 예시 금액
  const [charge, setCharge] = useState(0); // 고객이 건내는 금액
  const [splitAmount, setSplitAmount] = useState<number | string>(""); // Split 입력
  const [isSplitVisible, setIsSplitVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const router = useRouter();

  // 결제 방법 선택
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    if (method === "SPLIT") setIsSplitVisible(true);
    else setIsSplitVisible(false);
  };

  // Cash 버튼 클릭 시 동작
  const handleCashButtonClick = (amount: number) => {
    if (charge + amount <= totalAmount) {
      setCharge((prev) => prev + amount);
    }
  };

  // Split 입력 처리
  const handleSplitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSplitAmount(value);
    setTotalAmount(totalAmount - parseInt(value, 10));
  };

  // Done 버튼 클릭 시 결제 완료
  const handleDoneClick = async () => {
    if (totalAmount === 0) {
      try {
        const paymentData = {
          orderId: 19, // 예시 주문 ID
          placeId: 20, // 예시 장소 ID
          totalAmount,
          discountAmount: 0,
          payList: [
            { paidMoney: charge, paymentType: paymentMethod },
          ],
        };
        await axiosInstance.post("/api/pay", paymentData);
        setIsPaymentCompleted(true);
        router.push("/payment-completed"); // 결제 완료 페이지로 리다이렉트
      } catch (error) {
        console.error("Payment error:", error);
      }
    }
  };

  return (
    <div className="flex w-full h-full">
      {/* 왼쪽: 결제 금액 */}
      <div className="flex-1 flex items-center justify-center text-6xl font-bold text-gray-800">
        ₩ {totalAmount.toLocaleString()}
      </div>

      {/* 오른쪽: 결제 버튼들 */}
      <div className="flex-1 p-4 flex flex-col items-center justify-between">
        {/* Cash 버튼들 */}
        <div className="flex space-x-2 mb-4">
          {[5000, 10000, 50000].map((value) => (
            <button
              key={value}
              onClick={() => handleCashButtonClick(value)}
              className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              ₩ {value.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Split 버튼 */}
        <div className="mb-4">
          <button
            onClick={() => handlePaymentMethodChange("SPLIT")}
            className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Split
          </button>

          {isSplitVisible && (
            <div className="mt-2">
              <input
                type="number"
                value={splitAmount}
                onChange={handleSplitChange}
                placeholder="Enter amount"
                className="py-2 px-4 border border-gray-300 rounded-md"
              />
            </div>
          )}
        </div>

        {/* Credit Card 버튼 */}
        <button
          onClick={() => handlePaymentMethodChange("CARD")}
          className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Credit Card
        </button>

        {/* Done 버튼 */}
        <button
          onClick={handleDoneClick}
          className={`mt-4 py-2 px-4 rounded-md ${totalAmount === 0 ? "bg-blue-500 text-white font-bold" : "bg-gray-300 text-gray-700"} ${
            totalAmount === 0 ? "cursor-pointer" : "cursor-not-allowed"
          }`}
        >
          Done
        </button>
      </div>
    </div>
  );
}
