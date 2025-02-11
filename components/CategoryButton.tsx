"use client";
import React from "react";

interface CategoryButtonProps {
  categoryName: string;
  selected?: boolean; // 선택 상태
  onClick?: () => void;
}

export default function CategoryButton({
  categoryName,
  selected = false,
  onClick,
}: CategoryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center px-4 font-mono
        ${selected ? "h-12 -mt-2" : "h-10"}
        bg-gray-400 text-white
        hover:opacity-90 transition-all duration-200
      `}
    >
      {categoryName}
    </button>
  );
}
