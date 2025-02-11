"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePosStore } from "../../store/usePosStore";

// 라이브러리 아이콘 사용 예시 (lucide-react)
import { Settings } from "lucide-react";

// 컴포넌트
import CategoryButton from "../../components/CategoryButton";
import MenuButton from "../../components/MenuButton";
import SelectedMenuList from "../../components/SelectedMenuList";

export default function PosPage() {
  const router = useRouter();

  // Zustand State
  const {
    storeId,
    tableName,
    categories,
    menus,
    isLoading,
    setStoreId,
    setTableName,
    fetchCategories,
    fetchMenus,
    addItem,
  } = usePosStore();

  // 추가: 현재 선택된 카테고리 id (UI용)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  // 1) 초기화
  useEffect(() => {
    const savedStoreId = localStorage.getItem("currentStoreId");
    if (savedStoreId) {
      setStoreId(Number(savedStoreId));
    } else {
      setStoreId(null);
    }
    setTableName("Table T1"); // 예시
  }, [setStoreId, setTableName]);

  // 2) storeId 바뀔 때마다 카테고리/메뉴 로드
  useEffect(() => {
    if (storeId) {
      fetchCategories(storeId);
      fetchMenus(storeId);
    } else {
      // storeId 없으면 unconnected
      fetchCategories(0);
      fetchMenus(0);
    }
  }, [storeId, fetchCategories, fetchMenus]);

  // 테이블 버튼 클릭
  const handleTableClick = () => {
    router.push("/table");
  };

  // 카테고리 클릭
  const handleCategoryClick = (catId: number) => {
    setSelectedCategoryId(catId === selectedCategoryId ? null : catId);
    // TODO: 카테고리별 메뉴 필터를 하고 싶으면 여기서 처리 or fetchMenus(catId)
  };

  return (
    // flex-col + h-screen으로 전체 높이를 100vh로 설정 (전체 페이지 스크롤 방지)
    <div className="flex flex-col h-screen">
      {/* 헤더 (상단 50px 고정) */}
      <div
        className="flex items-center w-full"
        style={{
          backgroundColor: "#fff",
          height: "50px",
          borderBottom: "2px solid #ccc",
        }}
      >
        {/* 왼쪽: 카테고리 버튼 */}
        <div className="relative bottom-[-4px] left-0 flex items-end">
          {isLoading && (
            <span className="text-sm text-gray-400 px-2">Loading...</span>
          )}
          {!isLoading &&
            categories.map((cat) => (
              <CategoryButton
                key={cat.categoryId}
                categoryName={cat.categoryName}
                selected={cat.categoryId === selectedCategoryId}
                onClick={() => handleCategoryClick(cat.categoryId)}
              />
            ))}
        </div>

        {/* 중앙: 테이블명 버튼 */}
        <div className="flex-1 flex items-center font-mono justify-center">
          <button
            onClick={handleTableClick}
            className="py-4 px-6 text-sm font-medium hover:bg-gray-100 transition"
          >
            {tableName || "unconnected"}
          </button>
        </div>

        {/* 오른쪽: 설정 아이콘 */}
        <div className="pt-1 px-4">
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
        {/* 왼쪽: 메뉴 목록 (70%) */}
        <div className="flex flex-col w-[70%] overflow-hidden">
          <div className="grid grid-cols-5 grid-rows-4 gap-2 overflow-auto flex-1">
            {menus.map((menu) => {
              if (menu.menuId === -1) {
                return (
                  <MenuButton
                    key={menu.menuId}
                    menuName="unconnected"
                    price={0}
                    onClick={() => {}}
                    color="#f5f5f5"
                  />
                );
              }
              return (
                <MenuButton
                  key={menu.menuId}
                  menuName={menu.menuName}
                  price={menu.price}
                  onClick={() => addItem(menu.menuName, menu.price)}
                />
              );
            })}
          </div>
        </div>

        {/* 오른쪽: 선택된 메뉴 목록 (30%) */}
        <div className="flex flex-col w-[30%] border-l-2 border-gray-300 overflow-hidden">
          <SelectedMenuList />
        </div>
      </div>
    </div>
  );
}