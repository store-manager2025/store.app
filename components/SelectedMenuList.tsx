"use client";

import React from "react";
import { usePosStore } from "../store/usePosStore";

// 우측 '선택된 메뉴' 목록
export default function SelectedMenuList() {
  const selectedItems = usePosStore((state) => state.selectedItems);

  // 총합 계산
  const totalPrice = selectedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="flex flex-col h-full w-full">
      <h1 className="font-mono text-gray-700 py-4 text-lg text-center border-b-2 border-gray-300">Selected Menu</h1>
      <div className="flex-1 space-y-2 overflow-auto">
        {selectedItems.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span>
              {item.quantity} x {item.menuName}
            </span>
            <span>₩ {item.price * item.quantity}</span>
          </div>
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
            // onClick={() => {...} // 추후 결제 로직
          >
            CASH
          </button>
          <button
            className="flex-1 bg-gray-200 hover:bg-gray-300 transition py-2 rounded-md text-sm"
            // onClick={() => {...} // 추후 결제 로직
          >
            CARD
          </button>
        </div>
      </div>
    </div>
  );
}
