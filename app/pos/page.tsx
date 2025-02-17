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

/** PosPage 화면 */
export default function PosPage() {
  const router = useRouter();

  // Zustand
  const {
    storeId,
    tableName,
    categories,
    currentMenus, // ✅ 현재 카테고리 메뉴
    isLoading,
    setStoreId,
    setTableName,
    fetchCategories,
    fetchMenusByCategory,
    addItem,
  } = usePosStore();

  // 현재 선택된 카테고리 ID
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  // ✅ 모달 표시 상태
  const [showPlaceModal, setShowPlaceModal] = useState(false);

  // -----------------------------------------------------
  // 1) 초기에 storeId 로딩 → 카테고리 불러오기 → 첫 번째 카테고리 선택
  // -----------------------------------------------------
  useEffect(() => {
    const savedStoreId = localStorage.getItem("currentStoreId");
    if (savedStoreId) {
      setStoreId(Number(savedStoreId));
    } else {
      setStoreId(null);
    }
    // 기존 예시: setTableName("Table T1") -> 삭제 or 주석
    setTableName(""); 
  }, [setStoreId, setTableName]);

   // 카테고리 불러오기
   useEffect(() => {
    if (storeId) {
      fetchCategories(storeId);
    }
  }, [storeId]);

  // -----------------------------------------------------
  // 1-2) categories가 업데이트되면 첫 번째 카테고리 선택 (초기 설정)
  // -----------------------------------------------------
  useEffect(() => {
    if (categories && categories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(categories[0].categoryId);
    }
  }, [categories, selectedCategoryId]);

  // -----------------------------------------------------
  // 2) selectedCategory 바뀔 때 -> 해당 메뉴 fetch (캐싱)
  // -----------------------------------------------------
  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== -1) {
      // ✅ 클릭 시에도 이전 메뉴 그대로 두고,
      //    fetchMenusByCategory 실행 → 캐시에 있으면 즉시 업데이트,
      //    없으면 서버 호출 → 완료 후 한 번에 currentMenus 업데이트
      fetchMenusByCategory(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  // -----------------------------------------------------
  // 이벤트 핸들러
  // -----------------------------------------------------
  const handleCategoryClick = (catId: number) => {
    setSelectedCategoryId(catId);
  };

  const handleMenuClick = (menuName: string, price: number) => {
    addItem(menuName, price);
  };

  // 테이블 버튼 클릭 -> 모달 오픈
  const handleTableClick = () => {
    setShowPlaceModal(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowPlaceModal(false);
  };

  // 테이블(좌석) 선택 시 tableName 세팅
  const handlePlaceSelected = (placeName: string) => {
    setTableName(placeName);
    setShowPlaceModal(false);
  };

  /**
   * (A) 5×4 그리드에서, menuStyle.positionX/Y로 위치 지정 + FULL/HALF 구분
   */
  const renderGrid = () => {
    const rows = 4;
    const cols = 5;

    return (
      <div className="grid grid-cols-5 grid-rows-4 flex-1">
        {Array.from({ length: rows }).map((_, rowIdx) =>
          Array.from({ length: cols }).map((_, colIdx) => {
            // 해당 (colIdx, rowIdx)에 맞는 메뉴만 필터
            const cellMenus = currentMenus.filter(
              (m) =>
                m.menuStyle.positionX === colIdx &&
                m.menuStyle.positionY === rowIdx
            );

            if (cellMenus.length === 0) {
              return <div key={`${rowIdx}-${colIdx}`} className="bg-white" />;
            }

            // FULL
            const fullItem = cellMenus.find(
              (m) => m.menuStyle.sizeType === "FULL"
            );
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
                      handleMenuClick(fullItem.menuName, fullItem.price)
                    }
                  />
                </div>
              );
            }

            // HALF -> 최대 2개
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
                        handleMenuClick(item.menuName, item.price)
                      }
                    />
                  </div>
                ))}
                {cellMenus.length === 1 && (
                  <div className="flex-1 flex items-center justify-center bg-white">
                  </div>
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
        {/* 왼쪽: 카테고리 버튼들 */}
        <div className="absolute bottom-[-4px] h-full flex items-center">
          {categories.map((cat) => (
            <CategoryButton
              key={cat.categoryId}
              categoryName={cat.categoryName}
              style={{
                backgroundColor: cat.categoryStyle?.colorCode || "#f0f0f0",
              }}
              selected={cat.categoryId === selectedCategoryId}
              onClick={() => handleCategoryClick(cat.categoryId)}
            />
          ))}
        </div>

        {/* 중앙: 테이블명 (버튼 -> 모달 오픈) */}
        <div className="absolute font-mono top-0 left-1/2 -translate-x-1/2 h-full flex items-center">
          <button
            onClick={handleTableClick}
            className="py-2 px-6 text-sm font-medium hover:bg-gray-100 transition"
          >
            {tableName || "Select Table"}
          </button>
        </div>

        {/* 오른쪽: 설정 아이콘 */}
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
          {/* 로딩 중에도 '이전 카테고리 메뉴' 유지 → 깜박임 최소화 */}
          {/* {isLoading && (
            <div className="text-center text-gray-400 py-2">Loading...</div>
          )} */}
          {/* currentMenus가 -1이면 unconnected, 아니면 그리드 */}
          {currentMenus.length > 0 && currentMenus[0].menuId !== -1 ? (
            renderGrid()
          ) : (
            <div className="text-center text-gray-400" />
          )}
        </div>

        {/* 오른쪽: 선택된 메뉴 (30%) */}
        <div className="flex flex-col w-[30%] border-l-2 border-gray-300 overflow-hidden">
          <SelectedMenuList />
        </div>

        {/* (모달) PlaceModal */}
      {showPlaceModal && (
        <PlaceModal onClose={handleCloseModal} onPlaceSelected={handlePlaceSelected} />
      )}
      </div>
    </div>
  );
}
