// components/PlaceModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

interface Place {
  placeId?: number;
  placeName: string;
  uiId?: number;
  sizeType?: string | null;
}

/** Props */
interface PlaceModalProps {
  onClose: () => void;               // 모달 닫기
  onPlaceSelected: (placeName: string) => void; // 좌석 선택 시 PosPage로 전달
}

export default function PlaceModal({ onClose, onPlaceSelected }: PlaceModalProps) {
  const [storeId, setStoreId] = useState<number | null>(null);
  const [places, setPlaces] = useState<(Place | null)[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newPlaceName, setNewPlaceName] = useState("");

  // 11열 x 6행 = 66칸
  const cols = 11;
  const rows = 6;

  // 1) storeId 로딩
  useEffect(() => {
    const savedStoreId = localStorage.getItem("currentStoreId");
    if (savedStoreId) {
      setStoreId(Number(savedStoreId));
    }
  }, []);

  // 2) storeId 있으면 좌석 목록 불러오기
  useEffect(() => {
    if (storeId) {
      fetchPlaces(storeId);
    }
  }, [storeId]);

  const fetchPlaces = async (targetStoreId: number) => {
    try {
      const { data } = await axiosInstance.get(`/api/places/all/${targetStoreId}`);
      // data: Place[]  (length <= 66개 가정)
      // 66칸짜리 배열을 만들어서 인덱스로 대응
      const arrayOfPlaces: (Place | null)[] = Array(cols * rows).fill(null);

      // data를 인덱스에 매핑 (uiId나 placeId 순서로 배치 가능)
      // 예: uiId를 0~65 범위라고 가정하면 -> arrayOfPlaces[uiId] = place
      data.forEach((place: any) => {
        const uiId = place.uiId; // grid index
        if (uiId >= 0 && uiId < cols * rows) {
          arrayOfPlaces[uiId] = {
            placeId: place.placeId,
            placeName: place.placeName,
            uiId: place.uiId,
            sizeType: place.sizeType,
          };
        }
      });

      setPlaces(arrayOfPlaces);
    } catch (err) {
      console.error("좌석 목록 조회 실패:", err);
      alert("좌석 목록 조회 실패");
    }
  };

  // XP 스타일 툴바 "Cancel", "Save", "Edit", "X" 버튼
  const handleCancel = () => {
    // editMode 취소
    setIsEditMode(false);
    setEditingIndex(null);
    setNewPlaceName("");
  };

  const handleSave = async () => {
    // editMode -> 저장 (새로 추가된 좌석 or 수정된 좌석)
    // 여기에 특별한 로직이 필요하다면 구현
    // 현재는 실시간으로 서버 요청 -> Patch or Post를 해도 됨
    setIsEditMode(false);
    setEditingIndex(null);
    setNewPlaceName("");
    // TODO: 재로드 or places 상태 업데이트
    if (storeId) {
      fetchPlaces(storeId);
    }
  };

  const handleEdit = () => {
    setIsEditMode((prev) => !prev);
    setEditingIndex(null);
    setNewPlaceName("");
  };

  // XP 스타일 "X" 버튼
  const handleCloseButton = () => {
    onClose();
  };

  // 빈칸 클릭 -> 새 좌석 만들기
  // isEditMode 상태에서만 가능
  const handleEmptyClick = (idx: number) => {
    if (!isEditMode) return;
    // 인풋창 표시
    setEditingIndex(idx);
    setNewPlaceName("");
  };

  // 인풋창 체크 버튼 -> 좌석 이름 추가
  const handleConfirmNewPlace = async () => {
    if (!newPlaceName.trim()) {
      alert("테이블 명은 공백일 수 없습니다.");
      return;
    }
    if (editingIndex === null) return;

    try {
      // POST /api/places (storeId, placeName)
      const bodyData = {
        storeId: storeId,
        placeName: newPlaceName,
      };
      const { data } = await axiosInstance.post("/api/places", bodyData);
      console.log("생성 응답:", data);

      // uiId를 어떻게 결정하느냐? -> 새로 생성된 place에 uiId를 서버가 할당해야함
      // 보통 서버에서 POST 처리 시 ui_layout 만들어서 uiId 반환
      // 여기서는 단순히 재조회
      setEditingIndex(null);
      setNewPlaceName("");
      if (storeId) {
        fetchPlaces(storeId);
      }
    } catch (err) {
      console.error("좌석 생성 실패:", err);
      alert("좌석 생성 실패");
    }
  };

  // 버튼 (이미 존재하는 좌석) 클릭
  const handlePlaceClick = (idx: number) => {
    // isEditMode = true && 더블클릭 -> 삭제
    const place = places[idx];
    if (!place) return;

    if (!isEditMode) {
      // 편집 모드 아닐 때 -> 좌석 선택
      onPlaceSelected(place.placeName);
    } else {
      // 편집 모드 -> 더블클릭 시 삭제
      // 여기서는 onDoubleClick 대신, 한 번 더 클릭?
      // 편의상 alert로 안내 or 실제론 onDoubleClick 이벤트
      alert("이 좌석을 삭제하려면 더블클릭 해주세요.");
    }
  };

  // 자리 삭제
  const handlePlaceDelete = async (idx: number) => {
    const place = places[idx];
    if (!place || !place.placeId) return;
    try {
      await axiosInstance.delete(`/api/places/${place.placeId}`);
      alert("좌석이 삭제되었습니다.");
      if (storeId) {
        fetchPlaces(storeId);
      }
    } catch (err) {
      console.error("좌석 삭제 실패:", err);
      alert("좌석 삭제 실패");
    }
  };

  // render seat button
  const renderSeatButton = (idx: number) => {
    const place = places[idx];
    if (!place) {
      // 빈칸
      if (editingIndex === idx) {
        // 인풋창 표시
        return (
          <div className="relative w-full h-full flex items-center justify-center bg-gray-200">
            <input
              className="absolute top-0 left-0 right-6 bottom-0 px-2"
              value={newPlaceName}
              onChange={(e) => setNewPlaceName(e.target.value)}
            />
            <button
              className="absolute right-0 px-2 py-1 bg-blue-500 text-white"
              onClick={handleConfirmNewPlace}
            >
              ✓
            </button>
          </div>
        );
      } else {
        // 그냥 빈칸
        return (
          <button
            onClick={() => handleEmptyClick(idx)}
            className="w-full h-full bg-white"
          />
        );
      }
    } else {
      // 존재하는 좌석
      return (
        <button
          onClick={() => handlePlaceClick(idx)}
          onDoubleClick={() => {
            if (isEditMode) handlePlaceDelete(idx);
          }}
          className="w-full h-full bg-gray-100 flex items-center justify-center rounded"
        >
          {place.placeName}
        </button>
      );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      {/* 모달 컨테이너 */}
      <div className="relative w-[600px] h-[500px] bg-white shadow-lg rounded-md overflow-hidden">
        {/* XP 스타일 상단 툴바 */}
        <div className="relative h-10 bg-gradient-to-b from-[#2674EC] to-[#0252CB] flex items-center px-3">
          <span className="text-white font-bold select-none">Select Table</span>

          {/* 우측 버튼들 (XP 스타일) */}
          <div className="absolute right-2 top-0 bottom-0 flex items-center space-x-2 text-sm pt-[2px]">
            {isEditMode && (
              <button
                onClick={handleCancel}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 border text-black rounded-sm"
              >
                Cancel
              </button>
            )}
            {isEditMode && (
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border text-black rounded-sm"
              >
                Save
              </button>
            )}
            <button
              onClick={handleEdit}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 border text-black rounded-sm"
            >
              Edit
            </button>
            <button
              onClick={handleCloseButton}
              className="px-3 py-1 bg-[#C72121] text-white rounded-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 모달 본문 */}
        <div className="w-full h-full p-4 overflow-auto">
          {/* 11 x 6 그리드 */}
          <div className="grid grid-cols-11 grid-rows-6 gap-2 w-full h-full">
            {Array.from({ length: rows }).map((_, rowIdx) =>
              Array.from({ length: cols }).map((_, colIdx) => {
                const index = rowIdx * cols + colIdx;
                return (
                  <div key={index} className="w-full h-[50px]">
                    {renderSeatButton(index)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
