"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AddCategoryModal from "../../components/AddCategoryModal";
import ModifyCategoryModal from "../../components/ModifyCategoryModal";

export default function EditCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");

  const [categories, setCategories] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 토큰 가져오기
  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (!storedToken) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      router.push("/");
    } else {
      setToken(storedToken);
    }
  }, [router]);

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    if (!storeId || !token) return;
    try {
      const res = await fetch(`/api/categories/all/${storeId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // 🔥 토큰 추가
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Fail to fetch categories");
      }
      const data = await res.json();
      setCategories(data);
    } catch (error: any) {
      console.error(error.message);
      alert(error.message);
    }
  };

  useEffect(() => {
    if (!storeId) {
      alert("유효하지 않은 Store ID입니다.");
      router.push("/");
    } else {
      fetchCategories();
    }
  }, [storeId, token]);

  const openAddModal = () => {
    if (categories.length >= 8) {
      alert("카테고리는 최대 8개까지만 추가할 수 있습니다.");
      return;
    }
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const openModifyModal = (category: any) => {
    setSelectedCategory(category);
    setIsModifyModalOpen(true);
  };

  const closeModifyModal = () => {
    setIsModifyModalOpen(false);
    setSelectedCategory(null);
  };

  // 새 카테고리 등록
  const handleAddCategory = async (name: string, color: string) => {
    if (!storeId || !token) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // 🔥 토큰 추가
        },
        body: JSON.stringify({
          storeId: Number(storeId),
          categoryName: name,
          colorCode: color,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Fail to create category");
      }
      alert("카테고리가 생성되었습니다.");
      closeAddModal();
      fetchCategories();
    } catch (error: any) {
      console.error(error.message);
      alert(error.message);
    }
  };

  // 카테고리 수정
  const handleModifyCategory = async (id: number, uiId: number, name: string, color: string) => {
    if (!token) return;
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // 🔥 토큰 추가
        },
        body: JSON.stringify({
          categoryId: id,
          uiId: uiId,
          categoryName: name,
          colorCode: color,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Fail to modify category");
      }
      alert("카테고리가 수정되었습니다.");
      closeModifyModal();
      fetchCategories();
    } catch (error: any) {
      console.error(error.message);
      alert(error.message);
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = async (id: number) => {
    if (!token) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // 🔥 토큰 추가
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Fail to delete category");
      }
      alert("카테고리가 삭제되었습니다.");
      closeModifyModal();
      fetchCategories();
    } catch (error: any) {
      console.error(error.message);
      alert(error.message);
    }
  };

  // “Save” 버튼 클릭 시 동작 (필요에 맞춰 수정)
  const handleSave = () => {
    alert("카테고리 설정을 저장했습니다.");
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <div className="bg-white bg-opacity-20 border border-gray-400 rounded-2xl p-6 flex flex-col items-center w-3/5">
        <h2 className="text-2xl font-bold mb-8">Edit Categories</h2>

        {/* 카테고리 리스트 */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          {categories.map((cat) => (
            <div
              key={cat.categoryId}
              onClick={() => openModifyModal(cat)}
              className="px-4 py-2 cursor-pointer border border-gray-400 hover:bg-gray-200 rounded-lg"
              style={{ backgroundColor: cat.categoryStyle?.colorCode || "#eee" }}
            >
              {cat.categoryName}
            </div>
          ))}
        </div>

        {/* 하단 버튼들 */}
        <div className="flex space-x-4">
          <button
            onClick={openAddModal}
            className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Add
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Save
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <AddCategoryModal
          isOpen={isAddModalOpen}
          onClose={closeAddModal}
          onSubmit={handleAddCategory}
        />
      )}

      {/* Modify Modal */}
      {isModifyModalOpen && selectedCategory && (
        <ModifyCategoryModal
          isOpen={isModifyModalOpen}
          onClose={closeModifyModal}
          category={selectedCategory}
          onModify={handleModifyCategory}
          onDelete={handleDeleteCategory}
        />
      )}
    </div>
  );
}
