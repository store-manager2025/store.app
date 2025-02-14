"use client";
import React from "react";
import { Plus } from "lucide-react";

type MenuItem = {
  menuId: number;
  menuName: string;
  price: number;
  discountRate?: number;
  uiId: number;
  menuStyle: {
    uiId: number;
    colorCode: string;
    positionX?: number;
    positionY?: number;
    sizeType?: string; // "FULL" or "HALF"
  };
};

interface Props {
  row: number;
  col: number;
  items: MenuItem[];
  onCellClick: (x: number, y: number) => void;
  onMenuClick: (menu: MenuItem) => void;
}

export default function GridCell({
  row,
  col,
  items,
  onCellClick,
  onMenuClick,
}: Props) {
  // FULL 사이즈 메뉴가 있는지 확인
  const fullItem = items.find((m) => m.menuStyle.sizeType === "FULL");
  // HALF 사이즈 메뉴가 몇 개인지 확인
  const halfItems = items.filter((m) => m.menuStyle.sizeType === "HALF");

  // 1) 셀이 완전히 비었음 -> + 버튼
  if (items.length === 0) {
    return (
      <button
        onClick={() => onCellClick(col, row)}
        className="w-24 h-24 bg-gray-300 rounded-md flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>
    );
  }

  // 2) FULL 메뉴가 있으면 버튼 1개만 보여줌
  if (fullItem) {
    return (
      <button
        onClick={() => onMenuClick(fullItem)}
        className="w-24 h-24 rounded-md font-bold flex items-center justify-center"
        style={{ backgroundColor: fullItem.menuStyle.colorCode || "#F5F5F5" }}
      >
        {fullItem.menuName}
      </button>
    );
  }

  // 3) HALF 메뉴가 있으면, 최대 2개
  if (halfItems.length > 0) {
    return (
      <div className="w-24 h-24 bg-gray-200 rounded-md flex flex-col">
        {halfItems.map((menu, idx) => (
          <button
            key={menu.menuId}
            onClick={() => onMenuClick(menu)}
            className="flex-1 border-b last:border-b-0 flex items-center justify-center font-bold"
            style={{
              borderColor: "#ccc",
              backgroundColor: menu.menuStyle.colorCode || "#F5F5F5",
            }}
          >
            {menu.menuName}
          </button>
        ))}
        {/* HALF가 1개만 있다면 나머지 절반을 + 버튼으로 */}
        {halfItems.length === 1 && (
          <button
            onClick={() => onCellClick(col, row)}
            className="flex-1 flex items-center justify-center bg-gray-300"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // 위 경우가 아니라면 그냥 null 반환
  return null;
}
