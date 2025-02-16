"use client";

import React from "react";

interface Props {
  menuName: string;
  price: number;
  onClick?: () => void;
  color?: string; // 서버에서 받아온 색상 or #f5f5f5
  sizeType?: "FULL" | "HALF"; // 버튼 크기 타입
}

export default function MenuButton({
  menuName,
  price,
  onClick,
  color = "#f5f5f5",
  sizeType = "FULL",
}: Props) {
  // sizeType에 따라 width/height 등 다르게 처리 가능
  const baseStyle =
    sizeType === "FULL"
      ? "w-full h-full " // 가로세로 모두 차지 (그리드 셀 크기에 따라)
      : "w-full h-[50%]"; // 예시: 반만 차지

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} text-black font-medium font-mono
                  flex items-center justify-center
                  hover:opacity-90 transition`}
      style={{ backgroundColor: color }}
    >
      <div className="text-center">
        <div>{menuName}</div>
        <div className="text-sm mt-1">{`₩ ${price}`}</div>
      </div>
    </button>
  );
}
