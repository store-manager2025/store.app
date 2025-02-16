"use client";
import { create } from "zustand";
import axiosInstance from "@/lib/axiosInstance";

type MenuStyle = {
  uiId: number;
  positionX: number;
  positionY: number;
  colorCode: string;
  sizeType: "FULL" | "HALF";
};

export interface Menu {
  menuId: number;
  categoryId: number;
  menuName: string;
  discountRate: number;
  price: number;
  createdAt: string;
  menuStyle: MenuStyle;
}

export interface Category {
  categoryId: number;
  categoryName: string;
  categoryStyle?: {
    uiId: number;
    positionX: number | null;
    positionY: number | null;
    colorCode: string;
    sizeType: string | null;
  };
}

interface SelectedItem {
  menuName: string;
  price: number;
  quantity: number;
}

interface PosState {
  storeId: number | null;
  tableName: string | null;

  // ✅ 카테고리 목록 & 캐싱
  categories: Category[];
  menuCache: Record<number, Menu[]>; // <카테고리ID, 메뉴목록> 캐싱
  currentMenus: Menu[]; // 화면에 표시되는 메뉴

  selectedItems: SelectedItem[];
  isLoading: boolean;

  setStoreId: (id: number | null) => void;
  setTableName: (name: string | null) => void;

  fetchCategories: (storeId: number) => Promise<void>;

  // ✅ menuCache & currentMenus
  fetchMenusByCategory: (categoryId: number) => Promise<void>;

  addItem: (menuName: string, price: number) => void;

  resetData: () => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  storeId: null,
  tableName: null,

  categories: [],
  menuCache: {},
  currentMenus: [],

  selectedItems: [],
  isLoading: false,

  setStoreId: (id) => set({ storeId: id }),
  setTableName: (name) => set({ tableName: name }),

  fetchCategories: async (storeId: number) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get(`/api/categories/all/${storeId}`);
      set({ categories: data, isLoading: false });
    } catch (err) {
      console.error("fetchCategories error:", err);
      set({
        categories: [
          { categoryId: -1, categoryName: "unconnected" },
        ],
        isLoading: false,
      });
    }
  },

  // --------------------------------------
  // 1) 카테고리별 메뉴를 캐싱하여 깜박임 최소화
  // --------------------------------------
  fetchMenusByCategory: async (categoryId: number) => {
    set({ isLoading: true });

    const { menuCache } = get();
    const cached = menuCache[categoryId];
    if (cached) {
      // ✅ 이미 캐시에 있으면 즉시 currentMenus 업데이트
      set({ currentMenus: cached, isLoading: false });
      return;
    }

    try {
      // 🚀 캐시에 없으면 서버에서 새로 가져옴
      const { data } = await axiosInstance.get(`/api/menus/all/${categoryId}`);
      // data: Menu[]
      set((state) => ({
        menuCache: { ...state.menuCache, [categoryId]: data },
        currentMenus: data,
        isLoading: false,
      }));
    } catch (err) {
      console.error("fetchMenusByCategory error:", err);
      // 실패 시
      set({
        currentMenus: [
          {
            menuId: -1,
            categoryId: -1,
            menuName: "unconnected",
            discountRate: 0,
            price: 0,
            createdAt: "",
            menuStyle: {
              uiId: 0,
              positionX: 0,
              positionY: 0,
              colorCode: "#aaa",
              sizeType: "FULL",
            },
          },
        ],
        isLoading: false,
      });
    }
  },

  addItem: (menuName: string, price: number) => {
    const { selectedItems } = get();
    const idx = selectedItems.findIndex((it) => it.menuName === menuName);
    if (idx >= 0) {
      // 이미 있으면 수량 +1
      const updated = [...selectedItems];
      updated[idx].quantity += 1;
      set({ selectedItems: updated });
    } else {
      // 새로 추가
      set({
        selectedItems: [
          ...selectedItems,
          { menuName, price, quantity: 1 },
        ],
      });
    }
  },

  resetData: () => {
    set({
      tableName: null,
      categories: [],
      menuCache: {},
      currentMenus: [],
      selectedItems: [],
      isLoading: false,
    });
  },
}));
