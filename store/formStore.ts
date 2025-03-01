// stores/formStore.ts
import { create } from "zustand";

interface FormState {
  storeName: string;
  storePlace: string;
  password: string;
  phoneNumber: string;
  setStoreName: (name: string) => void;
  setStorePlace: (place: string) => void;
  setPassword: (password: string) => void;
  setPhoneNumber: (phone: string) => void;
}

export const useFormStore = create<FormState>((set) => ({
  storeName: "",
  storePlace: "",
  password: "",
  phoneNumber: "",
  setStoreName: (name) => set({ storeName: name }),
  setStorePlace: (place) => set({ storePlace: place }),
  setPassword: (password) => set({ password }),
  setPhoneNumber: (phone) => set({ phoneNumber: phone }),
}));
