"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { usePosStore } from "@/store/usePosStore";
import { motion, AnimatePresence } from "framer-motion";

// 타입 정의
interface Item {
  price: number;
  quantity: number;
}

interface MockPGResult {
  success: boolean;
}

// 모의 PG API 함수
const mockPGApi = (): Promise<MockPGResult> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 1000);
  });
};

/** 결제 페이지 */
export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedItems = JSON.parse(searchParams.get("selectedItems") || "[]");
  const { resetData } = usePosStore();

  // 상태 관리
  const [totalAmount, setTotalAmount] = useState(0);
  const [prevTotalAmount, setPrevTotalAmount] = useState(totalAmount);
  const [charge, setCharge] = useState(0);
  const [splitAmount, setSplitAmount] = useState(0);
  const [isSplitVisible, setIsSplitVisible] = useState(false);
  const [isOtherClicked, setIsOtherClicked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 초기 총액 계산
  const initialTotal = selectedItems.reduce(
    (acc: number, item: Item) => acc + item.price * item.quantity,
    0
  );

  // 총액 초기화 및 실시간 업데이트
  useEffect(() => {
    setTotalAmount(initialTotal);
  }, [initialTotal]);

  // totalAmount가 변경될 때 이전 값을 저장
  useEffect(() => {
    setPrevTotalAmount(totalAmount);
  }, [totalAmount]);

  useEffect(() => {
    setTotalAmount(Math.max(0, initialTotal - charge - splitAmount));
  }, [charge, splitAmount, initialTotal]);

  // Cash 버튼 클릭 시 금액 증가
  const handleCashButtonClick = (amount: number) => {
    setCharge((prev) => prev + amount);
  };

  // "Others" 버튼 클릭 시 수동 입력 활성화
  const handleOtherClick = () => {
    setIsOtherClicked(true);
  };

  // Charge 수동 입력 처리
  const handleChargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setCharge(value);
  };

  // Charge 초기화
  const handleChargeReset = () => {
    setCharge(0);
    setIsOtherClicked(false); // 수동 입력 모드도 비활성화 (선택 사항)
  };

  // Split 버튼 토글
  const handleSplitToggle = () => {
    setIsSplitVisible((prev) => !prev);
    if (!isSplitVisible) setSplitAmount(0);
  };

  // Split 입력 처리
  const handleSplitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 빈 문자열이면 0 대신 빈 상태를 유지하거나 null로 설정 가능
    setSplitAmount(value === "" ? 0 : parseInt(value, 10) || 0);
  };

  // 신용카드 결제 모의 처리
  const handleCreditCardClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    setShowConfirmModal(false);
    const result: MockPGResult = await mockPGApi();
    if (result.success) {
      setTotalAmount(0);
      setCharge(0);
      setSplitAmount(0);
    }
  };

  // Done 버튼 클릭 시 결제 완료
  const handleDoneClick = async () => {
    if (totalAmount <= 0) {
      try {
        const paymentData = {
          orderId: 19,
          placeId: 20,
          totalAmount: initialTotal,
          discountAmount: 0,
          payList: [
            {
              paidMoney: charge + splitAmount,
              paymentType: charge > 0 ? "CASH" : "CARD",
            },
          ],
        };
        await axiosInstance.post("/api/pay", paymentData);
        resetData();
        router.push("/payment-completed");
      } catch (error) {
        console.error("결제 오류:", error);
      }
    }
  };

  // 취소 버튼
  const handleCancel = () => {
    router.push("/pos");
  };

  // 거스름돈 계산
  const changes = Math.max(0, charge + splitAmount - initialTotal);

  return (
    <div className="flex w-full h-screen font-mono">
      {/* 취소 버튼 */}
      <button
        onClick={handleCancel}
        className="absolute top-4 left-4 p-2 text-red-500 text-sm"
      >
        Cancel
      </button>
      {/* 왼쪽: 결제 금액 */}
      <div className="flex-1 flex items-center justify-center text-6xl font-bold text-gray-800">
        ₩{" "}
        <AnimatePresence mode="popLayout">
          {totalAmount.toLocaleString().split("").map((char, index) => {
            const isNumber = !isNaN(parseInt(char, 10));
            return (
              <motion.span
                key={`${index}-${char}`}
                initial={{ y: totalAmount > prevTotalAmount ? -20 : 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: totalAmount > prevTotalAmount ? 20 : -20, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{ display: "inline-block", width: isNumber ? "1ch" : "auto" }}
              >
                {char}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-around items-center relative">
        {/* Cash 섹션 */}
        <div className="w-3/4 flex flex-col items-center">
          <h3 className="text-gray-600 text-center font-bold mb-10">Cash</h3>
          <div className="flex space-x-2 mb-4 w-full">
            <div className="relative flex w-1/2">
              <input
                type="number"
                value={charge}
                onChange={handleChargeChange}
                placeholder="₩ 0"
                className="py-2 px-4 border border-gray-300 rounded-md w-full bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                readOnly={!isOtherClicked}
              />
              <button
                onClick={handleChargeReset}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
              >
                Reset
              </button>
            </div>
            <span className="py-2 px-4 text-xs border border-gray-300 rounded-md w-1/2 bg-white flex items-center justify-start">
              changes ₩ {changes.toLocaleString()}
            </span>
          </div>
          <div className="w-full flex flex-col items-center">
            {/* 첫 줄: 1000, 5000, 10000 */}
            <div className="flex justify-center gap-2 mb-2 w-full">
              {[1000, 5000, 10000].map((value) => (
                <button
                  key={value}
                  onClick={() => handleCashButtonClick(value)}
                  className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300 border border-gray-300 text-center w-1/3"
                >
                  ₩ {value.toLocaleString()}
                </button>
              ))}
            </div>
            {/* 두 번째 줄: 50000, others */}
            <div className="flex justify-center gap-2 w-full">
              <button
                onClick={() => handleCashButtonClick(50000)}
                className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300 border border-gray-300 text-center w-1/3"
              >
                ₩ {(50000).toLocaleString()}
              </button>
              <button
                onClick={handleOtherClick}
                className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300 border border-gray-300 text-blue-500 text-center w-1/3"
              >
                others
              </button>
            </div>
          </div>
        </div>

        {/* 기타 결제 방법 및 Done 버튼 */}
        <div className="w-3/4 mt-4 flex flex-col items-center">
          <h3 className="text-gray-600 font-bold text-center mb-10">
            Other payment methods
          </h3>
          <div className="flex space-x-2 mb-4 w-full justify-center">
            <button
              onClick={handleCreditCardClick}
              className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300 border border-gray-300 flex-1"
            >
              Credit card
            </button>
            <button
              onClick={handleSplitToggle}
              className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300 border border-gray-300 flex-1"
            >
              Split
            </button>
          </div>
          <div className="flex space-x-2 items-center w-full justify-center">
            {isSplitVisible && (
              <div className="w-1/2">
                <input
                  type="number"
                  value={splitAmount === 0 ? "" : splitAmount}
                  onChange={handleSplitChange}
                  placeholder="금액 입력"
                  className="py-2 px-4 border border-gray-300 rounded-md w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            )}
            <motion.button
              onClick={handleDoneClick}
              layout
              animate={{
                x: 0,
                width: "49%",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`py-2 rounded-md border border-gray-300 ${
                totalAmount <= 0
                  ? "bg-[#007aff] text-white font-bold"
                  : "bg-gray-200 text-gray-700 cursor-not-allowed"
              } flex items-center justify-center`}
              disabled={totalAmount > 0}
            >
              <span className="text-base font-medium">Done</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
