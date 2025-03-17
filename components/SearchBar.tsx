"use client";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Search } from "lucide-react";

interface SearchBarProps {
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  handleSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  handleSearch,
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
  };

  return (
    <div className="cursor-pointer bg-gray-50 text-gray-300 m-1 rounded p-4 flex items-center">
      <Search className="mr-2" />
      <span onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>search</span>
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
    </div>
  );
};

export default SearchBar;