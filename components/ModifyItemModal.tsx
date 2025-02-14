"use client";
import React, { useState, useEffect } from "react";

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
    sizeType?: string; 
  };
};

interface Props {
  menu: MenuItem;
  onClose: () => void;
}

export default function ModifyItemModal({ menu, onClose }: Props) {
  const [menuName, setMenuName] = useState(menu.menuName);
  const [price, setPrice] = useState(menu.price);
  const [sizeType, setSizeType] = useState<"FULL" | "HALF">(
    (menu.menuStyle.sizeType as "FULL" | "HALF") || "FULL"
  );
  // 기존 menu.menuStyle.colorCode가 있다면 초기값으로 사용
  const [colorCode, setColorCode] = useState(menu.menuStyle.colorCode || "#FAFAFA");

  // 토큰
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleDelete = async () => {
    const confirmDel = confirm("정말 삭제하시겠습니까?");
    if (!confirmDel) return;
    try {
      if (!token) {
        alert("토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }
      const res = await fetch(`/api/menus/${menu.menuId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 토큰 추가
        },
      });
      if (!res.ok) throw new Error("Fail to delete menu");
      onClose();
    } catch (err) {
      console.error(err);
      alert("메뉴 삭제 실패");
    }
  };

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
      // PATCH /api/menus
      const bodyData = {
        menuId: menu.menuId,
        uiId: menu.uiId,
        menuName,
        price,
        discountRate: 0, // 일단 사용 안 함
        // 아래 값들 추가
        colorCode,
        positionX: menu.menuStyle.positionX, 
        positionY: menu.menuStyle.positionY,
        sizeType,
      };
      const res = await fetch("/api/menus", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 토큰 추가
        },
        body: JSON.stringify(bodyData),
      });
      if (!res.ok) throw new Error("Fail to update menu");
      onClose();
    } catch (err) {
      console.error(err);
      alert("메뉴 수정 실패");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">Modify Item</div>
        <div className="modal-body">
          {/* Fullsize/Halfsize 선택 */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <label>
              <input
                type="radio"
                name="sizeType"
                value="FULL"
                checked={sizeType === "FULL"}
                onChange={() => setSizeType("FULL")}
              />
              Full Size
            </label>
            <label>
              <input
                type="radio"
                name="sizeType"
                value="HALF"
                checked={sizeType === "HALF"}
                onChange={() => setSizeType("HALF")}
              />
              Half Size
            </label>
          </div>

          <label>Name</label>
          <input
            type="text"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
          />

          <label>Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />

          <label>Color</label>
          <input
            type="text"
            value={colorCode}
            onChange={(e) => setColorCode(e.target.value)}
            placeholder="#FAFAFA"
          />
        </div>
        <div className="modal-footer">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={handleDelete}
            style={{ color: "red", marginLeft: "20px" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
