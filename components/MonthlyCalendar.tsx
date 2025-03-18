"use client";
import { useEffect, useRef, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import { OrderSummary } from "../types/order";

interface MonthlyCalendarProps {
  orderSummaries: OrderSummary[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  storeId: number;
}

interface CalendarDay {
  day: number;
  sales: number;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  orderSummaries,
  currentMonth,
  setCurrentMonth,
  storeId,
}) => {
  const [monthlyData, setMonthlyData] = useState<Record<string, number>>({});
  const [totalMonthlySales, setTotalMonthlySales] = useState(0);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState<number>(70); // 초기 셀 크기 (기본값)

  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start, end });

    const data: Record<string, number> = {};
    let total = 0;

    daysInMonth.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const summary = orderSummaries.find((s) => s.date === dateStr);
      const dailyTotal = summary ? summary.totalPrice : 0;
      data[dateStr] = dailyTotal;
      total += dailyTotal;
    });

    setMonthlyData(data);
    setTotalMonthlySales(total);

    // 컨테이너 크기에 따라 셀 크기 계산
    const updateCellSize = () => {
      if (calendarRef.current && calendarRef.current.parentElement) {
        const parentWidth = calendarRef.current.parentElement.clientWidth;
        const parentHeight = calendarRef.current.parentElement.clientHeight;
        const availableWidth = parentWidth / 7; // 7일(일요일~토요일)
        const availableHeight = (parentHeight - 80) / 6; // 헤더(80px 추정) 제외 후 6주
        const newCellSize = Math.min(availableWidth, availableHeight) - 2; // 간격 고려
        setCellSize(Math.max(40, newCellSize)); // 최소 40px로 제한
      }
    };

    updateCellSize();
    window.addEventListener("resize", updateCellSize);
    return () => window.removeEventListener("resize", updateCellSize);
  }, [currentMonth, orderSummaries]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start, end });
  const firstDayIndex = getDay(start);
  const calendarGrid: (CalendarDay | null)[] = [];

  for (let i = 0; i < firstDayIndex; i++) {
    calendarGrid.push(null);
  }
  daysInMonth.forEach((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    calendarGrid.push({ day: day.getDate(), sales: monthlyData[dateStr] || 0 });
  });
  while (calendarGrid.length % 7 !== 0) {
    calendarGrid.push(null);
  }

  const weeks = [];
  for (let i = 0; i < calendarGrid.length; i += 7) {
    weeks.push(calendarGrid.slice(i, i + 7));
  }

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div
      ref={calendarRef}
      className="border-r border-gray-400 shadow w-full h-full flex flex-col overflow-auto"
    >
      {/* Monthly와 Total을 세로로 정렬하고, 오른쪽에 날짜 선택 버튼 배치 */}
      <div className="flex border-b border-gray-400 justify-between items-center">
        <div className="flex w-2/5 text-center border-r border-gray-400 flex-col">
          <div className="p-3 border-b border-gray-400 text-md">Monthly</div>
          <div className="p-4 text-lg font-bold">
            Total : ₩{totalMonthlySales.toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-2 mr-4">
          <button
            onClick={handlePrevMonth}
            className="px-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            {"<"}
          </button>
          <span>{format(currentMonth, "yyyy. MM")}</span>
          <button
            onClick={handleNextMonth}
            className="px-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            {">"}
          </button>
        </div>
      </div>
      <div className="p-2 grid grid-cols-7 gap-1">
        {weekdays.map((day) => (
          <div
            key={day}
            className={`text-sm text-center ${
              day === "일" ? "text-red-500" : "text-gray-700"
            } bg-gray-100 py-2`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="px-2 flex-1 overflow-auto">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="p-1 border border-gray-200 bg-white flex flex-col justify-between"
                style={{
                  minHeight: `${cellSize}px`,
                  minWidth: `${cellSize}px`,
                }}
              >
                {day ? (
                  <div className="flex flex-col h-full">
                    <div className="text-left text-gray-400 text-xs">{day.day}</div>
                    {day.sales > 0 && (
                      <div className="text-sm text-right">
                        ₩{day.sales.toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyCalendar;