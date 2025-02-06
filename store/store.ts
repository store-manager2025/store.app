'use client';

import {create} from 'zustand';

interface ZoomState {
  isZoomMode: boolean;
  setZoomMode: (mode: boolean) => void;
}

const useZoomStore = create<ZoomState>((set) => ({
  isZoomMode: false,
  setZoomMode: (mode) => set({ isZoomMode: mode }),
}));

export default useZoomStore;
