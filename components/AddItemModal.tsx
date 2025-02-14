"use client";
import React, { useState, useEffect } from "react";

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
  // 사용자가 직접 고를 색상 (예: #FAFAFA 기본값)
  const [colorCode, setColorCode] = useState("#FAFAFA");

  // 로컬스토리지에서 토큰 가져오기
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

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

      // bodyData에 colorCode도 포함
      const bodyData = {
        categoryId,
        storeId,
        menuName,
        price,
        // 아래 두 개는 백엔드 saveMenuRequestDto에 따로 없지만,
        // 만약 백엔드에서 dto를 수정했다면 이렇게 넘길 수 있음
        colorCode,
        sizeType,
        positionX,
        positionY,
      };

      // 1. 메뉴 생성 (POST)
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // 토큰 추가
        },
        body: JSON.stringify(bodyData),
      });
      if (!res.ok) throw new Error("Fail to create menu");

      // 필요하다면 생성된 menuId를 응답 받아서 UI 업데이트 (PATCH)
      // 여기서는 생략
      // const json = await res.json();
      // const newMenuId = json.newMenuId;

      // 모달 닫기
      onClose();
    } catch (err) {
      console.error(err);
      alert("메뉴 생성 실패");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">Add New Item</div>
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
            placeholder="Enter menu name"
          />

          <label>Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="Enter menu price"
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
        </div>
      </div>
    </div>
  );
}
