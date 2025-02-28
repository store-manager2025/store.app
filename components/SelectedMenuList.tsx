"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { usePosStore, SelectedItem } from "../store/usePosStore";

interface SwipeableItemProps {
  item: SelectedItem;
  onDelete: () => void;
}

function SwipeableItem({ item, onDelete }: SwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [isSwiped, setIsSwiped] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleStart = (x: number) => {
    setStartX(x);
    setDragging(true);
  };

  const handleMove = (x: number) => {
    if (startX !== null) {
      const deltaX = x - startX;
      setTranslateX(Math.max(-80, Math.min(0, deltaX)));
    }
  };

  const handleEnd = () => {
    if (translateX < -30) {
      setIsSwiped(true);
      setTranslateX(-80);
    } else {
      setIsSwiped(false);
      setTranslateX(0);
    }
    setStartX(null);
    setDragging(false);
  };

  const handleDelete = () => {
    setIsSwiped(false);
    setTranslateX(0);
    onDelete();
  };

  return (
    <div className="relative w-full border-b overflow-hidden">
      <button
        className={`absolute top-0 right-0 h-full w-16 flex items-center justify-center bg-red-500 text-white transition-all border-l border-gray-300 border-b ${
          isSwiped ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={handleDelete}
      >
        <Trash2 className="w-5 h-5" />
      </button>
      <div
        className={`flex items-center justify-between p-5 text-lg bg-white transition-transform duration-200 ${
          dragging ? "cursor-grabbing" : "cursor-pointer"
        }`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => dragging && handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        <span>
          {item.quantity} x {item.menuName}
        </span>
        <span>₩ {(item.price * item.quantity).toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function SelectedMenuList() {
  const router = useRouter();
  const {
    storeId,
    placeId,
    selectedItems,
    removeItem,
    clearItems,
    orderId,
    setOrderId,
    setTableName,
    setPlaceId,
    fetchUnpaidOrderByPlace,
  } = usePosStore();

  const totalPrice = selectedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // 미결제 주문이 없으면 selectedItems 초기화
  useEffect(() => {
    if (placeId && !orderId) {
      clearItems();
    }
  }, [placeId, orderId, clearItems]);

  const createOrder = async () => {
    if (!storeId || !placeId || selectedItems.length === 0) {
      console.log("주문 생성 조건 부족:", { storeId, placeId, selectedItems });
      alert("스토어, 테이블, 메뉴를 선택해주세요.");
      return null;
    }

    const orderRequest = {
      storeId,
      placeId,
      items: selectedItems.map((item) => ({
        menuId: item.menuId || 0,
        quantity: item.quantity,
      })),
    };

    try {
      await axiosInstance.post("/api/orders", orderRequest);
      console.log("주문 생성 성공");
      await fetchUnpaidOrderByPlace(placeId);
      const realOrderId = usePosStore.getState().orderId;
      console.log("방금 생성된 실제 orderId:", realOrderId);
      return realOrderId;
    } catch (error) {
      console.error("주문 생성 실패:", error);
      alert("주문 생성 중 오류가 발생했습니다.");
      return null;
    }
  };

  const handleOrderClick = async () => {
    const newOrderId = await createOrder();
    if (newOrderId) {
      setOrderId(newOrderId);
      clearItems();
      setTableName("");
      setPlaceId(null);
      alert("주문이 완료되었습니다.");
    }
  };

  const handlePaymentClick = async () => {
    console.log("Pay 버튼 클릭 시작:", {
      storeId,
      placeId,
      orderId,
      selectedItems,
    });

    if (!placeId) {
      alert("테이블을 선택해주세요.");
      return;
    }

    let currentOrderId = orderId;
    let isNewOrder = 0;
    if (!currentOrderId && selectedItems.length > 0) {
      currentOrderId = await createOrder();
      if (!currentOrderId) return;
      setOrderId(currentOrderId);
      isNewOrder = 1;
    }

    if (!currentOrderId) {
      alert("결제할 주문이 없습니다.");
      return;
    }

    const searchParams = new URLSearchParams();
    searchParams.set("orderId", currentOrderId.toString());
    searchParams.set("placeId", placeId.toString());
    searchParams.set("selectedItems", JSON.stringify(selectedItems));
    searchParams.set("isNewOrder", isNewOrder.toString());

    const paymentUrl = `/payment?${searchParams.toString()}`;
    console.log("결제 페이지로 이동 시도:", paymentUrl);

    try {
      router.push(paymentUrl);
      console.log("router.push 실행 완료");
    } catch (error) {
      console.error("router.push 실패:", error);
      alert("페이지 이동 중 오류가 발생했습니다.");
    }
  };

  const handleMenuDelete = async (item: SelectedItem) => {
    if (orderId) {
      const refundData = [
        {
          menuId: item.menuId,
          quantity: item.quantity,
        },
      ];
      try {
        await axiosInstance({
          url: `/api/orders/${orderId}`,
          method: "delete",
          data: refundData,
          headers: { "Content-Type": "application/json" },
        });
        console.log(`메뉴 ${item.menuName} 삭제 완료`);
      } catch (err) {
        console.error("메뉴 삭제 실패:", err);
        return;
      }
    }
    removeItem(item.menuName);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <h1 className="font-mono text-gray-700 py-4 text-lg text-center border-b-2 border-gray-300">
        Selected Menu
      </h1>
      <div className="flex-1 overflow-auto">
        {selectedItems.map((item, idx) => (
          <SwipeableItem
            key={idx}
            item={item}
            onDelete={() => handleMenuDelete(item)}
          />
        ))}
      </div>
      <div className="mt-4 border-t-2 text-gray-700 font-bold p-4 pt-2 flex flex-col space-y-2">
        <div className="flex p-2 px-4 justify-between">
          <span>Total :</span>
          <span>₩ {totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex space-x-2 pb-4 gap-2">
          <button
            onClick={handleOrderClick}
            className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 text-white transition rounded-md text-sm"
          >
            Order
          </button>
          <button
            onClick={handlePaymentClick}
            className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 transition rounded-md text-sm"
          >
            Pay
          </button>
        </div>
      </div>
    </div>
  );
}
