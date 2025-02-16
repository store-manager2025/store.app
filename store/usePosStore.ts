"use client";
import { create } from "zustand";
import axiosInstance from "@/lib/axiosInstance";

// -----------------------------
// (1) 데이터 타입
// -----------------------------

// 카테고리 구조
interface Category {
  categoryId: number;
  categoryName: string;
  categoryStyle: {
    uiId: number;
    positionX: number | null;
    positionY: number | null;
    colorCode: string;
    sizeType: string | null;
  };
}

// 메뉴 구조
interface Menu {
  menuId: number;
  categoryId: number;
  menuName: string;
  discountRate: number;
  price: number;
  createdAt: string;
  menuStyle: {
    uiId: number;
    positionX: number;
    positionY: number;
    colorCode: string;
    sizeType: "FULL" | "HALF";
  };
}

// 선택된 메뉴 항목 구조(오른쪽 리스트)
interface SelectedItem {
  menuName: string;
  price: number;
  quantity: number;
}

// -----------------------------
// (2) Zustand 상태 및 액션 정의
// -----------------------------
interface PosState {
  // 상태
  storeId: number | null;       // 현재 매장 ID
  tableName: string | null;     // 테이블명 (예: "Table T1")
  categories: Category[];       // 서버에서 불러온 카테고리 목록
  menus: Menu[];                // 서버에서 불러온 "현재 선택된 카테고리"의 메뉴 목록
  selectedItems: SelectedItem[]; 
  isLoading: boolean;

  // 액션
  setStoreId: (id: number | null) => void;
  setTableName: (name: string | null) => void;

  fetchCategories: (storeId: number) => Promise<void>;
  fetchMenusByCategory: (categoryId: number) => Promise<void>;

  addItem: (menuName: string, price: number) => void;

  resetData: () => void;
}

// -----------------------------
// (3) create로 스토어 생성
// -----------------------------
export const usePosStore = create<PosState>((set, get) => ({
  // 초기값
  storeId: null,
  tableName: null,
  categories: [],
  menus: [],
  selectedItems: [],
  isLoading: false,

  // Setter
  setStoreId: (id) => set({ storeId: id }),
  setTableName: (name) => set({ tableName: name }),

  // ---------------------------
  // 1) 카테고리 목록 불러오기
  // ---------------------------
  fetchCategories: async (storeId: number) => {
    set({ isLoading: true });

    try {
      // 실제 서버 호출 예시 (직접 외부 주소 호출 or Next.js route.tsx 사용)
      const res = await axiosInstance.get(`/api/categories/all/${storeId}`);
      const data: Category[] = res.data; // 서버 응답

      set({
        categories: data,
        isLoading: false,
      });
    } catch (error) {
      console.error("fetchCategories error:", error);
      // 실패 시 임시로 unconnected 세팅
      set({
        isLoading: false,
      });
    }
  },

  // ---------------------------
  // 2) 현재 카테고리의 메뉴 목록 불러오기
  // ---------------------------
  fetchMenusByCategory: async (categoryId: number) => {
    set({ isLoading: true });

    try {
      // 실제 서버 호출 예시
      const res = await axiosInstance.get(`/api/menus/all/${categoryId}`);
      const data: Menu[] = res.data;

      set({
        menus: data,
        isLoading: false,
      });
    } catch (error) {
      console.error("fetchMenusByCategory error:", error);
      // 실패 시 unconnected 메뉴
      set({
        // menus: [
        //   {
        //     menuId: -1,
        //     menuName: "unconnected",
        //     price: 0,
        //   },
        // ],
        isLoading: false,
      });
    }
  },

  // ---------------------------
  // 3) 오른쪽 리스트에 메뉴 추가
  // ---------------------------
  addItem: (menuName: string, price: number) => {
    const { selectedItems } = get();

    const existingIndex = selectedItems.findIndex((item) => item.menuName === menuName);
    if (existingIndex !== -1) {
      // 이미 선택된 메뉴 → 수량 +1
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

  // ---------------------------
  // 4) 화면 초기화/로그아웃 시 데이터 리셋
  // ---------------------------
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
