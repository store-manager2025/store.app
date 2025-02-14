"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CategorySidebar from "../../components/CategorySidebar";
import GridCell from "../../components/GridCell";
import AddItemModal from "../../components/AddItemModal";
import ModifyItemModal from "../../components/ModifyItemModal";

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

type MenuItem = {
  menuId: number;
  uiId: number;
  menuName: string;
  price: number;
  discountRate?: number;
  menuStyle: {
    uiId: number;
    colorCode: string;
    positionX?: number;
    positionY?: number;
    sizeType?: string; // "FULL" or "HALF" 등
  };
};

export default function EditMenuPage() {
  const router = useRouter();

  // storeId (localStorage나 다른 곳에서 가져오도록)
  const [storeId, setStoreId] = useState<number | null>(null);

  // 토큰 상태
  const [token, setToken] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);

  // 모달에서 사용할 값
  const [currentCell, setCurrentCell] = useState<{ x: number; y: number } | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);

  useEffect(() => {
    // 로그인 토큰 확인
    const storedToken = localStorage.getItem("accessToken");
    if (!storedToken) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      router.push("/");
      return;
    }
    setToken(storedToken);

    // storeId 확인
    const savedStoreId = localStorage.getItem("currentStoreId");
    if (!savedStoreId) {
      alert("Store ID가 없습니다. 다시 로그인해주세요.");
      router.push("/");
      return;
    }
    setStoreId(Number(savedStoreId));
  }, [router]);

  // storeId가 세팅되면 카테고리 가져오기
  useEffect(() => {
    if (storeId && token) {
      fetchCategories(storeId, token);
    }
  }, [storeId, token]);

  const fetchCategories = async (storeId: number, token: string) => {
    try {
      const res = await fetch(`/api/categories/all/${storeId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ★ 토큰 추가
        },
      });
      if (!res.ok) {
        console.error("카테고리 조회 실패:", res.status);
        alert("카테고리 조회 실패");
        return;
      }
      const data: Category[] = await res.json();
      console.log("categories: ", data); // 디버그용

      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0]); // 첫 카테고리를 자동 선택
      }
    } catch (err) {
      console.error("fetchCategories error:", err);
      alert("카테고리를 불러오지 못했습니다.");
    }
  };

  // 선택된 카테고리가 바뀌면 해당 카테고리의 메뉴 불러옴
  useEffect(() => {
    if (selectedCategory && token) {
      fetchMenus(selectedCategory.categoryId, token);
    }
  }, [selectedCategory, token]);

  const fetchMenus = async (categoryId: number, token: string) => {
    try {
      const res = await fetch(`/api/menus/all/${categoryId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ★ 토큰 추가
        },
      });
      if (!res.ok) {
        console.error("메뉴 조회 실패:", res.status);
        alert("메뉴 조회 실패");
        return;
      }
      const data: MenuItem[] = await res.json();
      console.log("menus: ", data); // 디버그용
      setMenus(data);
    } catch (err) {
      console.error("fetchMenus error:", err);
      alert("메뉴를 불러오지 못했습니다.");
    }
  };

  // 빈칸(+) 클릭 -> AddItemModal 열기
  const handleCellClick = (x: number, y: number) => {
    setCurrentCell({ x, y });
    setShowAddModal(true);
  };

  // 메뉴 클릭 -> ModifyItemModal 열기
  const handleMenuClick = (menu: MenuItem) => {
    setSelectedMenu(menu);
    setShowModifyModal(true);
  };

  // 모달에서 저장/취소 후 -> 목록 다시 불러오기
  const closeAddModal = () => {
    setShowAddModal(false);
    setCurrentCell(null);
    if (selectedCategory && token) {
      fetchMenus(selectedCategory.categoryId, token);
    }
  };

  const closeModifyModal = () => {
    setShowModifyModal(false);
    setSelectedMenu(null);
    if (selectedCategory && token) {
      fetchMenus(selectedCategory.categoryId, token);
    }
  };

  // 실제 UI
  return (
    <div className="flex w-screen h-screen p-4 overflow-hidden">
      {/* 1) 왼쪽: 메뉴 그리드 (5 x 4) */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="grid grid-cols-5 grid-rows-4 gap-2">
          {Array.from({ length: 4 }).map((_, rowIndex) =>
            Array.from({ length: 5 }).map((_, colIndex) => {
              // 해당 (rowIndex, colIndex)에 들어 있는 메뉴 필터
              const cellMenus = menus.filter(
                (m) => m.menuStyle.positionX === colIndex && m.menuStyle.positionY === rowIndex
              );
              return (
                <GridCell
                  key={`cell-${rowIndex}-${colIndex}`}
                  row={rowIndex}
                  col={colIndex}
                  items={cellMenus}
                  onCellClick={handleCellClick}
                  onMenuClick={handleMenuClick}
                />
              );
            })
          )}
        </div>
      </div>

      {/* 2) 오른쪽: 카테고리 목록 */}
      <div className="w-40 flex flex-col border-l border-gray-300 pl-2">
        {categories.map((cat) => (
          <CategorySidebar
            key={cat.categoryId}
            category={cat}
            selectedCategoryId={selectedCategory?.categoryId}
            onSelectCategory={(category) => setSelectedCategory(category)}
          />
        ))}
      </div>

      {/* 3) Add Modal */}
      {showAddModal && currentCell && selectedCategory && storeId && (
        <AddItemModal
          onClose={closeAddModal}
          categoryId={selectedCategory.categoryId}
          storeId={storeId}
          positionX={currentCell.x}
          positionY={currentCell.y}
        />
      )}

      {/* 4) Modify Modal */}
      {showModifyModal && selectedMenu && (
        <ModifyItemModal menu={selectedMenu} onClose={closeModifyModal} />
      )}
    </div>
  );
}
