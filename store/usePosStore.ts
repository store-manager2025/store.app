"use client";

import { create } from "zustand";
import axios from "axios";

// 카테고리 구조
interface Category {
  categoryId: number;
  categoryName: string;
  // ... etc
}

// 메뉴 구조
interface Menu {
  menuId: number;
  menuName: string;
  price: number;
  // ... etc
}

// 선택된 메뉴 항목 구조
interface SelectedItem {
  menuName: string;
  price: number;
  quantity: number;
}

// Zustand 상태 및 액션 정의
interface PosState {
  storeId: number | null;          // 현재 로그인한 매장 ID
  tableName: string | null;        // 선택된 테이블 (예: "Table T1")
  categories: Category[];          // 서버에서 불러온 카테고리 목록
  menus: Menu[];                   // 서버에서 불러온 메뉴 목록
  selectedItems: SelectedItem[];   // 오른쪽에 표시될 선택된 메뉴
  isLoading: boolean;              // 로딩 상태

  // 액션들
  setStoreId: (id: number | null) => void;
  setTableName: (name: string | null) => void;
  fetchCategories: (storeId: number) => Promise<void>;
  fetchMenus: (storeId: number) => Promise<void>;
  addItem: (menuName: string, price: number) => void;
  resetData: () => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  storeId: null,
  tableName: null,
  categories: [],
  menus: [],
  selectedItems: [],
  isLoading: false,

  setStoreId: (id) => set({ storeId: id }),
  setTableName: (name) => set({ tableName: name }),

  // ---------------------
  // 1) 카테고리 목록 조회
  // ---------------------
  fetchCategories: async (storeId: number) => {
    set({ isLoading: true });

    try {
      // 실제 API 호출
      // const res = await axios.get(`/api/categories/all/${storeId}`);
      // const data: Category[] = res.data;

      // DEMO: 가상 데이터 or "unconnected"
      // storeId가 없거나 API 응답 실패 시 unconnected 상태
      if (!storeId) {
        // 서버 데이터가 없을 경우
        set({
          categories: [
            {
              categoryId: -1,
              categoryName: "unconnected",
            },
          ],
          isLoading: false,
        });
        return;
      }

      // 예시: 서버데이터가 있다고 가정한 Mock
      const data: Category[] = [
        { categoryId: 1, categoryName: "Beverage" },
        { categoryId: 2, categoryName: "Food" },
      ];

      set({ categories: data, isLoading: false });
    } catch (error) {
      console.error("fetchCategories error:", error);
      set({
        categories: [
          {
            categoryId: -1,
            categoryName: "unconnected",
          },
        ],
        isLoading: false,
      });
    }
  },

  // ------------
  // 2) 메뉴 목록 조회
  // ------------
  fetchMenus: async (storeId: number) => {
    set({ isLoading: true });

    try {
      // 실제 API 호출
      // const res = await axios.get(`/api/menus?storeId=${storeId}`);
      // const data: Menu[] = res.data;

      // DEMO: 가상 데이터 or "unconnected"
      if (!storeId) {
        // 서버 데이터 없을 시
        set({
          menus: [
            {
              menuId: -1,
              menuName: "unconnected",
              price: 0,
            },
          ],
          isLoading: false,
        });
        return;
      }

      // 예시: 서버데이터가 있다고 가정한 Mock
      const data: Menu[] = [
        { menuId: 101, menuName: "Americano", price: 4500 },
        { menuId: 102, menuName: "Cafe Latte", price: 5000 },
        { menuId: 103, menuName: "Mocha", price: 5000 },
        { menuId: 104, menuName: "Coke", price: 3000 },
        // ...
      ];

      set({ menus: data, isLoading: false });
    } catch (error) {
      console.error("fetchMenus error:", error);
      set({
        menus: [
          {
            menuId: -1,
            menuName: "unconnected",
            price: 0,
          },
        ],
        isLoading: false,
      });
    }
  },

  // -----------------------
  // 3) 메뉴 선택 시 수량 추가
  // -----------------------
  addItem: (menuName: string, price: number) => {
    const { selectedItems } = get();
    // 이미 선택된 메뉴인지 확인
    const existingIndex = selectedItems.findIndex((item) => item.menuName === menuName);

    if (existingIndex !== -1) {
      // 기존 수량 + 1
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      set({ selectedItems: updated });
    } else {
      // 새로 추가
      set({
        selectedItems: [
          ...selectedItems,
          {
            menuName,
            price,
            quantity: 1,
          },
        ],
      });
    }
  },

  // -----------------------
  // 4) 화면 초기화/로그아웃 시 데이터 리셋
  // -----------------------
  resetData: () => {
    set({
      tableName: null,
      categories: [],
      menus: [],
      selectedItems: [],
      isLoading: false,
    });
  },
}));
