"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

import { usePosStore } from "../../store/usePosStore";

// 컴포넌트
import CategoryButton from "../../components/CategoryButton";
import MenuButton from "../../components/PosMenuButton";
import SelectedMenuList from "../../components/SelectedMenuList";
import PlaceModal from "../../components/PlaceModal";

interface SelectedItem {
  menuName: string;
  price: number;
  quantity: number;
  menuId: number;
}

/** PosPage 화면 */
export default function PosPage() {
  const router = useRouter();

  // Zustand
  const {
    storeId,
    tableName,
    setPlaceId,
    categories,
    currentMenus,
    isLoading,
    setStoreId,
    setOrderId,
    setSelectedItems,
    setTableName,
    fetchCategories,
    fetchMenusByCategory,
    addItem,
    selectedItems,
    orderId,
    placeId,
    fetchUnpaidOrderByPlace,
    menuCache, // menuCache 추가
  } = usePosStore();

  // 현재 선택된 카테고리 ID
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // 모달 표시 상태
  const [showPlaceModal, setShowPlaceModal] = useState(false);

  // 초기에 storeId 로딩 → 카테고리 불러오기
  useEffect(() => {
    const savedStoreId = localStorage.getItem("currentStoreId");
    if (savedStoreId) {
      setStoreId(Number(savedStoreId));
    } else {
      setStoreId(null);
    }
    setTableName("");
  }, [setStoreId, setTableName]);

  // 카테고리 불러오기
  useEffect(() => {
    if (storeId) {
      fetchCategories(storeId);
    }
  }, [storeId, fetchCategories]);

  // 모든 카테고리의 메뉴를 사전 로드 및 초기 currentMenus 설정
  useEffect(() => {
    if (storeId && categories.length > 0) {
      const firstCategoryId = categories[0].categoryId;
      setSelectedCategoryId(firstCategoryId);

      // menuCache에서 첫 번째 카테고리의 메뉴를 가져와 초기화
      if (menuCache[firstCategoryId]) {
        usePosStore.setState({ currentMenus: menuCache[firstCategoryId] });
      }

      // 모든 카테고리 메뉴를 사전 로드
      categories.forEach((cat) => {
        fetchMenusByCategory(cat.categoryId);
      });
    }
  }, [storeId, categories, fetchMenusByCategory, menuCache]);

  // selectedCategoryId 변경 시 currentMenus 즉시 업데이트
  useEffect(() => {
    if (selectedCategoryId && menuCache[selectedCategoryId]) {
      usePosStore.setState({ currentMenus: menuCache[selectedCategoryId] });
    } else if (selectedCategoryId) {
      fetchMenusByCategory(selectedCategoryId);
    }
  }, [selectedCategoryId, menuCache, fetchMenusByCategory]);

  // 이벤트 핸들러
  const handleCategoryClick = (catId: number) => {
    setSelectedCategoryId(catId);
  };

  const handleMenuClick = (menuName: string, price: number, menuId: number) => {
    addItem(menuName, price, menuId);
  };

  const handleTableClick = () => {
    setShowPlaceModal(true);
  };

  const handleCloseModal = () => {
    setShowPlaceModal(false);
  };

  const handlePlaceSelected = (
    placeName: string,
    selectedPlaceId: number,
    orderIdFromApi?: number,
    orderMenus?: SelectedItem[]
  ) => {
    setTableName(placeName);
    setPlaceId(selectedPlaceId);
    if (orderIdFromApi && orderIdFromApi > 0) {
      setOrderId(orderIdFromApi);
      setSelectedItems(orderMenus || []);
    } else {
      setOrderId(null);
      setSelectedItems([]);
    }
    setShowPlaceModal(false);
  };

  // 5×4 그리드 렌더링
  const renderGrid = () => {
    const rows = 4;
    const cols = 5;

    return (
      <div className="grid grid-cols-5 grid-rows-4 flex-1">
        {Array.from({ length: rows }).map((_, rowIdx) =>
          Array.from({ length: cols }).map((_, colIdx) => {
            const cellMenus = currentMenus.filter(
              (m) =>
                m.menuStyle.positionX === colIdx &&
                m.menuStyle.positionY === rowIdx
            );

            if (cellMenus.length === 0) {
              return <div key={`${rowIdx}-${colIdx}`} className="bg-white" />;
            }

            const fullItem = cellMenus.find((m) => m.menuStyle.sizeType === "FULL");
            if (fullItem) {
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className="flex items-center justify-center"
                  style={{ backgroundColor: fullItem.menuStyle.colorCode }}
                >
                  <MenuButton
                    menuName={fullItem.menuName}
                    price={fullItem.price}
                    color={fullItem.menuStyle.colorCode}
                    onClick={() =>
                      handleMenuClick(fullItem.menuName, fullItem.price, fullItem.menuId)
                    }
                  />
                </div>
              );
            }

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className="flex flex-col w-full h-full"
              >
                {cellMenus.map((item) => (
                  <div
                    key={item.menuId}
                    className="flex-1 flex items-center justify-center"
                    style={{ backgroundColor: item.menuStyle.colorCode }}
                  >
                    <MenuButton
                      menuName={item.menuName}
                      price={item.price}
                      color={item.menuStyle.colorCode}
                      onClick={() =>
                        handleMenuClick(item.menuName, item.price, item.menuId)
                      }
                    />
                  </div>
                ))}
                {cellMenus.length === 1 && (
                  <div className="flex-1 flex items-center justify-center bg-white"></div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 헤더 */}
      <div className="relative w-full h-10 border-b-2 border-gray-300 bg-white">
        <div className="absolute bottom-[-4px] h-full flex items-center">
          {categories.map((cat) => (
            <CategoryButton
              key={cat.categoryId}
              categoryName={cat.categoryName}
              style={{ backgroundColor: cat.categoryStyle?.colorCode || "#f0f0f0" }}
              selected={cat.categoryId === selectedCategoryId}
              onClick={() => handleCategoryClick(cat.categoryId)}
            />
          ))}
        </div>
        <div className="absolute font-mono top-0 left-1/2 -translate-x-1/2 h-full flex items-center">
          <button
            onClick={handleTableClick}
            className="py-2 px-6 text-sm font-medium hover:bg-gray-100 transition"
          >
            {tableName || "Select Table"}
          </button>
        </div>
        <div className="absolute right-2 top-0 h-full flex items-center">
          <button
            onClick={() => router.push("/setting")}
            className="text-gray-500 hover:text-gray-900 transition"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 메인 영역 */}
      <div className="flex flex-1 font-mono overflow-hidden">
        {/* 왼쪽: 메뉴 그리드 (70%) */}
        <div className="flex flex-col w-[70%] overflow-auto">
          {isLoading && (
            <div className="text-center text-gray-400 py-2">Loading...</div>
          )}
          {renderGrid()} {/* 조건 제거, 항상 그리드 표시 */}
        </div>

        {/* 오른쪽: 선택된 메뉴 (30%) */}
        <div className="flex flex-col w-[30%] border-l-2 border-gray-300 overflow-hidden">
          <SelectedMenuList />
        </div>

        {/* 모달 */}
        {showPlaceModal && (
          <PlaceModal
            onClose={handleCloseModal}
            onPlaceSelected={handlePlaceSelected}
          />
        )}
      </div>
    </div>
  );
}