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

export interface SelectedItem { 
  menuName: string;
  price: number;
  quantity: number;
  menuId?: number;
}

interface PosState {
  storeId: number | null;
  tableName: string | null;
  
  placeId: number | null;
  orderId: number | null;

  // 카테고리 목록 & 캐싱
  categories: Category[];
  menuCache: Record<number, Menu[]>; // <카테고리ID, 메뉴목록> 캐싱
  currentMenus: Menu[]; // 화면에 표시되는 메뉴

  selectedItems: SelectedItem[];
  
  isLoading: boolean;

  setPlaceId: (id: number | null) => void;
  setOrderId: (id: number | null) => void;

  setStoreId: (id: number | null) => void;
  setTableName: (name: string | null) => void;

  setSelectedItems: (items: SelectedItem[]) => void;
  fetchCategories: (storeId: number) => Promise<void>;
  fetchUnpaidOrderByPlace: (placeId: number) => Promise<void>;
  fetchMenusByCategory: (categoryId: number, forceReload?: boolean) => Promise<void>;

  // 캐시 무효화 액션
  invalidateMenuCache: (categoryId: number) => void;

  addItem: (menuName: string, price: number, menuId?: number) => void;
  
  removeItem: (menuName: string) => void;

  clearItems: () => void;

  resetData: () => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  storeId: null,
  tableName: null,

  placeId: null,
  orderId: null,

  categories: [],
  menuCache: {},
  currentMenus: [],

  selectedItems: [],
  isLoading: false,

  setStoreId: (id) => set({ storeId: id }),
  setTableName: (name) => set({ tableName: name }),

  setPlaceId: (id) => set({ placeId: id }),
  setOrderId: (id) => set({ orderId: id }),
  setSelectedItems: (items) => set({ selectedItems: items }),

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

  fetchUnpaidOrderByPlace: async (placeId: number) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get(`/api/orders/places/${placeId}`);
      if (data && data.orderStatus === "UNPAID") {
        const selectedItems = data.menuDetail.map((menu: any) => ({
          menuName: menu.menuName,
          price: menu.totalPrice / menu.totalCount,
          quantity: menu.totalCount,
          menuId: menu.menuId,
        }));
        set({
          orderId: data.orderId,
          selectedItems,
          placeId,
          tableName: data.placeName,
          storeId: data.storeId,
          isLoading: false,
        });
      } else {
        set({
          orderId: null,
          selectedItems: [],
          placeId,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error("fetchUnpaidOrderByPlace error:", err);
      set({
        orderId: null,
        selectedItems: [],
        placeId,
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

  addItem: (menuName, price, menuId) => {
    const existingItem = get().selectedItems.find(
      (item) => item.menuName === menuName
    );
    if (existingItem) {
      set({
        selectedItems: get().selectedItems.map((item) =>
          item.menuName === menuName
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({
        selectedItems: [
          ...get().selectedItems,
          { menuName, price, quantity: 1, menuId },
        ],
      });
    }
  },

  removeItem: (menuName: string) => {
    const { selectedItems } = get();
    set({ selectedItems: selectedItems.filter(item => item.menuName !== menuName) });
  },

  clearItems: () => set({ selectedItems: [] }),

  resetData: () => {
    set({
      tableName: null,
      placeId: null,
      orderId: null,
      categories: [],
      menuCache: {},
      currentMenus: [],
      selectedItems: [],
      isLoading: false,
    });
  },
}));
