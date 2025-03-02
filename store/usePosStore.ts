"use client";
import { create } from "zustand";
import axiosInstance from "@/lib/axiosInstance";

// 메뉴 스타일 타입 정의
type MenuStyle = {
  uiId: number;
  positionX: number;
  positionY: number;
  colorCode: string;
  sizeType: "FULL" | "HALF";
};

// 메뉴 인터페이스 정의
export interface Menu {
  menuId: number;
  uiId: number;
  categoryId: number;
  menuName: string;
  discountRate: number;
  price: number;
  createdAt: string;
  menuStyle: MenuStyle;
}

// 카테고리 인터페이스 정의
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

// 선택된 아이템 인터페이스 정의
export interface SelectedItem {
  menuName: string;
  price: number;
  quantity: number;
  menuId: number;
}

// POS 상태 인터페이스 정의
interface PosState {
  storeId: number | null;
  tableName: string | null;

  placeId: number | null;
  orderId: number | null;
  orderMenuId: number | null;

  // 카테고리 목록 & 캐싱
  categories: Category[];
  menuCache: Record<number, Menu[]>; // <카테고리ID, 메뉴목록> 캐싱
  currentMenus: Menu[]; // 화면에 표시되는 메뉴

  selectedItems: SelectedItem[];

  isLoading: boolean;

  setPlaceId: (id: number | null) => void;
  setOrderId: (id: number | null) => void;
  setorderMenuId: (id: number | null) => void;

  setStoreId: (id: number | null) => void;
  setTableName: (name: string | null) => void;

  setSelectedItems: (items: SelectedItem[]) => void;
  fetchCategories: (storeId: number) => Promise<void>;
  fetchUnpaidOrderByPlace: (placeId: number) => Promise<void>;
  fetchMenusByCategory: (
    categoryId: number,
    forceReload?: boolean
  ) => Promise<void>;

  // 캐시 무효화 액션
  invalidateMenuCache: (categoryId: number) => void;

  addItem: (menuName: string, price: number, menuId: number) => void;

  removeItem: (menuName: string) => void;

  clearItems: () => void;

  resetData: () => void;
}

// 새로운 스토어 인터페이스 정의 (기존 타입 재사용 가능)
interface NewStoreState {
  newStoreId: number | null;
  newTableName: string | null;
  newSelectedItems: SelectedItem[]; // 기존 SelectedItem 타입 재사용
  addNewItem: (item: SelectedItem) => void; // 새로운 아이템 추가
  clearNewItems: () => void; // 새로운 아이템 삭제
}

