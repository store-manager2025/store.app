"use client";
import React, { useRef }  from "react";
import { useDrag } from "react-dnd";

type MenuItem = {
  menuId: number;
  menuName: string;
  price: number;
  discountRate?: number;
  uiId: number; // 서버로는 안 보냄
  menuStyle: {
    uiId: number; // 서버로는 안 보냄
    colorCode: string;
    positionX?: number;
    positionY?: number;
    sizeType?: string; // "FULL" or "HALF"
  };
};

interface Props {
  menu: MenuItem;
  onMenuClick: (menu: MenuItem) => void;
}

/**
 * 드래그 가능한 메뉴 버튼
 */
export default function MenuButton({ menu, onMenuClick }: Props) {
  
  const dragRef = useRef<HTMLButtonElement>(null);

  const [{ isDragging }, drag] = useDrag<
    { type: "MENU"; menu: MenuItem },
    unknown,
    { isDragging: boolean }
  >({
    type: "MENU", // GridCell에서 accept: "MENU"로 받음
    item: { type: "MENU", menu },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

    // 여기서도 dragRef를 drag 함수에 연결
    drag(dragRef);

  const backgroundColor = menu.menuStyle.colorCode || "#F5F5F5";

  return (
    <button
      ref={dragRef}
      onClick={() => onMenuClick(menu)}
      className="flex-1 border-b last:border-b-0 border-gray-300 flex items-center justify-center font-bold"
      style={{
        backgroundColor,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {menu.menuName}
    </button>
  );
}
