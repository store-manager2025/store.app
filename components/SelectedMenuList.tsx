"use client";
import React, { useState } from "react";
import { usePosStore } from "../store/usePosStore";
import { Trash2 } from "lucide-react";

interface SwipeableItemProps {
  item: {
    menuName: string;
    price: number;
    quantity: number;
  };
  onDelete: () => void;
}

function SwipeableItem({ item, onDelete }: SwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [isSwiped, setIsSwiped] = useState(false);
  const [dragging, setDragging] = useState(false);

  /** 터치 & 마우스 공통 시작 이벤트 */
  const handleStart = (x: number) => {
    setStartX(x);
    setDragging(true);
  };

  /** 터치 & 마우스 공통 이동 이벤트 */
  const handleMove = (x: number) => {
    if (startX !== null) {
      const deltaX = x - startX;
      setTranslateX(Math.max(-80, Math.min(0, deltaX))); // -80px 제한
    }
  };

  /** 터치 & 마우스 공통 종료 이벤트 */
  const handleEnd = () => {
    if (translateX < -30) {
      setIsSwiped(true);
      setTranslateX(-80); // 고정
    } else {
      setIsSwiped(false);
      setTranslateX(0);
    }
    setStartX(null);
    setDragging(false);
  };

  /** 삭제 버튼 클릭 시 상태 초기화 후 삭제 실행 */
  const handleDelete = () => {
    setIsSwiped(false);
    setTranslateX(0);
    onDelete();
  };

  return (
    <div className="relative w-full border-b overflow-hidden">
      {/* 삭제 버튼 */}
      <button
        className={`absolute top-0 right-0 h-full w-16 flex items-center justify-center 
    bg-red-500 text-white transition-all border-l border-gray-300 border-b ${
      isSwiped ? "translate-x-0" : "translate-x-full"
    }`}
        onClick={handleDelete}
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* 스와이프 가능 영역 */}
      <div
        className={`flex items-center justify-between p-5 text-lg bg-white transition-transform duration-200 ${
          dragging ? "cursor-grabbing" : "cursor-pointer"
        }`}
        style={{ transform: `translateX(${translateX}px)` }}
        /** 터치 이벤트 */
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        /** 마우스 이벤트 */
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
      <div className="flex-1 overflow-auto">
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
          <span>₩ {totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex space-x-2 pb-4 gap-2">
          <button className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 transition rounded-md text-sm">
            pay
          </button>
        </div>
      </div>
    </div>
  );
}
