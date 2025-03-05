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
  menuId?: number;
}

interface MockPGResult {
  success: boolean;
}

const mockPGApi = (): Promise<MockPGResult> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 1000);
  });
};

/** 결제 페이지 */
export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedItems: Item[] = JSON.parse(
    searchParams.get("selectedItems") || "[]"
  );
  const orderId = searchParams.get("orderId");
  const placeId = searchParams.get("placeId");
  const isNewOrderParam = searchParams.get("isNewOrder");

  // storeId 추가 (백엔드가 DB에 저장할 때 사용)
  const { storeId, resetData, fetchUnpaidOrderByPlace } = usePosStore();

  const [totalAmount, setTotalAmount] = useState(0);
  const [prevTotalAmount, setPrevTotalAmount] = useState(totalAmount);
  const [charge, setCharge] = useState(0);
  const [splitAmount, setSplitAmount] = useState(0);
  const [isSplitVisible, setIsSplitVisible] = useState(false);
  const [isOtherClicked, setIsOtherClicked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const initialTotal = selectedItems.reduce(
    (acc: number, item: Item) => acc + item.price * item.quantity,
    0
  );

  useEffect(() => {
    setTotalAmount(initialTotal);
  }, [initialTotal]);

  useEffect(() => {
    setPrevTotalAmount(totalAmount);
  }, [totalAmount]);

  useEffect(() => {
    setTotalAmount(Math.max(0, initialTotal - charge - splitAmount));
  }, [charge, splitAmount, initialTotal]);

  const handleCashButtonClick = (amount: number) => {
    setCharge((prev) => prev + amount);
  };

  const handleOtherClick = () => {
    setIsOtherClicked(true);
  };

  const handleChargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setCharge(value);
  };

  const handleChargeReset = () => {
    setCharge(0);
    setIsOtherClicked(false);
  };

  const handleSplitToggle = () => {
    setIsSplitVisible((prev) => !prev);
    if (!isSplitVisible) setSplitAmount(0);
  };

  const handleSplitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSplitAmount(value === "" ? 0 : parseInt(value, 10) || 0);
  };

  const handleCreditCardClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    setShowConfirmModal(false);
    const result: MockPGResult = await mockPGApi();
    if (result.success) {
      setSplitAmount(initialTotal);
      setTotalAmount(0);
    }
  };

  const handleDoneClick = async () => {
    if (charge + splitAmount >= initialTotal && initialTotal > 0) {
      try {
        if (orderId && placeId) {
          const numericPlaceId =
            typeof placeId === "string" ? parseInt(placeId) : placeId;
          await fetchUnpaidOrderByPlace(numericPlaceId);
          const currentOrderId = usePosStore.getState().orderId;
          if (!currentOrderId) {
            alert("이미 결제 완료된 주문입니다.");
            resetData();
            router.push("/payment-completed");
            return;
          }
        }
  
        const payList = [];
        if (charge > 0) {
          payList.push({
            paidMoney: charge,
            paymentType: "CASH",
            cardCompany: "",
            cardNumber: "",
            expiryDate: "",
          });
        }
        if (splitAmount > 0) {
          payList.push({
            paidMoney: splitAmount,
            paymentType: "CARD",
            cardCompany: "Unknown",
            cardNumber: "0000-0000-0000-0000",
            expiryDate: "2030/12",
          });
        }
  
        // paymentData에 storeId(camelCase)를 그대로 포함시킴
        const paymentData = {
          orderId: orderId ? parseInt(orderId) : null,
          placeId: placeId ? parseInt(placeId) : null,
          storeId: storeId ?? null,
          totalAmount: initialTotal,
          discountAmount: 0,
          payList,
        };
  
        console.debug(
          "Sending payment request:",
          JSON.stringify(paymentData, null, 2)
        );
  
        // 이 요청만은 키 변환을 하지 않고 보내도록 transformRequest를 재정의
        const response = await axiosInstance.post("/api/pay", paymentData, {
          transformRequest: [(data, headers) => {
            return JSON.stringify(data);
          }],
        });
  
        console.log("결제 성공:", response.data);
  
        resetData();
        router.push("/payment-completed");
      } catch (error: any) {
        const errorData = error.response?.data as {
          error?: string;
          message?: string;
        };
        const errorMessage = errorData?.message || error.message;
        console.error("결제 오류:", error.response?.data || error);
  
        if (errorData?.error === "ALREADY_PAYMENT") {
          alert(
            "결제 처리 중 오류가 발생했습니다. 주문 상태를 확인하거나 새 주문을 생성해주세요."
          );
        } else {
          alert(`결제 처리 중 오류가 발생했습니다: ${errorMessage}`);
        }
      }
    } else {
      alert(
        `결제 금액이 부족합니다. 총액: ${initialTotal}, 지불: ${
          charge + splitAmount
        }`
      );
    }
  };

  const handleCancel = async () => {
    if (isNewOrderParam === "1" && orderId) {
      try {
        const refundData = selectedItems.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
          orderPrice: item.price * item.quantity,
        }));
  
        await fetch(`/api/orders/${orderId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(refundData),
        });
        console.log("새 주문 취소 완료:", orderId);
      } catch (err) {
        console.error("주문 삭제 실패:", err);
      }
    }
    resetData();
    router.push("/pos");
  };
  
  const changes = Math.max(0, charge + splitAmount - initialTotal);

  return (
    <div className="flex w-full h-screen font-mono">
      <button
        onClick={handleCancel}
        className="absolute top-4 left-4 p-2 text-red-500 text-sm"
      >
        Cancel
      </button>
      <div className="flex-1 flex items-center justify-center text-6xl font-bold text-gray-800">
        ₩{" "}
        <AnimatePresence mode="popLayout">
          {totalAmount
            .toLocaleString()
            .split("")
            .map((char, index) => {
              const isNumber = !isNaN(parseInt(char, 10));
              return (
                <motion.span
                  key={`${index}-${char}`}
                  initial={{
                    y: totalAmount > prevTotalAmount ? -20 : 20,
                    opacity: 0,
                  }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{
                    y: totalAmount > prevTotalAmount ? 20 : -20,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  style={{
                    display: "inline-block",
                    width: isNumber ? "1ch" : "auto",
                  }}
                >
                  {char}
                </motion.span>
              );
            })}
        </AnimatePresence>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-around items-center relative">
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
            <div className="flex justify-center gap-2 w-full">
              <button
                onClick={() => handleCashButtonClick(50000)}
                className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300 border border-gray-300 text-center w-1/3"
              >
                ₩ {50000..toLocaleString()}
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

      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md">
            <p>카드 결제를 진행하시겠습니까?</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-2 px-4 bg-gray-200 rounded-md"
              >
                취소
              </button>
              <button
                onClick={handleConfirmPayment}
                className="py-2 px-4 bg-blue-500 text-white rounded-md"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
