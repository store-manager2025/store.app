"use client";
import React from "react";

interface CategoryButtonProps {
  categoryName: string;
  selected?: boolean; // 선택 상태
  onClick?: () => void;
  style?: React.CSSProperties;  // style prop 추가
}

export default function CategoryButton({
  categoryName,
  selected = false,
  onClick,
  style,
}: CategoryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center px-4 font-mono
        ${selected ? "h-10 -mt-[0.4rem]" : "h-8 mt-[0.1rem]"}
        bg-gray-400 text-white
        hover:opacity-90 transition-all duration-200
      `}
      style={style}
    >
      {categoryName}
    </button>
  );
}
