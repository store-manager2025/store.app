"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { usePosStore } from "../../store/usePosStore";

// 재활용 컴포넌트
import CategoryButton from "../../components/CategoryButton";
import MenuButton from "../../components/PosMenuButton";
import SelectedMenuList from "../../components/SelectedMenuList";

/** PosPage 화면 */
export default function PosPage() {
  const router = useRouter();

  // Zustand
  const {
    storeId,
    tableName,
    categories,
    menus,
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

  // ---------------------------
  // 1) 초기에 storeId 로딩
  // ---------------------------
  useEffect(() => {
    const savedStoreId = localStorage.getItem("currentStoreId");
    if (savedStoreId) {
      setStoreId(Number(savedStoreId));
    } else {
      setStoreId(null);
    }
    setTableName("Table T1"); // 예시로 설정
  }, [setStoreId, setTableName]);

  // ---------------------------
  // 2) storeId 바뀔 때 카테고리 불러오기
  // ---------------------------
  useEffect(() => {
    if (storeId) {
      fetchCategories(storeId).then(() => {
        // fetchCategories가 끝난 후, 첫 번째 카테고리를 자동 선택
        if (categories && categories.length > 0) {
          setSelectedCategoryId(categories[0].categoryId);
        }
      });
    }
  }, [storeId]);

  // ---------------------------
  // 3) selectedCategoryId 바뀔 때 메뉴 불러오기
  // ---------------------------
  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== -1) {
      fetchMenusByCategory(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  // ---------------------------
  // UI 이벤트
  // ---------------------------
  const handleCategoryClick = (catId: number) => {
    setSelectedCategoryId(catId);
  };

  const handleMenuClick = (menuName: string, price: number) => {
    addItem(menuName, price);
  };

  const handleTableClick = () => {
    router.push("/table");
  };

  /**
   * (A) 메뉴 그리드를 렌더링하는 함수
   *  - 5열 × 4행
   *  - `menuStyle.sizeType`이 FULL이면 셀 전체에 1개만 배치
   *  - HALF면 같은 셀에 최대 2개(위/아래)
   *  - `menuStyle.colorCode`로 배경색 표시
   */
  const renderGrid = () => {
    const rows = 4;
    const cols = 5;

    return (
      <div className="grid grid-cols-5 grid-rows-4 flex-1">
        {Array.from({ length: rows }).map((_, rowIdx) =>
          Array.from({ length: cols }).map((_, colIdx) => {
            // 해당 (colIdx, rowIdx)에 맞는 메뉴들만 필터
            const cellMenus = menus.filter(
              (m) =>
                m.menuStyle?.positionX === colIdx &&
                m.menuStyle?.positionY === rowIdx
            );

            if (cellMenus.length === 0) {
              // 메뉴가 없으면 빈 칸으로 처리
              return <div key={`${rowIdx}-${colIdx}`} className="bg-white" />;
            }

            // FULL 메뉴가 있으면 셀 전체에 1개만 배치
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

            // HALF 메뉴인 경우, 최대 2개 (위/아래)
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
                      onClick={() => handleMenuClick(item.menuName, item.price)}
                    />
                  </div>
                ))}
                {/* HALF 메뉴가 1개이면 아래쪽 칸은 + 아이콘으로 표시 */}
                {cellMenus.length === 1 && (
                  <div className="flex-1 flex items-center justify-center bg-gray-200">
                    <span className="text-2xl text-gray-400">+</span>
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
      {/* 헤더 영역 - 상대/절대 포지션 */}
      <div className="relative w-full h-10 border-b-2 border-gray-300 bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategoryId} // 카테고리 변경 시 새로운 키 부여
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {/* (1) 카테고리 영역: 왼쪽 */}
            <div className="absolute bottom-[-4px] h-full flex items-center">
              {!isLoading &&
                categories.map((cat) => (
                  <CategoryButton
                    key={cat.categoryId}
                    categoryName={cat.categoryName}
                    style={{
                      backgroundColor:
                        cat.categoryStyle?.colorCode || "#f0f0f0",
                    }}
                    selected={cat.categoryId === selectedCategoryId}
                    onClick={() => handleCategoryClick(cat.categoryId)}
                  />
                ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* (2) 테이블 버튼: 중앙 */}
        <div className="absolute font-mono top-0 left-1/2 -translate-x-1/2 h-full flex items-center">
          <button
            onClick={handleTableClick}
            className="py-2 px-6 text-sm font-medium hover:bg-gray-100 transition"
          >
            {tableName || "unconnected"}
          </button>
        </div>

        {/* (3) 설정 아이콘: 오른쪽 */}
        <div className="absolute right-2 top-0 h-full flex items-center">
          <button
            onClick={() => router.push("/setting")}
            className="text-gray-500 hover:text-gray-900 transition"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex flex-1 font-mono overflow-hidden">
        {/* 왼쪽: 메뉴 그리드 (70%) */}
        <div className="flex flex-col w-[70%] overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategoryId} // 카테고리 변경 시 새로운 키 부여
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {menus && menus.length > 0 && menus[0].menuId !== -1 ? (
                renderGrid()
              ) : (
                <div className="text-center text-gray-400"></div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 오른쪽: 선택된 메뉴 목록 (30%) */}
        <div className="flex flex-col w-[30%] border-l-2 border-gray-300 overflow-hidden">
          <SelectedMenuList />
        </div>
      </div>
    </div>
  );
}
