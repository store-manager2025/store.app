"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { usePosStore } from "../../store/usePosStore";
import CategoryButton from "../../components/CategoryButton";
import MenuButton from "../../components/PosMenuButton";
import SelectedMenuList from "../../components/SelectedMenuList";
import PlaceModal from "../../components/PlaceModal";

interface SelectedItem {
  menuName: string;
  price: number;
  quantity: number;
  menuId: number;
}

export default function PosPage() {
  const router = useRouter();

  const {
    storeId,
    tableName,
    setPlaceId,
    categories,
    currentMenus,
    isLoading,
    setStoreId,
    setOrderId,
    setSelectedItems,
    setTableName,
    fetchCategories,
    fetchMenusByCategory,
    addItem,
    selectedItems,
    orderId,
    placeId,
    fetchUnpaidOrderByPlace,
    menuCache,
  } = usePosStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);

  // 초기 storeId 및 tableName 설정
  useEffect(() => {
    const savedStoreId = localStorage.getItem("currentStoreId");
    if (savedStoreId) {
      setStoreId(Number(savedStoreId));
    } else {
      setStoreId(null);
    }
    setTableName("");
  }, [setStoreId, setTableName]);

  // storeId가 설정되면 카테고리 로드
  useEffect(() => {
    if (storeId) {
      fetchCategories(storeId);
    }
  }, [storeId, fetchCategories]);

  // 카테고리가 로드되면 첫 번째 카테고리 선택 및 메뉴 로드
  useEffect(() => {
    if (storeId && categories.length > 0) {
      const firstCategoryId = categories[0].categoryId;
      console.log("Categories loaded, setting default category:", firstCategoryId);
      setSelectedCategoryId(firstCategoryId);

      // menuCache에 데이터가 있으면 즉시 currentMenus 설정
      if (menuCache[firstCategoryId]) {
        console.log("Using cached menus for category:", firstCategoryId, menuCache[firstCategoryId]);
        usePosStore.setState({ currentMenus: menuCache[firstCategoryId] });
      } else {
        console.log("Fetching menus for default category:", firstCategoryId);
        fetchMenusByCategory(firstCategoryId);
      }

      // 모든 카테고리 메뉴 사전 로드 (옵션)
      categories.forEach((cat) => {
        if (!menuCache[cat.categoryId]) {
          fetchMenusByCategory(cat.categoryId);
        }
      });
    }
  }, [storeId, categories, fetchMenusByCategory, menuCache]);

  // selectedCategoryId 변경 시 currentMenus 업데이트
  useEffect(() => {
    if (selectedCategoryId) {
      console.log("Selected category changed:", selectedCategoryId);
      if (menuCache[selectedCategoryId]) {
        console.log("Updating currentMenus from cache:", menuCache[selectedCategoryId]);
        usePosStore.setState({ currentMenus: menuCache[selectedCategoryId] });
      } else {
        console.log("Fetching menus for category:", selectedCategoryId);
        fetchMenusByCategory(selectedCategoryId);
      }
    }
  }, [selectedCategoryId, menuCache, fetchMenusByCategory]);

  useEffect(() => {
    if (storeId && categories.length > 0) {
      const firstCategoryId = categories[0].categoryId;
      setSelectedCategoryId(firstCategoryId);
      fetchMenusByCategory(firstCategoryId, true); // forceReload=true로 강제 호출
      categories.forEach((cat) => fetchMenusByCategory(cat.categoryId));
    }
  }, [storeId, categories, fetchMenusByCategory]);

  const handleCategoryClick = (catId: number) => {
    setSelectedCategoryId(catId);
  };

  const handleMenuClick = (menuName: string, price: number, menuId: number) => {
    addItem(menuName, price, menuId);
  };

  const handleTableClick = () => {
    setShowPlaceModal(true);
  };

  const handleCloseModal = () => {
    setShowPlaceModal(false);
  };

  const handlePlaceSelected = (
    placeName: string,
    selectedPlaceId: number,
    orderIdFromApi?: number,
    orderMenus?: SelectedItem[]
  ) => {
    setTableName(placeName);
    setPlaceId(selectedPlaceId);
    if (orderIdFromApi && orderIdFromApi > 0) {
      setOrderId(orderIdFromApi);
      setSelectedItems(orderMenus || []);
    } else {
      setOrderId(null);
      setSelectedItems([]);
    }
    setShowPlaceModal(false);
  };

  const renderGrid = () => {
    const rows = 4;
    const cols = 5;

    return (
      <div className="grid grid-cols-5 grid-rows-4 flex-1">
        {Array.from({ length: rows }).map((_, rowIdx) =>
          Array.from({ length: cols }).map((_, colIdx) => {
            const cellMenus = currentMenus.filter(
              (m) =>
                m.menuStyle.positionX === colIdx &&
                m.menuStyle.positionY === rowIdx
            );

            if (cellMenus.length === 0) {
              return <div key={`${rowIdx}-${colIdx}`} className="bg-white" />;
            }

            const fullItem = cellMenus.find((m) => m.menuStyle.sizeType === "FULL");
            if (fullItem) {
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className="flex items-center justify-center"
                  style={{ backgroundColor: fullItem.menuStyle.colorCode }}
                >
                  <MenuButton
                    menuName={fullItem.menuName}
                    price={fullItem.price}
                    color={fullItem.menuStyle.colorCode}
                    onClick={() =>
                      handleMenuClick(fullItem.menuName, fullItem.price, fullItem.menuId)
                    }
                  />
                </div>
              );
            }

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className="flex flex-col w-full h-full"
              >
                {cellMenus.map((item) => (
                  <div
                    key={item.menuId}
                    className="flex-1 flex items-center justify-center"
                    style={{ backgroundColor: item.menuStyle.colorCode }}
                  >
                    <MenuButton
                      menuName={item.menuName}
                      price={item.price}
                      color={item.menuStyle.colorCode}
                      onClick={() =>
                        handleMenuClick(item.menuName, item.price, item.menuId)
                      }
                    />
                  </div>
                ))}
                {cellMenus.length === 1 && (
                  <div className="flex-1 flex items-center justify-center bg-white"></div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="relative w-full h-10 border-b-2 border-gray-300 bg-white">
        <div className="absolute bottom-[-4px] h-full flex items-center">
          {categories.map((cat) => (
            <CategoryButton
              key={cat.categoryId}
              categoryName={cat.categoryName}
              style={{ backgroundColor: cat.categoryStyle?.colorCode || "#f0f0f0" }}
              selected={cat.categoryId === selectedCategoryId}
              onClick={() => handleCategoryClick(cat.categoryId)}
            />
          ))}
        </div>
        <div className="absolute font-mono top-0 left-1/2 -translate-x-1/2 h-full flex items-center">
          <button
            onClick={handleTableClick}
            className="py-2 px-6 text-sm font-medium hover:bg-gray-100 transition"
          >
            {tableName || "Select Table"}
          </button>
        </div>
        <div className="absolute right-2 top-0 h-full flex items-center">
          <button
            onClick={() => router.push("/setting")}
            className="text-gray-500 hover:text-gray-900 transition"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 font-mono overflow-hidden">
        <div className="flex flex-col w-[70%] overflow-auto">
          {isLoading ? (
            <div className="text-center text-gray-400 py-2">Loading...</div>
          ) : currentMenus.length === 0 ? (
            <div className="text-center text-gray-400 py-2">No menus available</div>
          ) : (
            renderGrid()
          )}
        </div>
        <div className="flex flex-col w-[30%] border-l-2 border-gray-300 overflow-hidden">
          <SelectedMenuList />
        </div>

        {showPlaceModal && (
          <PlaceModal
            onClose={handleCloseModal}
            onPlaceSelected={handlePlaceSelected}
          />
        )}
      </div>
    </div>
  );
}