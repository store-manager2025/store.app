"use client";
import React from "react";

const Header = () => {
  return (
    <header className="p-4 bg-white border-none flex items-center justify-between">
      <h1 className="text-xl font-bold">My POS</h1>
      {/* 로그인 정보나 알림, 프로필 등 */}
      <div className="text-sm text-gray-500">사용자 이름</div>
    </header>
  );
};

export default Header;
