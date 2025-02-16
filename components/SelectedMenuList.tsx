"use client";
import React, { useState } from "react";
import { usePosStore } from "../store/usePosStore";

interface SwipeableItemProps {
  item: {
    menuName: string;
    price: number;
    quantity: number;
  };
  onDelete: () => void;
}

function SwipeableItem({ item, onDelete }: SwipeableItemProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX !== null && touchEndX !== null) {
      const deltaX = touchEndX - touchStartX;
      if (deltaX < -50) { // 왼쪽으로 50px 이상 이동 시 삭제
        onDelete();
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  return (
    <div
      className="flex justify-between items-center p-2 border-b cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <span>
        {item.quantity} x {item.menuName}
      </span>
      <span>₩ {item.price * item.quantity}</span>
    </div>
  );
}

export default function SelectedMenuList() {
  const selectedItems = usePosStore((state) => state.selectedItems);
  const removeItem = usePosStore((state) => state.removeItem);

  const totalPrice = selectedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="flex flex-col h-full w-full">
      <h1 className="font-mono text-gray-700 py-4 text-lg text-center border-b-2 border-gray-300">
        Selected Menu
      </h1>
      <div className="flex-1 space-y-2 overflow-auto">
        {selectedItems.map((item, idx) => (
          <SwipeableItem
            key={idx}
            item={item}
            onDelete={() => removeItem(item.menuName)}
          />
        ))}
      </div>
      <div className="mt-4 border-t-2 text-gray-700 font-bold p-4 pt-2 flex flex-col space-y-2">
        <div className="flex p-2 px-4 justify-between">
          <span>Total :</span>
          <span>₩ {totalPrice}</span>
        </div>
        <div className="flex space-x-2 pb-4 gap-2">
          <button
            className="flex-1 py-8 bg-gray-200 hover:bg-gray-300 transition rounded-md text-sm"
            // 결제 로직 구현 예정
          >
            CASH
          </button>
          <button
            className="flex-1 bg-gray-200 hover:bg-gray-300 transition py-2 rounded-md text-sm"
            // 결제 로직 구현 예정
          >
            CARD
          </button>
        </div>
      </div>
    </div>
  );
}
