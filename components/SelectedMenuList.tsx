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
          !item.menuId ? "opacity-50 cursor-not-allowed" : ""
        } ${isSwiped ? "translate-x-0" : "translate-x-full"}`}
        onClick={handleDelete}
        disabled={!item.menuId}
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
          {!item.menuId && <span className="text-red-500 text-sm"> (ID 없음)</span>}
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
    setPlaceId,
    fetchUnpaidOrderByPlace,
    setSelectedItems,
  } = usePosStore();

  const totalPrice = selectedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  useEffect(() => {
    if (placeId && !orderId) {
      clearItems();
    }
  }, [placeId, orderId, clearItems]);

  const createOrder = async () => {
    if (!storeId || !placeId || selectedItems.length === 0) {
      alert("스토어, 테이블, 메뉴를 선택해주세요.");
      return null;
    }
    const validItems = selectedItems.filter((item) => item.menuId != null);
    if (validItems.length === 0) {
      alert("유효한 메뉴 항목이 없습니다.");
      return null;
    }
    const orderRequest = {
      storeId,
      placeId,
      items: validItems.map((item) => ({
        menuId: item.menuId,
        quantity: item.quantity,
      })),
    };
    try {
      await axiosInstance.post("/api/orders", orderRequest);
      await fetchUnpaidOrderByPlace(placeId);
      return usePosStore.getState().orderId;
    } catch (error) {
      console.error("주문 생성 실패:", error);
      alert("주문 생성 중 오류가 발생했습니다.");
      return null;
    }
  };

  const handleOrderClick = async () => {
    if (!storeId || !placeId || selectedItems.length === 0) {
      alert("메뉴를 선택해주세요.");
      return;
    }
    const validItems = selectedItems.filter((item) => item.menuId != null);
    if (validItems.length === 0) {
      alert("유효한 메뉴 항목이 없습니다.");
      return;
    }

    if (orderId) {
      // 서버 데이터 가져오기
      await fetchUnpaidOrderByPlace(placeId);
      const serverItems = usePosStore.getState().selectedItems;

      // 클라이언트와 서버 데이터 비교
      const clientMap = new Map(validItems.map((item) => [item.menuId, item.quantity]));
      const serverMap = new Map(serverItems.map((item) => [item.menuId, item.quantity]));

      const itemsToAdd = validItems.filter((item) => {
        const serverQty = serverMap.get(item.menuId) || 0;
        return item.quantity > serverQty;
      }).map((item) => ({
        menuId: item.menuId,
        quantity: item.quantity - (serverMap.get(item.menuId) || 0),
      }));

      const itemsToRemove = serverItems.filter((item) => {
        const clientQty = clientMap.get(item.menuId) || 0;
        return clientQty < item.quantity;
      }).map((item) => ({
        menuId: item.menuId,
        quantity: item.quantity - (clientMap.get(item.menuId) || 0),
      }));

      if (itemsToAdd.length > 0) {
        const addRequest = { storeId, placeId, items: itemsToAdd };
        try {
          await axiosInstance.post(`/api/orders/add/${orderId}`, addRequest);
          await fetchUnpaidOrderByPlace(placeId);
          alert("추가 주문이 완료되었습니다.");
        } catch (error) {
          console.error("추가 주문 실패:", error);
          alert("추가 주문에 실패했습니다.");
        }
      }

      if (itemsToRemove.length > 0) {
        const refundData = itemsToRemove;
        try {
          await axiosInstance.delete(`/api/orders/${orderId}`, {
            data: refundData,
            headers: { "Content-Type": "application/json" },
          });
          await fetchUnpaidOrderByPlace(placeId);
          alert("삭제가 반영되었습니다.");
        } catch (error) {
          console.error("삭제 요청 실패:", error);
          alert("삭제 요청이 실패했습니다. 서버 상태를 확인해주세요.");
        }
      }

      if (itemsToAdd.length === 0 && itemsToRemove.length === 0) {
        alert("변경 사항이 없습니다.");
      }
      clearItems();
    } else {
      const newOrderId = await createOrder();
      if (newOrderId) {
        setOrderId(newOrderId);
        clearItems();
        alert("주문이 완료되었습니다.");
      }
    }
  };

  const handleMenuDelete = (item: SelectedItem) => {
    if (!item.menuId) {
      alert(`삭제할 메뉴의 ID가 누락되었습니다: ${item.menuName}.`);
      return;
    }
    const updatedItems = selectedItems.map((i) => {
      if (i.menuId === item.menuId) {
        const newQuantity = i.quantity - item.quantity;
        return newQuantity <= 0 ? null : { ...i, quantity: newQuantity };
      }
      return i;
    }).filter((i) => i !== null) as SelectedItem[];
    setSelectedItems(updatedItems);
  };

  const handlePaymentClick = async () => {
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
    try {
      router.push(paymentUrl);
    } catch (error) {
      console.error("router.push 실패:", error);
      alert("페이지 이동 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <h1 className="font-mono text-gray-700 py-4 text-lg text-center border-b-2 border-gray-300">
        Selected Menu
      </h1>
      <div className="flex-1 overflow-auto">
        {selectedItems.map((item, idx) => (
          <SwipeableItem key={idx} item={item} onDelete={() => handleMenuDelete(item)} />
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