// stores/formStore.ts
import { create } from "zustand";

interface FormState {
  storeName: string;
  storePlace: string;
  password: string;
  setStoreName: (name: string) => void;
  setStorePlace: (place: string) => void;
  setPassword: (password: string) => void;
}

export const useFormStore = create<FormState>((set) => ({
  storeName: "",
  storePlace: "",
  password: "",
  setStoreName: (name: string) => set({ storeName: name }),
  setStorePlace: (place: string) => set({ storePlace: place }),
  setPassword: (password: string) => set({ password }),
}));
