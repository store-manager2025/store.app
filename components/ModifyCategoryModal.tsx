"use client";
import React, { useState, useEffect } from "react";

type CategoryType = {
  categoryId: number;
  uiId: number;
  categoryName: string;
  categoryStyle?: {
    uiId?: number;
    colorCode?: string;
    // 기타 필요한 필드
  };
};

type ModifyCategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryType;
  onModify: (id: number, uiId: number, name: string, color: string) => void;
  onDelete: (id: number) => void;
};

export default function ModifyCategoryModal({
  isOpen,
  onClose,
  category,
  onModify,
  onDelete,
}: ModifyCategoryModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.categoryName);
      setColor(category.categoryStyle?.colorCode || "");
    }
  }, [category]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim() || !color.trim()) {
      alert("Name과 Color는 필수입니다.");
      return;
    }
    onModify(category.categoryId, category.uiId, name, color);
  };

  const handleDelete = () => {
    onDelete(category.categoryId);
  };

  return (
    <div className="fixed inset-0 bg-gray-700 bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 min-w-[300px]">
        <h3 className="text-xl font-bold mb-4">Modify Category</h3>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Name</label>
          <input
            type="text"
            className="border w-full px-2 py-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Color</label>
          <input
            type="text"
            className="border w-full px-2 py-1"
            placeholder="#FFFFFF"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
