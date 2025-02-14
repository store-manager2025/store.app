"use client";
import React from "react";

type Category = {
  categoryId: number;
  categoryName: string;
  uiId: number;
  categoryStyle: {
    uiId: number;
    colorCode: string;
    positionX?: number;
    positionY?: number;
    sizeType?: string;
  };
};

interface Props {
  category: Category;
  selectedCategoryId?: number;
  onSelectCategory: (category: Category) => void;
}

export default function CategorySidebar({
  category,
  selectedCategoryId,
  onSelectCategory,
}: Props) {
  const isSelected = category.categoryId === selectedCategoryId;
  return (
    <button
      onClick={() => onSelectCategory(category)}
      className={`border border-gray-400 rounded mb-2 p-2 
                  ${isSelected ? "bg-blue-500 text-white" : "bg-white text-gray-700"}`}
    >
      {category.categoryName}
    </button>
  );
}
