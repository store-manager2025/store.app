"use client";
import { useEffect, useState } from "react";
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
    <div className="rounded-lg shadow w-full h-full flex flex-col">
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
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="px-2 flex-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="p-2 border border-gray-200 bg-white min-h-[70px] flex flex-col"
              >
                {day ? (
                  <div className="flex justify-between items-start h-full">
                    <div className="text-left text-gray-400 text-xs">{day.day}</div>
                    {day.sales > 0 && (
                      <div className="text-sm self-end">
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
