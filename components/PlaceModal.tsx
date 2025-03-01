"use client";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { usePosStore, SelectedItem } from "../store/usePosStore"; // SelectedItem 임포트

interface Place {
  placeId?: number;
  placeName: string;
  uiId?: number;
  sizeType?: string | null;
  positionX?: number;
  positionY?: number;
}

interface PlaceModalProps {
  onClose: () => void;
  onPlaceSelected: (
    placeName: string,
    placeId: number,
    orderId?: number,
    orderMenus?: SelectedItem[]
  ) => void;
}

export default function PlaceModal({ onClose, onPlaceSelected }: PlaceModalProps) {
  const { menuCache, fetchUnpaidOrderByPlace } = usePosStore();
  const [storeId, setStoreId] = useState<number | null>(null);
  const cols = 11;
  const rows = 9;
  const seatCount = cols * rows;
  const [places, setPlaces] = useState<(Place | null)[]>(() => Array(seatCount).fill(null));
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [newPlaceName, setNewPlaceName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("currentStoreId");
    if (saved) {
      setStoreId(Number(saved));
    }
  }, []);

  useEffect(() => {
    if (storeId) {
      fetchPlaces(storeId);
    }
  }, [storeId]);

  const fetchPlaces = async (id: number) => {
    try {
      const { data } = await axiosInstance.get(`/api/places/all/${id}`);
      const arrayOfPlaces: (Place | null)[] = Array(seatCount).fill(null);

      data.forEach((pl: any) => {
        const { positionX, positionY, placeId, placeName, sizeType } = pl;
        if (positionX !== undefined && positionY !== undefined) {
          const uiId = positionY * cols + positionX;
          arrayOfPlaces[uiId] = { placeId, placeName, uiId, sizeType, positionX, positionY };
        }
      });
      setPlaces(arrayOfPlaces);
    } catch (err) {
      console.error("fetchPlaces error:", err);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditingCell(null);
    setNewPlaceName("");
  };

  const handleSave = () => {
    setIsEditMode(false);
    setEditingCell(null);
    setNewPlaceName("");
    if (storeId) {
      fetchPlaces(storeId);
    }
  };

  const handleEdit = () => {
    setIsEditMode((prev) => !prev);
    setEditingCell(null);
    setNewPlaceName("");
  };

  const handleCloseButton = () => {
    onClose();
  };

  const handleEmptyCellClick = (row: number, col: number) => {
    if (!isEditMode) return;
    if (editingCell && editingCell.row === row && editingCell.col === col) {
      setEditingCell(null);
    } else {
      setEditingCell({ row, col });
    }
  };

  const handleConfirmNewPlace = async () => {
    if (!storeId || !editingCell || !newPlaceName.trim()) return;

    const { row, col } = editingCell;
    const uiIndex = row * cols + col;

    try {
      const body = { storeId, placeName: newPlaceName, positionX: col, positionY: row, uiId: uiIndex };
      await axiosInstance.post("/api/places", body);
      console.log("좌석 생성 성공");
      setEditingCell(null);
      setNewPlaceName("");
      fetchPlaces(storeId);
    } catch (err) {
      console.error("좌석 생성 실패:", err);
    }
  };

  const handlePlaceClick = async (place: Place) => {
    if (isEditMode || !place.placeId) return;

    try {
      const { data } = await axiosInstance.get(`/api/orders/places/${place.placeId}`);
      const unpaidOrderId = data?.orderId || null;

      const orderMenus = data?.menuDetail.map((menu: any) => {
        let menuId = menu.menuId ?? null;
        if (!menuId && menu.menuName) {
          const allMenus = Object.values(menuCache).flat();
          const found = allMenus.find((m) => m.menuName === menu.menuName);
          if (found) {
            menuId = found.menuId;
          } else {
            console.warn(`Menu ID not found for ${menu.menuName}`);
          }
        }
        return {
          menuName: menu.menuName,
          price: menu.totalPrice / menu.totalCount,
          quantity: menu.totalCount,
          menuId,
        };
      }) || [];

      onPlaceSelected(place.placeName, place.placeId, unpaidOrderId, orderMenus);
    } catch (err) {
      console.error("미결제 주문 조회 실패:", err);
      onPlaceSelected(place.placeName, place.placeId);
    }
  };

  const handleDeletePlace = async (place: Place) => {
    if (!storeId || !place.placeId) return;
    try {
      await axiosInstance.delete(`/api/places/${place.placeId}`);
      console.log("좌석 삭제 완료");
      fetchPlaces(storeId);
    } catch (err) {
      console.error("좌석 삭제 실패:", err);
    }
  };

  const renderSeat = (row: number, col: number) => {
    const idx = row * cols + col;
    const seat = places[idx];

    if (!seat) {
      return (
        <button
          onClick={() => handleEmptyCellClick(row, col)}
          className={`w-full h-full ${isEditMode ? "bg-gray-300 cursor-pointer" : "bg-white pointer-events-none"}`}
        >
          {isEditMode && <span className="text-xs text-gray-600">+</span>}
        </button>
      );
    } else {
      return (
        <button
          onClick={() => handlePlaceClick(seat)}
          onDoubleClick={() => isEditMode && handleDeletePlace(seat)}
          className="w-full h-full bg-gray-100 flex items-center justify-center rounded"
        >
          {seat.placeName}
        </button>
      );
    }
  };

  return (
    <div
      className="fixed rounded-lg inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative rounded-lg w-[800px] h-[600px] bg-white shadow">
        <div className="relative rounded-t-md h-8 bg-gradient-to-b from-[#2674EC] to-[#0252CB] flex items-center px-3">
          <span className="text-white font-bold">Select Table</span>
          <div className="absolute rounded-lg right-2 top-0 bottom-0 flex items-center space-x-2 text-sm">
            {isEditMode && (
              <button
                onClick={handleSave}
                className="px-3 py-0.5 bg-gray-100 font-semibold hover:bg-gray-200 border text-black rounded-sm"
              >
                Save
              </button>
            )}
            <button
              onClick={handleEdit}
              className="px-2 py-0.5 bg-gray-100 font-semibold hover:bg-gray-300 border text-black rounded-sm"
            >
              Edit
            </button>
            <button
              onClick={handleCloseButton}
              className="px-1.5 py-0.5 bg-[#C72121] text-[1.4rem] text-white rounded-sm"
            >
              ✕
            </button>
          </div>
        </div>
        {editingCell && (
          <div className="absolute h-[35px] w-full flex items-center px-2 py-1 bg-gray-200">
            <input
              className="flex-1 h-full px-2 text-md"
              placeholder="Enter table name"
              value={newPlaceName}
              onChange={(e) => setNewPlaceName(e.target.value)}
            />
            <button
              onClick={handleConfirmNewPlace}
              className="ml-2 rounded px-3 py-0.5 bg-blue-500 text-white text-sm"
            >
              ✓
            </button>
          </div>
        )}
        <div className="w-full h-[calc(100%-3.5rem)] p-3 mt-5 overflow-auto">
          <div className="grid grid-cols-11 grid-rows-9 gap-1 w-full h-full">
            {Array.from({ length: rows }).map((_, rowIdx) =>
              Array.from({ length: cols }).map((_, colIdx) => (
                <div key={`${rowIdx}-${colIdx}`} className="w-full h-[55px]">
                  {renderSeat(rowIdx, colIdx)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}