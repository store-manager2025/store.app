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
  uiId:number;
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

  // 카테고리 목록 & 캐싱
  categories: Category[];
  menuCache: Record<number, Menu[]>; // <카테고리ID, 메뉴목록> 캐싱
  currentMenus: Menu[]; // 화면에 표시되는 메뉴

  selectedItems: SelectedItem[];
  
  isLoading: boolean;

  setStoreId: (id: number | null) => void;
  setTableName: (name: string | null) => void;

  fetchCategories: (storeId: number) => Promise<void>;

  /**
   * fetchMenusByCategory:
   * forceReload 옵션이 true이면 캐시 무시하고 서버 재요청,
   * 기본값은 false.
   */
  fetchMenusByCategory: (categoryId: number, forceReload?: boolean) => Promise<void>;

  // 캐시 무효화 액션
  invalidateMenuCache: (categoryId: number) => void;

  addItem: (menuName: string, price: number) => void;
  
  removeItem: (menuName: string) => void;

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
        categories: [{ categoryId: -1, categoryName: "unconnected" }],
        isLoading: false,
      });
    }
  },

  // 메뉴 캐싱 및 강제 새로고침 옵션 추가
  fetchMenusByCategory: async (categoryId: number, forceReload: boolean = false) => {
    set({ isLoading: true });
    const { menuCache } = get();
    if (!forceReload && menuCache[categoryId]) {
      set({ currentMenus: menuCache[categoryId], isLoading: false });
      return;
    }
    try {
      const { data } = await axiosInstance.get(`/api/menus/all/${categoryId}`);
      set((state) => ({
        menuCache: { ...state.menuCache, [categoryId]: data },
        currentMenus: data,
        isLoading: false,
      }));
    } catch (err) {
      console.error("fetchMenusByCategory error:", err);
      set({
        currentMenus: [
          {
            menuId: -1,
            uiId:0,
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

  // 캐시 무효화 액션 (특정 카테고리의 캐시 제거)
  invalidateMenuCache: (categoryId: number) => {
    set((state) => {
      const newCache = { ...state.menuCache };
      delete newCache[categoryId];
      return { menuCache: newCache };
    });
  },

  addItem: (menuName: string, price: number) => {
    const { selectedItems } = get();
    const idx = selectedItems.findIndex((it) => it.menuName === menuName);
    if (idx >= 0) {
      const updated = [...selectedItems];
      updated[idx].quantity += 1;
      set({ selectedItems: updated });
    } else {
      set({ selectedItems: [...selectedItems, { menuName, price, quantity: 1 }] });
    }
  },

  removeItem: (menuName: string) => {
    const { selectedItems } = get();
    set({ selectedItems: selectedItems.filter(item => item.menuName !== menuName) });
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
