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

  const { storeId, resetData, fetchUnpaidOrderByPlace } = usePosStore();

  // 상태 관리
  const [totalAmount, setTotalAmount] = useState(0);
  const [prevTotalAmount, setPrevTotalAmount] = useState(totalAmount);
  const [charge, setCharge] = useState(0);
  const [splitAmount, setSplitAmount] = useState(0);
  const [paidByCard, setPaidByCard] = useState(0);
  const [isSplitVisible, setIsSplitVisible] = useState(false);
  const [isOtherClicked, setIsOtherClicked] = useState(false);
  // 기존 신용카드 결제 모달 (필요 시 활용)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // 새로 추가된 영수증 출력 여부 모달
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [latestPaymentId, setLatestPaymentId] = useState<number | null>(null);

  const initialTotal = selectedItems.reduce(
    (acc: number, item: Item) => acc + item.price * item.quantity,
    0
  );
  
  // totalAmount 계산 (단일 useEffect)
  useEffect(() => {
    const newTotalAmount = Math.max(0, initialTotal - charge - paidByCard);
    console.log(
      "Updating totalAmount:",
      newTotalAmount,
      "initialTotal:",
      initialTotal,
      "charge:",
      charge,
      "paidByCard:",
      paidByCard,
      "splitAmount:",
      splitAmount
    );
    setPrevTotalAmount(totalAmount);
    setTotalAmount(newTotalAmount);
  }, [initialTotal, charge, paidByCard]);

  // useEffect(() => {
  //   const newTotalAmount = Math.max(0, initialTotal - charge - paidByCard);
  //   console.log("Updating totalAmount:", newTotalAmount, "charge:", charge, "paidByCard:", paidByCard, "splitAmount:", splitAmount);
  //   setTotalAmount(newTotalAmount);
  // }, [charge, paidByCard, initialTotal]);

  // useEffect(() => {
  //   setTotalAmount(Math.max(0, initialTotal - charge - splitAmount));
  // }, [charge, splitAmount, initialTotal]);

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

  const handleConfirmPayment = async () => {
    setShowConfirmModal(false);
    const result: MockPGResult = await mockPGApi();
    if (result.success) {
      setSplitAmount(initialTotal);
      setTotalAmount(0);
    }
  };

  const handleCreditCardClick = async () => {
    if (splitAmount <= 0) {
      alert("카드 결제 금액을 입력해주세요.");
      return;
    }

    if (splitAmount > totalAmount) {
      alert("카드 결제 금액은 남은 총액을 초과할 수 없습니다.");
      return;
    }

    try {
      const paymentData = {
        storeId: storeId ?? null,
        orderId: orderId ? parseInt(orderId) : null,
        placeId: placeId ? parseInt(placeId) : null,
        discountAmount: 0,
        paidMoney: splitAmount, // splitAmount만 카드 결제로
        paymentType: "CARD",
        cardCompany: "국민",
        cardNumber: "1234-1234-1234-1234",
        expiryDate: "2027/12",
      };

      console.log("Sending credit card payment request:", JSON.stringify(paymentData, null, 2));
      const response = await axiosInstance.post("/api/pay", paymentData);
      console.log("카드 결제 성공:", response.data);

      // 카드 결제 금액 누적
      setPaidByCard((prev) => prev + splitAmount);
      setSplitAmount(0); // 카드 결제 후 splitAmount 초기화

      // totalAmount가 0이 되었을 때만 영수증 모달 표시
      const newTotalAmount = totalAmount - splitAmount;
      if (newTotalAmount === 0) {
        setShowReceiptModal(true);
      }
    } catch (error: any) {
      console.error("카드 결제 오류:", error.response?.data || error);
      alert("카드 결제 중 오류가 발생했습니다.");
    }
  };

  const handleDoneClick = async () => {
    if (charge + paidByCard >= initialTotal && initialTotal > 0) {
      try {
        if (orderId && placeId) {
          const numericPlaceId = typeof placeId === "string" ? parseInt(placeId) : placeId;
          await fetchUnpaidOrderByPlace(numericPlaceId);
          const currentOrderId = usePosStore.getState().orderId;
          if (!currentOrderId) {
            alert("이미 결제 완료된 주문입니다.");
            resetData();
            router.push("/pos");
            return;
          }
        }

        // 나머지 금액을 현금으로 결제
        const cashAmount = initialTotal - paidByCard; // 총액에서 카드 결제 금액 뺀 나머지
        if (cashAmount > 0) {
          const paymentData = {
            storeId: storeId ?? null,
            orderId: orderId ? parseInt(orderId) : null,
            placeId: placeId ? parseInt(placeId) : null,
            discountAmount: 0,
            paidMoney: cashAmount,
            paymentType: "CASH",
            cardCompany: "",
            cardNumber: "",
            expiryDate: "",
          };

          console.log("Sending cash payment request:", JSON.stringify(paymentData, null, 2));
          const response = await axiosInstance.post("/api/pay", paymentData);
          console.log("현금 결제 성공:", response.data);
        }

        setShowReceiptModal(true); // 영수증 모달 표시
      } catch (error: any) {
        console.error("현금 결제 오류:", error.response?.data || error);
        alert("현금 결제 중 오류가 발생했습니다.");
      }
    } else {
      alert(`결제 금액이 부족합니다. 총액: ${initialTotal}, 지불: ${charge + paidByCard}`);
    }
  };

  const handleReceiptYes = async () => {
    if (orderId) {
      try {
        const receiptResponse = await axiosInstance.get(`/api/receipts/${orderId}`);
        console.log("영수증 데이터:", receiptResponse.data);
        resetData();
        router.push("/pos");
      } catch (error: any) {
        console.error("영수증 가져오기 실패:", error.response?.data || error);
        alert("영수증 정보를 불러오는데 실패했습니다.");
        resetData();
        router.push("/pos");
      }
    } else {
      alert("주문 ID를 찾을 수 없습니다.");
      resetData();
      router.push("/pos");
    }
  };

  // // "아니오" 버튼 클릭: POS 상태 초기화 후 /pos로 이동
  // const handleReceiptNo = () => {
  //   resetData();
  //   router.push("/pos");
  // };

  const handleCancel = async () => {
    console.log("Cancel 버튼 클릭됨. 현재 상태:", {
      charge,
      splitAmount,
      totalAmount,
      orderId,
      isNewOrderParam,
      latestPaymentId,
    });

    let orderCancelSuccess = false;
    let refundSuccess = false;

    // 2. 신규 주문 취소
    if (isNewOrderParam === "1" && orderId) {
      try {
        const refundData = selectedItems.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
          orderPrice: item.price * item.quantity,
        }));
        console.log("주문 취소 요청:", refundData);
        // DELETE 대신 POST로 변경 (서버가 DELETE를 지원하지 않을 가능성)
        const response = await axiosInstance.delete(`/api/orders/all/${orderId}`);
        console.log("새 주문 취소 완료:", orderId);
        orderCancelSuccess = true;
      } catch (err: any) {
        console.error("주문 삭제 실패:", err.response?.data || err);
        alert("주문 취소 중 오류가 발생했습니다.");
        return;
      }
    } else {
      orderCancelSuccess = true; // 신규 주문이 아니면 성공으로 간주
    }

    // 1. 결제 취소
    if (orderCancelSuccess && latestPaymentId) {
      try {
        console.log(`Requesting refund for paymentId: ${latestPaymentId}`);
        const response = await axiosInstance.post(`/api/pay/cancel/${latestPaymentId}`);
        console.log("환불 성공:", response.data);
        refundSuccess = true;

        setCharge(0);
        setSplitAmount(0);
        setTotalAmount(initialTotal);
        setLatestPaymentId(null);
      } catch (error: any) {
        console.error("환불 실패:", error.response?.data || error);
        alert("환불 처리 중 오류가 발생했습니다.");
        return;
      }
    } else {
      refundSuccess = !latestPaymentId; // 결제가 없으면 성공으로 간주
    }

    

    if (orderCancelSuccess && refundSuccess) {
      console.log("취소 완료: 주문과 결제 모두 성공적으로 취소됨");
      resetData();
      router.push("/pos");
    } else {
      console.log("취소 실패: 주문 또는 결제 취소 중 하나 이상 실패");
    }
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
                className="py-2 px-4 border border-gray-300 rounded-md w-full bg-white"
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

        {/* Other payment methods & Done 버튼 */}
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
                  className="py-2 px-4 border border-gray-300 rounded-md w-full"
                />
              </div>
            )}
            <motion.button
              onClick={handleDoneClick}
              layout
              animate={{ x: 0, width: "49%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`py-2 rounded-md border border-gray-300 ${
                charge + paidByCard >= initialTotal
                  ? "bg-[#007aff] text-white font-bold"
                  : "bg-gray-200 text-gray-700 cursor-not-allowed"
              } flex items-center justify-center`}
              disabled={charge + paidByCard < initialTotal}
            >
              <span className="text-base font-medium">Done</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* 기존 카드 결제 확인 모달 (필요시 활용) */}
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

      {/* 영수증 출력 여부 확인 모달 */}
      {showReceiptModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md">
            <p>영수증을 출력하시겠습니까?</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleReceiptYes}
                className="py-2 px-4 bg-gray-200 rounded-md"
              >
                아니오
              </button>
              <button
                onClick={handleReceiptYes}
                className="py-2 px-4 bg-blue-500 text-white rounded-md"
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
