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
  // HALF 사이즈 메뉴 목록
  const halfItems = items.filter((m) => m.menuStyle.sizeType === "HALF");

  // 부모 그리드 셀을 꽉 채우도록 하는 공통 스타일
  const baseStyle = "w-full h-full rounded-md overflow-hidden";

  // 1) 셀이 완전히 비었으면 -> + 버튼 (부모 영역을 꽉 채움)
  if (items.length === 0) {
    return (
      <button
        onClick={() => onCellClick(col, row)}
        className={`${baseStyle} bg-gray-300 flex items-center justify-center`}
      >
        <Plus className="w-6 h-6" />
      </button>
    );
  }

  // 2) FULL 메뉴가 있으면 단일 버튼으로 표시
  if (fullItem) {
    return (
      <button
        onClick={() => onMenuClick(fullItem)}
        className={`${baseStyle} font-bold flex items-center justify-center`}
        style={{ backgroundColor: fullItem.menuStyle.colorCode || "#F5F5F5" }}
      >
        {fullItem.menuName}
      </button>
    );
  }

  // 3) HALF 메뉴가 있으면, 셀을 위아래로 분할하여 최대 2개 표시
  if (halfItems.length > 0) {
    return (
      <div className={`${baseStyle} flex flex-col`}>
        {halfItems.map((menu) => (
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
        {/* HALF 메뉴가 1개일 경우 나머지 영역에 + 버튼 */}
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

  return null;
}
