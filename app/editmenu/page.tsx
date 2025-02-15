"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CategorySidebar from "../../components/CategorySidebar";
import GridCell from "../../components/GridCell";
import AddItemModal from "../../components/AddItemModal";
import ModifyItemModal from "../../components/ModifyItemModal";
import axiosInstance from "../../lib/axiosInstance"; 

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
      fetchCategories(storeId);
    }
  }, [storeId, token]);

  const fetchCategories = async (storeId: number) => {
    try {
      const { data } = await axiosInstance.get(`/api/categories/all/${storeId}`);
      console.log("categories: ", data);
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0]);
      }
    } catch (err) {
      console.error("카테고리 조회 실패:", err);
      alert("카테고리 조회 실패");
    }
  };

  // 선택된 카테고리가 바뀌면 해당 카테고리의 메뉴 불러오기
  useEffect(() => {
    if (selectedCategory && token) {
      fetchMenus(selectedCategory.categoryId);
    }
  }, [selectedCategory, token]);

  const fetchMenus = async (categoryId: number) => {
    try {
      const { data } = await axiosInstance.get(`/api/menus/all/${categoryId}`);
      console.log("menus: ", data);
      setMenus(data);
    } catch (err) {
      console.error("메뉴 조회 실패:", err);
      alert("메뉴 조회 실패");
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

  // 실제 UI
  return (
    <div className="flex items-center justify-center h-screen w-screen relative">
      {/* 전체를 감싸는 박스 */}
      <div className="relative w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl p-6 flex flex-row shadow-lg">
        
        {/* 왼쪽 50% (카테고리 + 그리드) */}
        <div className="w-1/2 flex flex-col items-center justify-start">
          
          {/* 1) 카테고리 바 (가로 정렬) */}
          <div className="flex flex-row space-x-2 mb-4">
            {categories.map((cat) => (
              <CategorySidebar
                key={cat.categoryId}
                category={cat}
                selectedCategoryId={selectedCategory?.categoryId}
                onSelectCategory={setSelectedCategory}
              />
            ))}
          </div>
  
          {/* 2) 메뉴 그리드 */}
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full h-full grid grid-cols-5 grid-rows-4 gap-1 border border-blue-500 rounded-lg p-2">
              {Array.from({ length: 4 }).map((_, rowIndex) =>
                Array.from({ length: 5 }).map((_, colIndex) => {
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
  
        </div>
  
        {/* 중앙 구분선 (위아래 마진 포함) */}
        <div className="my-6 border-l border-gray-400"></div>
  
        {/* 오른쪽 50% (모달창 렌더링 영역) */}
        <div className="w-1/2 flex items-center justify-center">
          {showAddModal && currentCell && selectedCategory && storeId && (
            <AddItemModal
              onClose={closeAddModal}
              categoryId={selectedCategory.categoryId}
              storeId={storeId}
              positionX={currentCell.x}
              positionY={currentCell.y}
            />
          )}
  
          {showModifyModal && selectedMenu && (
            <ModifyItemModal menu={selectedMenu} onClose={closeModifyModal} />
          )}
        </div>
  
      </div>
    </div>
  );    
}  
