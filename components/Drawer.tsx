"use client";
import React from "react";

const Drawer = () => {
  return (
    <div className="p-4">
      <h2 className="font-bold mb-2">Drawer</h2>
      {/* 카테고리/메뉴 아이템 */}
      <ul className="space-y-2">
        <li className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
          Home
        </li>
        <li className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
          Categories
        </li>
        <li className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
          Orders
        </li>
      </ul>
    </div>
  );
};

export default Drawer;
