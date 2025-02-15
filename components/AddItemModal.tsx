"use client";
import React, { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import axiosInstance from "../lib/axiosInstance";

interface Props {
  onClose: () => void;
  categoryId: number;
  storeId: number;
  positionX: number;
  positionY: number;
}

export default function AddItemModal({
  onClose,
  categoryId,
  storeId,
  positionX,
  positionY,
}: Props) {
  const [menuName, setMenuName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [sizeType, setSizeType] = useState<"FULL" | "HALF">("FULL");
  const [colorCode, setColorCode] = useState("#FAFAFA");
  const [token, setToken] = useState<string | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // 색상 모달을 감싸는 div의 ref
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // 바깥 클릭 감지 이벤트 핸들러
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setIsColorPickerOpen(false);
      }
    }

    if (isColorPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColorPickerOpen]);

  const handleSave = async () => {
    if (!menuName || price < 0) {
      alert("이름과 가격을 확인하세요.");
      return;
    }
    try {
      if (!token) {
        alert("토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const bodyData = {
        categoryId,
        storeId,
        menuName,
        price,
        colorCode,
        sizeType,
        positionX,
        positionY,
      };

      await axiosInstance.post("/api/menus", bodyData);
      onClose();
    } catch (err) {
      console.error(err);
      alert("메뉴 생성 실패");
    }
  };

  return (
    <div className="relative">
      <div
        className="p-6 w-80"
        style={{ left: `${positionX * 100}px`, top: `${positionY * 100}px` }}
      >
        <h2 className="text-xl text-center font-semibold mb-4 text-gray-700">
          Add New Item
        </h2>

        {/* Fullsize/Halfsize 선택 */}
        <div className="flex justify-center gap-4 mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="sizeType"
              value="FULL"
              checked={sizeType === "FULL"}
              onChange={() => setSizeType("FULL")}
              className="w-4 h-4"
            />
            <span className="text-gray-700">Full Size</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="sizeType"
              value="HALF"
              checked={sizeType === "HALF"}
              onChange={() => setSizeType("HALF")}
              className="w-4 h-4"
            />
            <span className="text-gray-700">Half Size</span>
          </label>
        </div>

        {/* 입력 필드 */}
        <div className="space-y-3">
          <div className="flex flex-row items-center gap-4">
            <label className="w-[2.1rem] text-gray-700 block mb-1">Name</label>
            <input
              type="text"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="Enter menu name"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-row items-center gap-4">
            <label className="w-11 text-gray-700 block mb-1">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="Enter menu price"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          {/* 색상 선택 필드 */}
          <div className="relative">
            <div className="flex flex-row items-center gap-4">
              <label className="text-gray-700 block mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={colorCode}
                  readOnly
                  onClick={() => setIsColorPickerOpen(true)}
                  placeholder="#FAFAFA"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                {/* 선택한 색상 미리보기 박스 */}
                <div
                  className="w-14 h-10 border rounded"
                  style={{ backgroundColor: colorCode }}
                  onClick={() => setIsColorPickerOpen(true)}
                />
              </div>
            </div>
            {isColorPickerOpen && (
              <div
                ref={colorPickerRef}
                className="absolute left-0 mt-2 z-10 bg-white p-4 border rounded shadow-lg"
              >
                <HexColorPicker color={colorCode} onChange={setColorCode} />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setIsColorPickerOpen(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setIsColorPickerOpen(false)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="mt-12 flex justify-center gap-4 space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
