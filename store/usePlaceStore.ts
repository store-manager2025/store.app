// store/usePlaceStore.ts
"use client";
import { create } from "zustand";
import axiosInstance from "@/lib/axiosInstance";

export interface Place {
  placeId?: number;
  placeName: string;
  uiId?: number;
  positionX?: number;
  positionY?: number;
  sizeType?: string | null;
}

interface PlaceState {
  storeId: number | null;
  places: (Place | null)[];
  isLoading: boolean;

  setStoreId: (id: number | null) => void;
  fetchPlaces: (storeId: number) => Promise<void>;
  createPlace: (storeId: number, placeName: string, positionX: number, positionY: number) => Promise<void>;
  deletePlace: (placeId: number) => Promise<void>;
  updatePlace: (payload: { placeId: number, placeName: string, sizeType?: string }) => Promise<void>;
}

const SEAT_CAPACITY = 66;

export const usePlaceStore = create<PlaceState>((set, get) => ({
  storeId: null,
  places: Array(SEAT_CAPACITY).fill(null),
  isLoading: false,

  setStoreId: (id) => set({ storeId: id }),

  fetchPlaces: async (storeId: number) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get(`/api/places/all/${storeId}`);
      const seatArray: (Place | null)[] = Array(SEAT_CAPACITY).fill(null);
      data.forEach((place: Place) => {
        if (place.positionX !== undefined && place.positionY !== undefined) {
          const idx = place.positionY * 11 + place.positionX;
          seatArray[idx] = place;
        }
      });
      set({ places: seatArray, isLoading: false });
    } catch (err) {
      console.error("fetchPlaces error:", err);
      set({ isLoading: false });
    }
  },

  createPlace: async (storeId: number, placeName: string, positionX: number, positionY: number) => {
    set({ isLoading: true });
    try {
      const body = { storeId, placeName, positionX, positionY };
      await axiosInstance.post("/api/places", body);
      await get().fetchPlaces(storeId);
    } catch (err) {
      console.error("createPlace error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  deletePlace: async (placeId: number) => {
    const storeId = get().storeId;
    if (!storeId) return;
    set({ isLoading: true });
    try {
      await axiosInstance.delete(`/api/places/${placeId}`);
      await get().fetchPlaces(storeId);
    } catch (err) {
      console.error("deletePlace error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  updatePlace: async (payload) => {
    const storeId = get().storeId;
    if (!storeId) return;
    set({ isLoading: true });
    try {
      await axiosInstance.patch("/api/places", payload);
      await get().fetchPlaces(storeId);
    } catch (err) {
      console.error("updatePlace error:", err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
