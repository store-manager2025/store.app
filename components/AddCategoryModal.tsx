"use client";
import React, { useState } from "react";

type AddCategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: string) => void;
};

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSubmit,
}: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim() || !color.trim()) {
      alert("Name과 Color는 필수입니다.");
      return;
    }
    onSubmit(name, color);
  };

  return (
    <div className="fixed inset-0 bg-gray-700 bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 min-w-[300px]">
        <h3 className="text-xl font-bold mb-4">Add New Category</h3>
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
        <div className="flex justify-end space-x-2">
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
        </div>
      </div>
    </div>
  );
}
