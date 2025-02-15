"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axiosInstance";
import Spinner from "../../components/Spinner";
import CategorySidebar from "../../components/CategorySidebar";
import AddItemModal from "../../components/AddItemModal";
import ModifyItemModal from "../../components/ModifyItemModal";
import GridCell from "../../components/GridCell";
import { ChevronLeft } from "lucide-react";

// react-dnd 관련
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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
  uiId: number; // 서버로는 안 보냄
  menuName: string;
  price: number;
  discountRate?: number;
  menuStyle: {
    uiId: number; // 서버로는 안 보냄
    colorCode: string;
    positionX?: number;
    positionY?: number;
    sizeType?: string; // "FULL" or "HALF"
  };
};

export default function EditMenuPage() {
  const router = useRouter();

  // storeId, 토큰
  const [storeId, setStoreId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 카테고리 관련
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // 메뉴 목록
  const [menus, setMenus] = useState<MenuItem[]>([]);

  // 카테고리 로딩
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);

  // 모달 표시 여부
  const [showAddModal, setShowAddModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);

  // 모달에 넘길 값
  const [currentCell, setCurrentCell] = useState<{ x: number; y: number } | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);

  // HALF 체크
  const [hasHalfItem, setHasHalfItem] = useState(false);
  const [hasHalfInSameCell, setHasHalfInSameCell] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (!storedToken) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      router.push("/");
      return;
    }
    setToken(storedToken);

    const savedStoreId = localStorage.getItem("currentStoreId");
    if (!savedStoreId) {
      alert("Store ID가 없습니다. 다시 로그인해주세요.");
      router.push("/");
      return;
    }
    setStoreId(Number(savedStoreId));
  }, [router]);

  useEffect(() => {
    if (storeId && token) {
      fetchCategories(storeId);
    }
  }, [storeId, token]);

  const fetchCategories = async (storeId: number) => {
    try {
      setLoadingCategories(true);
      const { data } = await axiosInstance.get(`/api/categories/all/${storeId}`);
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0]);
      }
    } catch (err) {
      console.error("카테고리 조회 실패:", err);
      alert("카테고리 조회 실패");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (selectedCategory && token) {
      fetchMenus(selectedCategory.categoryId);
    }
  }, [selectedCategory, token]);

  const fetchMenus = async (categoryId: number) => {
    try {
      const { data } = await axiosInstance.get(`/api/menus/all/${categoryId}`);
      setMenus(data);
    } catch (err) {
      console.error("메뉴 조회 실패:", err);
      alert("메뉴 조회 실패");
    }
  };

  // 셀(+) 클릭 -> AddItemModal 열기
  const handleCellClick = (x: number, y: number) => {
    const cellMenus = menus.filter(
      (m) => m.menuStyle.positionX === x && m.menuStyle.positionY === y
    );
    const hasHalf = cellMenus.some((m) => m.menuStyle.sizeType === "HALF");
    setHasHalfItem(hasHalf);

    setCurrentCell({ x, y });
    setShowModifyModal(false);
    setShowAddModal(true);
  };

  // 메뉴 클릭 -> ModifyItemModal 열기
  const handleMenuClick = (menu: MenuItem) => {
    const { positionX, positionY } = menu.menuStyle;
    const cellMenus = menus.filter(
      (m) =>
        m.menuStyle.positionX === positionX &&
        m.menuStyle.positionY === positionY
    );
    const hasHalf = cellMenus.filter((m) => m.menuStyle.sizeType === "HALF").length;
    setHasHalfInSameCell(hasHalf >= 2);

    setSelectedMenu(menu);
    setShowAddModal(false);
    setShowModifyModal(true);
  };

  // 모달 닫힘
  const closeAddModal = () => {
    setShowAddModal(false);
    setCurrentCell(null);
    if (selectedCategory && token) {
      fetchMenus(selectedCategory.categoryId);
    }
  };

  const closeModifyModal = () => {
    setShowModifyModal(false);
    setSelectedMenu(null);
    if (selectedCategory && token) {
      fetchMenus(selectedCategory.categoryId);
    }
  };

  // --------------- react-dnd: 드롭 시 호출될 함수 ---------------
  // (cell 컴포넌트에서 useDrop으로 받아서 여기서 처리)
  /**
   * 드롭 시: (draggedMenu, targetX, targetY)
   * 1) 셀이 이미 FULL 있으면 -> 불가
   * 2) 셀이 HALF 2개면 -> 불가
   * 3) 셀에 HALF가 1개 이상 있고, 드래그한 게 FULL이면 -> 불가
   * 4) 나머지는 OK
   */
  const moveMenuToCell = async (
    draggedMenu: MenuItem,
    targetX: number,
    targetY: number
  ) => {
    // 셀의 기존 메뉴들
    const cellMenus = menus.filter(
      (m) => m.menuStyle.positionX === targetX && m.menuStyle.positionY === targetY
    );

    // 1) 이미 FULL이 있다면 -> 불가
    const hasFull = cellMenus.some((m) => m.menuStyle.sizeType === "FULL");
    if (hasFull) {
      alert("이 셀에는 이미 FULL 메뉴가 있습니다.");
      return;
    }

    // 2) HALF가 2개라면 -> 불가
    const halfCount = cellMenus.filter((m) => m.menuStyle.sizeType === "HALF").length;
    if (halfCount === 2) {
      alert("이 셀에는 이미 HALF 메뉴가 2개 있어 더 이상 놓을 수 없습니다.");
      return;
    }

    // 3) HALF가 1개 이상 있고, 이번에 드래그하는 게 FULL이면 -> 불가
    if (halfCount >= 1 && draggedMenu.menuStyle.sizeType === "FULL") {
      alert("이 셀에는 이미 HALF 메뉴가 있으므로 FULL 메뉴를 놓을 수 없습니다.");
      return;
    }

    try {
      if (!token) {
        alert("토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      // PATCH 요청
      const bodyData = {
        menuId: draggedMenu.menuId,
        menuName: draggedMenu.menuName,
        price: draggedMenu.price,
        discountRate: 0, // 사용 안 함
        colorCode: draggedMenu.menuStyle.colorCode,
        positionX: targetX,
        positionY: targetY,
        sizeType: draggedMenu.menuStyle.sizeType,
      };

      await axiosInstance.patch("/api/menus", bodyData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // 로컬 상태 업데이트
      setMenus((prev) =>
        prev.map((m) =>
          m.menuId === draggedMenu.menuId
            ? {
                ...m,
                menuStyle: {
                  ...m.menuStyle,
                  positionX: targetX,
                  positionY: targetY,
                },
              }
            : m
        )
      );
    } catch (err) {
      console.error("메뉴 위치 변경 실패:", err);
      alert("메뉴 위치 변경 실패");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex items-center justify-center h-screen w-screen relative">
        <div className="relative w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl p-6 flex flex-row shadow-lg">
          <button
            onClick={() => router.push("/setting")}
            className="absolute top-0 left-0 bg-transparent px-2 py-2 text-gray-500 text-sm rounded hover:text-gray-400"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* 왼쪽 영역 */}
          <div className="w-1/2 flex flex-col justify-start mr-4">
            {loadingCategories ? (
              <div className="flex flex-col w-full h-full items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <>
                <div className="flex flex-row mt-6 ml-4 space-x-2">
                  {categories.map((cat) => (
                    <CategorySidebar
                      key={cat.categoryId}
                      category={cat}
                      selectedCategoryId={selectedCategory?.categoryId}
                      onSelectCategory={setSelectedCategory}
                    />
                  ))}
                </div>

                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  <div className="w-full h-full max-w-full max-h-full grid grid-cols-5 grid-rows-4 gap-1 border border-blue-500 p-2 rounded-lg mb-2">
                    {Array.from({ length: 4 }).map((_, rowIndex) =>
                      Array.from({ length: 5 }).map((_, colIndex) => {
                        const cellMenus = menus.filter(
                          (m) =>
                            m.menuStyle.positionX === colIndex &&
                            m.menuStyle.positionY === rowIndex
                        );

                        return (
                          <GridCell
                            key={`cell-${rowIndex}-${colIndex}`}
                            row={rowIndex}
                            col={colIndex}
                            items={cellMenus}
                            onCellClick={handleCellClick}
                            onMenuClick={handleMenuClick}
                            moveMenuToCell={moveMenuToCell} // ← 드롭 시 호출
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 오른쪽 영역 (모달) */}
          <div className="w-1/2 flex items-center justify-center">
            {showAddModal && currentCell && selectedCategory && storeId && (
              <AddItemModal
                onClose={closeAddModal}
                categoryId={selectedCategory.categoryId}
                storeId={storeId}
                positionX={currentCell.x}
                positionY={currentCell.y}
                hasHalfItem={hasHalfItem}
              />
            )}

            {showModifyModal && selectedMenu && (
              <ModifyItemModal
                menu={selectedMenu}
                onClose={closeModifyModal}
                hasHalfInSameCell={hasHalfInSameCell}
              />
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
