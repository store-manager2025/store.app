"use client";
import { useEffect, useRef, useState } from "react";
import { QueryClient, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useFormStore } from "@/store/formStore";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CalculatorModal from "../../../components/CalculatorModal";
import { Archive, Search, CreditCard, Banknote } from "lucide-react";

const queryClient = new QueryClient();

const token =
  typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
if (token) {
  axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

interface OrderSummary {
  totalPrice: number;
  date: string;
}

interface Order {
  orderId: number;
  storeId: number;
  price: number;
  orderStatus: string;
  orderedAt: string;
  placeName: string;
  paymentType?: "CARD" | "CASH";
  paymentId?: number;
  menuDetail: {
    menuName: string;
    discountRate: number;
    totalPrice: number;
    totalCount: number;
  }[];
}

interface Receipt {
  storeName: string;
  businessNum: string;
  owner: string;
  phoneNumber: string;
  storePlace: string;
  orderId: number;
  receiptDate: string;
  placeName: string;
  joinNumber: string;
  totalAmount: number;
  createdAt: string;
  menuList: {
    orderMenuId: number;
    menuId: number;
    menuName: string;
    discountRate: number;
    totalPrice: number;
    totalCount: number;
  }[];
  cardInfoList: {
    paymentType: "CARD" | "CASH";
    cardCompany: string;
    cardNumber: string;
    inputMethod: string;
    approveDate: string;
    approveNumber: string;
    installmentPeriod: string;
    paidMoney: number;
  }[];
}

export default function OrderPage() {
  const router = useRouter();
  const {
    storeId,
    selectedOrderId,
    selectedDate,
    setSelectedOrder,
    setCalculatorModalOpen,
  } = useFormStore();

  const [placeName, setPlaceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [asciiReceipt, setAsciiReceipt] = useState<string>("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchResults, setSearchResults] = useState<OrderSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isMonthly, setIsMonthly] = useState(false);

  const { data: orderSummaries, isLoading: summariesLoading } = useQuery({
    queryKey: ["orderSummaries", storeId, isCancelled],
    queryFn: async () => {
      if (!storeId) return [];
      const status = isCancelled ? "cancelled" : "success";
      const response = await axiosInstance.get(
        `/api/reports/all/${storeId}?status=${status}`
      );
      console.log("Order Summaries:", response.data); // 디버깅 로그 추가
      return response.data || [];
    },
    enabled: !!storeId,
  });

  const sortedSummaries = (
    isSearching ? searchResults : orderSummaries || []
  ).sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const dateToFetch = sortedSummaries[currentDateIndex]?.date;

  const {
    data: ordersForDate,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: ordersLoading,
  } = useInfiniteQuery({
    queryKey: ["ordersForDate", storeId, dateToFetch, isSearching, isCancelled],
    queryFn: async ({ pageParam = 1 }) => {
      if (!storeId || !dateToFetch) return { orders: [], hasMore: false };
      const status = isCancelled ? "cancelled" : "success";
      const response = await axiosInstance.get(`/api/reports/daily`, {
        params: {
          storeId,
          date: dateToFetch,
          page: pageParam,
          size: 10,
          status,
        },
      });
      const orders = response.data || [];
      // 디버깅 로그 추가
      orders.forEach((order: Order) => {
        console.log(`Order ID: ${order.orderId}, Status: ${order.orderStatus}`);
      });
      return { date: dateToFetch, orders, hasMore: orders.length === 10 };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!storeId && !!dateToFetch,
  });

  const [allOrdersMap, setAllOrdersMap] = useState<{ [date: string]: Order[] }>(
    {}
  );

  // allOrdersMap 초기화 함수
  const resetOrdersMap = () => {
    setAllOrdersMap({});
  };

  const preloadAllOrders = async () => {
    if (!storeId || !sortedSummaries.length) return;
    for (const summary of sortedSummaries) {
      const date = summary.date;
      if (!allOrdersMap[date] || allOrdersMap[date].length === 0) {
        try {
          const status = isCancelled ? "cancelled" : "success";
          const response = await axiosInstance.get(`/api/reports/daily`, {
            params: { storeId, date, page: 1, size: 100, status }, // size를 늘려 모든 주문 가져오기
          });
          const orders = response.data || [];
          setAllOrdersMap((prev) => ({
            ...prev,
            [date]: orders,
          }));
        } catch (err) {
          console.error(`Failed to load orders for ${date}:`, err);
        }
      }
    }
  };

  useEffect(() => {
    if (ordersForDate) {
      const newOrders = ordersForDate.pages.flatMap((page) => page.orders);
      setAllOrdersMap((prev) => {
        const existingOrders = prev[dateToFetch] || [];
        const uniqueOrders = [
          ...existingOrders,
          ...newOrders.filter(
            (newOrder) =>
              !existingOrders.some(
                (existing) => existing.orderId === newOrder.orderId
              )
          ),
        ];
        return { ...prev, [dateToFetch]: uniqueOrders };
      });
    }
  }, [ordersForDate, dateToFetch]);

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          if (hasNextPage) {
            fetchNextPage();
          } else if (currentDateIndex < sortedSummaries.length - 1) {
            setCurrentDateIndex((prev) => prev + 1);
          }
        }
      },
      { threshold: 1.0 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    currentDateIndex,
    sortedSummaries.length,
  ]);

  useEffect(() => {
    if (sortedSummaries.length > 0) {
      preloadAllOrders(); // 모든 날짜의 주문을 미리 로드
    }
  }, [sortedSummaries, storeId, isCancelled]);

  useEffect(() => {
    if (selectedOrderId && selectedDate && allOrdersMap[selectedDate]) {
      const order = allOrdersMap[selectedDate].find(
        (o) => o.orderId === selectedOrderId
      );
      if (order) {
        setPlaceName(order.placeName || "Unknown");
        setLoadingReceipt(true);
        const fetchReceipt = async () => {
          try {
            const response = await axiosInstance.get(
              `/api/receipts/${order.orderId}`
            );
            setReceipt(response.data);
          } catch (err) {
            setReceipt(null);
          } finally {
            setLoadingReceipt(false);
          }
        };
        fetchReceipt();
      } else {
        setPlaceName("");
        setReceipt(null);
        setLoadingReceipt(false);
      }
    } else {
      setPlaceName("");
      setReceipt(null);
      setLoadingReceipt(false);
    }
  }, [selectedOrderId, selectedDate, allOrdersMap]);

  const formatDateLabel = (dateString: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(dateString);
    orderDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    return dateString;
  };

  const formatTime = (orderedAt: string): string => {
    const date = new Date(orderedAt);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "오후" : "오전";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${period} ${formattedHours}:${formattedMinutes}`;
  };

  const handleRefund = async () => {
    const selectedOrder = allOrdersMap[selectedDate]?.find(
      (o: Order) => o.orderId === selectedOrderId
    );
    if (!selectedOrder?.paymentId) {
      alert("결제 ID가 없습니다.");
      return;
    }
    try {
      await axiosInstance.post(`/api/pay/cancel/${selectedOrder.paymentId}`);
      alert("환불이 성공적으로 처리되었습니다.");
      setIsRefundModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["orderSummaries", storeId] });
    } catch (err) {
      alert("환불 처리 중 오류가 발생했습니다.");
    }
  };

  const handlePrint = async () => {
    const selectedOrder = allOrdersMap[selectedDate]?.find(
      (o: Order) => o.orderId === selectedOrderId
    );
    if (!selectedOrder?.orderId) {
      alert("주문 ID가 없습니다.");
      return;
    }
    try {
      const response = await axiosInstance.get(
        `/api/receipts/${selectedOrder.orderId}`
      );
      const receiptData: Receipt = response.data;
      const asciiText = convertToAsciiReceipt(receiptData);
      setAsciiReceipt(asciiText);
      setIsPrintModalOpen(true);
    } catch (err) {
      alert("영수증 정보를 불러오지 못했습니다.");
    }
  };

  const convertToAsciiReceipt = (receipt: Receipt): string => {
    const line = "=====================================";
    const subLine = "-------------------------------------";
    let result = `${line}\n`;
    result += `${receipt.storeName}\n`;
    result += `사업자 번호: ${receipt.businessNum}\n`;
    result += `점주: ${receipt.owner}\n`;
    result += `전화번호: ${receipt.phoneNumber}\n`;
    result += `주소: ${receipt.storePlace}\n`;
    result += `${subLine}\n`;
    result += `주문 ID: ${receipt.orderId}\n`;
    result += `영수증 번호: ${receipt.receiptDate}\n`;
    result += `테이블: ${receipt.placeName}\n`;
    result += `접수 번호: ${receipt.joinNumber}\n`;
    result += `결제일시: ${receipt.createdAt}\n`;
    result += `${subLine}\n`;
    result += `메뉴:\n`;
    receipt.menuList.forEach((menu) => {
      result += `${menu.menuName} x${
        menu.totalCount
      }  ₩${menu.totalPrice.toLocaleString()} (${menu.discountRate}% 할인)\n`;
    });
    result += `${subLine}\n`;
    result += `결제 정보:\n`;
    receipt.cardInfoList.forEach((card) => {
      if (card.paymentType === "CARD") {
        result += `CARD: ${card.cardCompany} ${card.cardNumber}\n`;
        result += `결제 방식: ${card.inputMethod}\n`;
        result += `승인일시: ${card.approveDate}\n`;
        result += `승인번호: ${card.approveNumber}\n`;
        result += `할부: ${card.installmentPeriod}\n`;
        result += `결제 금액: ₩${card.paidMoney.toLocaleString()}\n`;
      } else {
        result += `CASH: ₩${card.paidMoney.toLocaleString()}\n`;
      }
    });
    result += `${subLine}\n`;
    result += `총 금액: ₩${receipt.totalAmount.toLocaleString()}\n`;
    result += `${line}`;
    return result;
  };

  const handleSearchClick = () => {
    setIsDatePickerOpen(!isDatePickerOpen);
  };

  const handleSearch = async () => {
    if (startDate && endDate && storeId) {
      // 날짜를 YYYY-MM-DD 형식으로 포맷
      const formattedStartDate = startDate.toISOString().split("T")[0];
      
      // endDate를 하루 늘려서 포함 범위 보장
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1); // 다음 날로 설정
      const formattedEndDate = adjustedEndDate.toISOString().split("T")[0];

      try {
        const status = isCancelled ? "cancelled" : "success";
        const response = await axiosInstance.get(`/api/reports`, {
          params: {
            storeId,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            status,
          },
        });
        const summaries = Array.isArray(response.data) ? response.data : [];
        const sortedSummaries = summaries.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setSearchResults(sortedSummaries);
        setIsSearching(true);
        setIsDatePickerOpen(false);
        resetOrdersMap(); // 검색 시 기존 주문 데이터 초기화
        preloadAllOrders(); // 검색 후 모든 주문 로드
      } catch (err) {
        setError("주문 검색에 실패했습니다.");
      }
    } else {
      alert("시작일과 종료일을 모두 선택해주세요.");
    }
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
  };

  const handleCancelledOrders = () => {
    resetOrdersMap(); // 이전 데이터 초기화
    setIsCancelled(true);
    setIsMonthly(false);
    setIsSearching(false);
    setCurrentDateIndex(0);
    setStartDate(null);
    setEndDate(null);
    queryClient.invalidateQueries({
      queryKey: ["orderSummaries", storeId, true],
    });
    queryClient.invalidateQueries({
      queryKey: ["ordersForDate", storeId],
    });
    preloadAllOrders();
  };

  // "당일 매출 내역" 버튼 클릭 핸들러
  const handleDailySales = () => {
    resetOrdersMap(); // 이전 데이터 초기화
    setIsCancelled(false);
    setIsMonthly(false);
    setIsSearching(false);
    setCurrentDateIndex(0);
    setStartDate(null);
    setEndDate(null);
    queryClient.invalidateQueries({
      queryKey: ["orderSummaries", storeId, false],
    });
    queryClient.invalidateQueries({
      queryKey: ["ordersForDate", storeId],
    });
    preloadAllOrders();
  };

  const handleMonthlySales = () => {
    setIsCancelled(false);
    setIsMonthly(true); // 월간 상태 설정
    setIsSearching(false);
    setCurrentDateIndex(0);
    setStartDate(null);
    setEndDate(null);
    // TODO: 월간 데이터를 가져오는 API 호출 로직 추가 필요
    queryClient.invalidateQueries({
      queryKey: ["orderSummaries", storeId, isCancelled, isMonthly],
    });
    preloadAllOrders(); // 현재는 동일 API 사용, 월간 API로 변경 가능
  };

  return (
    <div className="flex items-center font-mono justify-center h-screen w-screen relative">
      <div className="relative w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl flex overflow-hidden">
        <div className="w-1/3 border-r border-gray-400">
          <div className="h-[3rem] border-b border-gray-400 flex justify-center items-center">
            <span>
              {isCancelled ? "Return" : isMonthly ? "Monthly" : "Daily"}
            </span>
          </div>
          <div
            className="cursor-pointer bg-gray-50 text-gray-300 m-1 rounded p-4 flex items-center"
            onClick={handleSearchClick}
          >
            <Search className="mr-2" />
            <span>search</span>
          </div>

          {isDatePickerOpen && (
            <div className="absolute top-[4rem] left-0 z-10 bg-white p-4 shadow-lg">
              <div className="flex flex-col gap-2">
                <DatePicker
                  selected={startDate}
                  onChange={handleStartDateChange}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="시작일 선택"
                />
                <DatePicker
                  selected={endDate}
                  onChange={handleEndDateChange}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || undefined}
                  placeholderText="종료일 선택"
                />
                <div className="flex justify-between">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={handleSearch}
                  >
                    검색
                  </button>
                  <button
                    className="bg-gray-300 px-4 py-2 rounded"
                    onClick={() => setIsDatePickerOpen(false)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-y-auto h-[calc(100%-7rem)]">
            {summariesLoading || ordersLoading ? (
              <p>로딩 중...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : sortedSummaries.length === 0 ? (
              <p>주문 내역이 없습니다.</p>
            ) : (
              sortedSummaries.map((summary: any) => {
                const orders = allOrdersMap[summary.date] || [];
                return (
                  <div key={summary.date}>
                    <div className="bg-gray-200 p-2 text-sm font-medium">
                      {formatDateLabel(summary.date)}
                    </div>
                    {orders.length > 0 ? (
                      orders.map((order) => (
                        <div
                          key={`${order.orderId}-${summary.date}`}
                          className={`flex justify-between p-2 border-b border-gray-300 cursor-pointer hover:bg-gray-100 ${
                            selectedOrderId === order.orderId
                              ? "bg-gray-100"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedOrder(order.orderId, summary.date)
                          }
                        >
                          <div className="flex items-center">
                            {order.paymentType === "CARD" ? (
                              <CreditCard className="w-12 h-8 mr-2 text-gray-500" />
                            ) : (
                              <Banknote className="w-12 h-8 mr-2 text-gray-500" />
                            )}
                            <div className="flex flex-col gap-4 ml-2 text-xs">
                              <span>₩{order.price.toLocaleString()}</span>
                              <span>
                                {isCancelled
                                  ? "취소"
                                  : order.orderStatus === "SUCCESS"
                                  ? "결제 완료"
                                  : "취소"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-sm">
                            <span>{formatTime(order.orderedAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="p-2 text-sm text-gray-500">주문 없음</p>
                    )}
                  </div>
                );
              })
            )}
            <div ref={observerRef} />
            {isFetchingNextPage && <p>로딩 중...</p>}
          </div>
        </div>

        <div className="w-1/2 flex flex-col border-r border-gray-400">
          <div className="flex items-center justify-center uppercase text-lg font-medium border-b border-gray-400 h-[3rem] mb-4">
            {placeName || ""}
          </div>
          <div className="flex-1 border-b border-gray-300">
            {selectedOrderId && selectedDate && allOrdersMap[selectedDate] ? (
              loadingReceipt ? (
                <p></p>
              ) : receipt ? (
                <div className="text-sm h-full flex flex-col justify-between">
                  <div className="flex flex-col text-md w-full">
                    {receipt.menuList.map((menu, index) => (
                      <div
                        key={index}
                        className="flex flex-row justify-center items-center text-center py-1"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {menu.menuName}
                        </span>
                        <span className="min-w-0 flex-1">
                          {menu.totalCount}
                        </span>
                        <span className="min-w-0 flex-1">
                          ₩ {menu.totalPrice.toLocaleString()}
                        </span>
                        {menu.discountRate > 0 ? (
                          <span className="min-w-0 flex-1">
                            ({menu.discountRate}% 할인)
                          </span>
                        ) : (
                          <span className=""></span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <div className="border-t border-gray-300 py-2 flex flex-row justify-between px-4">
                      <p>영수증번호 :</p>
                      <span>{receipt.receiptDate}</span>
                    </div>
                    <div className="border-t border-gray-300 py-2 flex flex-col px-4">
                      {receipt.cardInfoList.map((cardInfo, index) => (
                        <div className="flex flex-col gap-1" key={index}>
                          {cardInfo.paymentType === "CASH" ? (
                            <div className="flex flex-row justify-between">
                              <p>결제 :</p>
                              <span>{cardInfo.paymentType}</span>
                            </div>
                          ) : (
                            cardInfo.paymentType === "CARD" && (
                              <div className="flex flex-row justify-between">
                                <p>{cardInfo.cardCompany}카드 :</p>
                                <p className="flex flex-col justify-center truncate">
                                  {cardInfo.cardNumber}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-300 py-2 flex flex-row justify-between px-4">
                      <p>Total :</p>
                      <p> ₩{receipt.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500">주문을 선택하세요.</p>
              )
            ) : (
              <p className="text-center text-gray-500">주문을 선택하세요.</p>
            )}
          </div>
          <div className="flex text-gray-700 justify-center gap-2 m-4 mb-6">
            <button
              className="bg-gray-200 rounded w-1/2 py-6 hover:bg-gray-300"
              onClick={handlePrint}
            >
              Print
            </button>
            <button
              className="bg-gray-200 rounded w-1/2 py-6 hover:bg-gray-300"
              onClick={() => setIsRefundModalOpen(true)}
            >
              Refund
            </button>
          </div>

          <Modal
            isOpen={isRefundModalOpen}
            onClose={() => setIsRefundModalOpen(false)}
          >
            <div className="text-center">
              <p className="mb-4">결제를 취소하시겠습니까?</p>
              <div className="flex justify-center gap-4">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={handleRefund}
                >
                  예
                </button>
                <button
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                  onClick={() => setIsRefundModalOpen(false)}
                >
                  아니오
                </button>
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
          >
            <div className="font-mono whitespace-pre text-sm">
              {asciiReceipt}
            </div>
          </Modal>
        </div>

        <div className="flex flex-col w-1/3 items-center justify-between">
          <div className="flex flex-row w-full gap-1 p-2 ml-4">
            <Archive className="mt-1 text-gray-700" />
            <span className="font-sans text-2xl text-left font-semibold text-gray-800">
              Order
            </span>
          </div>
          <div className="flex flex-col items-center justify-center mb-20">
            <p className="flex text-gray-700 border-b border-gray-300 mb-4 w-full p-1 pl-2 text-center">
              Details
            </p>
            <div className="flex flex-col">
              <div className="flex flex-row justify-center items-center gap-2 mb-4">
                <button
                  className="bg-gray-200 rounded w-[9rem] py-6 hover:bg-gray-300"
                  onClick={handleDailySales}
                >
                  당일 매출 내역
                </button>
                <button className="bg-gray-200 rounded w-[9rem] py-6 hover:bg-gray-300">
                  월간 매출 내역
                </button>
              </div>
              <div className="flex flex-row justify-start items-center gap-4">
                <button
                  className="bg-gray-200 rounded w-[9rem] py-6 hover:bg-gray-300"
                  onClick={handleCancelledOrders}
                >
                  반품 결제 내역
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-center items-center gap-2 my-6">
            <button
              className="bg-gray-200 rounded py-6 w-[9rem] hover:bg-gray-300"
              onClick={() => setCalculatorModalOpen(true)}
            >
              계산기
            </button>
            <button
              className="bg-gray-200 rounded py-6 w-[9rem] hover:bg-gray-300"
              onClick={() => router.push("/setting")}
            >
              Back
            </button>
          </div>
        </div>
      </div>
      <CalculatorModal />
    </div>
  );
}