// POS 스토어 생성
export const usePosStore = create<PosState>((set, get) => ({
  storeId: null,
  tableName: null,
  orderMenuId: null,

  placeId: null,
  orderId: null,

  categories: [],
  menuCache: {},
  currentMenus: [],

  selectedItems: [],
  isLoading: false,

  setStoreId: (id) => set({ storeId: id }), // 매장 ID 설정
  setTableName: (name) => set({ tableName: name }), // 테이블 이름 설정

  setPlaceId: (id) => set({ placeId: id }), // 장소 ID 설정
  setOrderId: (id) => set({ orderId: id }), // 주문 ID 설정
  setorderMenuId: (id) => set({ orderMenuId: id }), // 주문 메뉴 ID 설정 (수정: orderId -> orderMenuId)

  setSelectedItems: (items) => set({ selectedItems: items }), // 선택된 아이템 설정

  fetchCategories: async (storeId: number) => {
    // 카테고리 목록을 비동기적으로 가져옴
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get(`/api/categories/all/${storeId}`);
      set({ categories: data, isLoading: false });
    } catch (err) {
      console.error("fetchCategories 오류:", err);
      set({
        categories: [{ categoryId: -1, categoryName: "unconnected" }],
        isLoading: false,
      });
    }
  },

  fetchMenusByCategory: async (
    categoryId: number,
    forceReload: boolean = false
  ) => {
    // 카테고리별 메뉴를 비동기적으로 가져옴
    set({ isLoading: true });
    const { menuCache } = get();
    console.debug(
      "[fetchMenusByCategory] categoryId:",
      categoryId,
      "forceReload:",
      forceReload
    );
    if (!forceReload && menuCache[categoryId]) {
      console.debug("[fetchMenusByCategory] 캐시 사용:", menuCache[categoryId]);
      set({ currentMenus: menuCache[categoryId], isLoading: false });
      return;
    }
    try {
      const { data } = await axiosInstance.get(`/api/menus/all/${categoryId}`);
      console.debug("[fetchMenusByCategory] API 응답 데이터:", data);
      // API 응답에서 menuId가 없으면 menu.id를 대신 사용하도록 변환
      const transformed = data.map((menu: any) => {
        const finalId = menu.menuId ?? menu.id ?? null;
        console.debug(
          `[fetchMenusByCategory] menuName=${menu.menuName}, menu.menuId=${menu.menuId}, menu.id=${menu.id}, 최종 menuId=${finalId}`
        );
        return {
          ...menu,
          menuId: finalId,
        };
      });
      console.debug("[fetchMenusByCategory] 변환된 데이터:", transformed);
      set((state) => ({
        menuCache: { ...state.menuCache, [categoryId]: transformed },
        currentMenus: transformed,
        isLoading: false,
      }));
    } catch (err) {
      console.error("fetchMenusByCategory 오류:", err);
      set({
        currentMenus: [
          {
            menuId: -1,
            uiId: 0,
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
    // 미결제 주문을 장소 ID로 가져옴
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get(`/api/orders/places/${placeId}`);
      if (data && data.orderStatus === "UNPAID") {
        const selectedItems = data.menuDetail.map((menu: any) => {
          let menuId = menu.menuId ?? menu.id ?? null;
          if (menuId == null) {
            // menuCache에서 모든 메뉴를 검색
            const allMenus = Object.values(get().menuCache).flat();
            const found = allMenus.find((m) => m.menuName === menu.menuName);
            if (found) {
              menuId = found.menuId;
              console.debug(`[fetchUnpaidOrderByPlace] Found menuId ${menuId} for ${menu.menuName} in menuCache`);
            } else {
              console.warn(`[fetchUnpaidOrderByPlace] Menu ID not found for ${menu.menuName} in menuCache`);
            }
          }
          return {
            menuName: menu.menuName,
            price: menu.totalPrice / menu.totalCount,
            quantity: menu.totalCount,
            menuId: menuId ?? null, // menuId가 없으면 null로 유지
          };
        });
        console.debug("[fetchUnpaidOrderByPlace] 선택된 메뉴:", selectedItems);
        set({
          orderId: data.orderId,
          selectedItems,
          placeId,
          tableName: data.placeName, // 좌측 주문내역 클릭 시 daily 정보에서 placeName을 가져옴
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
      console.error("fetchUnpaidOrderByPlace 오류:", err);
      set({
        orderId: null,
        selectedItems: [],
        placeId,
        isLoading: false,
      });
    }
  },

  invalidateMenuCache: (categoryId: number) => {
    // 캐시 무효화 액션 (특정 카테고리의 캐시 제거)
    set((state) => {
      const newCache = { ...state.menuCache };
      delete newCache[categoryId];
      return { menuCache: newCache };
    });
  },

  addItem: (menuName, price, menuId) => {
    // 메뉴 아이템 추가
    if (menuId === undefined || menuId === null) {
      console.error("[addItem] 메뉴 ID가 누락되었습니다:", menuName);
      return; // menuId 없으면 저장하지 않음
    }
    console.debug("[addItem] 메뉴 추가:", { menuName, price, menuId });
    const existingItem = get().selectedItems.find((item) => item.menuId === menuId);
    if (existingItem) {
      set({
        selectedItems: get().selectedItems.map((item) =>
          item.menuId === menuId ? { ...item, quantity: item.quantity + 1 } : item
        ),
      });
    } else {
      set({
        selectedItems: [...get().selectedItems, { menuName, price, quantity: 1, menuId }],
      });
    }
  },

  removeItem: (menuName: string) => {
    // 메뉴 아이템 제거
    const { selectedItems } = get();
    set({
      selectedItems: selectedItems.filter((item) => item.menuName !== menuName),
    });
  },

  clearItems: () => set({ selectedItems: [] }), // 선택된 아이템 전체 삭제

  resetData: () => {
    // 모든 데이터 초기화
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

// 새로운 스토어 생성
export const useNewStore = create<NewStoreState>((set, get) => ({
  newStoreId: null,
  newTableName: null,
  newSelectedItems: [],

  setNewStoreId: (id:any) => set({ newStoreId: id }), // 새로운 매장 ID 설정
  setNewTableName: (name:any) => set({ newTableName: name }), // 새로운 테이블 이름 설정

  addNewItem: (item) => {
    // 새로운 아이템 추가 (SelectedItem 타입 사용)
    set((state) => ({
      newSelectedItems: [...state.newSelectedItems, item],
    }));
  },

  clearNewItems: () => set({ newSelectedItems: [] }), // 새로운 아이템 전체 삭제
}));