"use client";
import React, { useState } from "react";

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

  const handleSave = async () => {
    if (!menuName || price < 0) {
      alert("이름과 가격을 확인하세요.");
      return;
    }
    try {
      const bodyData = {
        categoryId,
        storeId,
        menuName,
        price,
        // 서버에서 ui 저장 후 반환된 uiId를 자동 생성하지만
        // 여기서는 positionX, positionY, colorCode, sizeType 등을
        // PATCH에서 업데이트 하므로, 첫 생성 시에는 default만 보내고
        // 굳이 한번에 등록/업데이트 하는 방식으로 쓰셔도 됩니다.
      };
      // 1. 메뉴 생성 (POST)
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      if (!res.ok) throw new Error("Fail to create menu");
      await res.json();

      // 2. 생성된 메뉴의 ui를 곧바로 PATCH로 업데이트 (sizeType, pos 등)
      //   - 실제로는 방금 생성된 menuId & uiId를 알아야 하지만
      //   - 편의상, 서버 로직상 default UI가 생성된 후 menuId를 바로 알 수 없으므로
      //   - 보통은 응답으로 menuId를 반환하게 하여 그 ID로 후속 PATCH를 하게 합니다.
      //   - 여기서는 예시로 /api/menus/all/{categoryId}를 다시 읽어오는 것으로 대체하거나
      //   - 실제 프로젝트에서는 백엔드가 생성된 menuId를 돌려주도록 해야 합니다.
      
      // (가정) 만약 백엔드가 방금 생성된 menuId를 돌려준다고 가정하면:
      /*
      const { newMenuId } = await res.json();
      await fetch("/api/menus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuId: newMenuId,
          menuName,
          price,
          colorCode: "#F5F5F5",
          positionX,
          positionY,
          sizeType,
        }),
      });
      */

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
        </div>
        <div className="modal-footer">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
