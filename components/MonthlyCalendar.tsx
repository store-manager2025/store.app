"use client";
import React, { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
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

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = React.memo(
  ({ orderSummaries, currentMonth, setCurrentMonth, storeId }) => {
    const [monthlyData, setMonthlyData] = useState<Record<string, number>>({});
    const [totalMonthlySales, setTotalMonthlySales] = useState(0);

    useEffect(() => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const daysInMonth = eachDayOfInterval({ start, end });

      const data: Record<string, number> = {};
      let total = 0;

      daysInMonth.forEach(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        const summary = orderSummaries.find(s => s.date === dateStr);
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
    const firstDayIndex = getDay(start); // 0 = 일요일

    const calendarGrid: (CalendarDay | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      calendarGrid.push(null);
    }
    daysInMonth.forEach(day => {
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
      <div className="p-4 bg-gray-100 rounded-lg shadow w-full h-full flex flex-col">
        <div className="text-xl font-bold mb-4">Monthly</div>
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-bold">Total : ₩{totalMonthlySales.toLocaleString()}</div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 bg-gray-200 rounded hover:bg-gray-300"></button>
            <span>{format(currentMonth, "yyyy. MM")}</span>
            <button onClick={handleNextMonth} className="p-2 bg-gray-200 rounded hover:bg-gray-300"></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map(day => (
            <div key={day} className="text-center font-bold text-gray-700">{day}</div>
          ))}
        </div>
        <div className="flex-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className="text-center p-2 border border-gray-200 bg-white min-h-[60px] flex flex-col justify-center"
                >
                  {day ? (
                    <>
                      <div>{day.day}</div>
                      {day.sales > 0 && <div className="text-sm">₩{day.sales.toLocaleString()}</div>}
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default MonthlyCalendar;