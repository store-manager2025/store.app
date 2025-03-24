"use client";

import { useEffect, useState, useCallback } from "react";
import { QueryClient, useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useFormStore } from "@/store/formStore";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { Archive } from "lucide-react";
import _ from "lodash";

const queryClient = new QueryClient();

export default function OrderPage() {

  const router = useRouter();
  const { storeId } = useFormStore();

  const handle = () => {
    // 
  }

  return (
    <div className="flex items-center font-mono justify-center h-screen w-screen relative">
      <div className="relative w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl flex overflow-hidden">
          <>
            <div className="flex flex-row w-full">
              { /* handle에 의해 보여질 매출 평균 객단가 섹션*/}
            </div>
            <div className="flex flex-row w-full">
              { /* handle에 의해 보여질 매장 카테고리별 매출 분석 섹션*/}
            </div>
            <div className="flex flex-row w-full">
              { /* handle에 의해 보여질 시간대별 매출 분석 섹션*/}
            </div>
            <div className="flex flex-row w-full">
              { /* handle에 의해 보여질 결제 방식별 매출 분석 섹션*/}
            </div>
          </>
        <div className="flex flex-col p-4 items-center justify-between">
          <div className="flex flex-row w-full gap-1 px-2">
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
                  onClick={handle}
                >
                  매출 평균 객단가
                </button>
                <button
                  className="bg-gray-200 rounded w-[9rem] py-6 hover:bg-gray-300"
                  onClick={handle}
                >
                  매장 카테고리별 매출 분석
                </button>
              </div>
              <div className="flex flex-row justify-start items-center gap-4">
                <button
                  className="bg-gray-200 rounded w-[9rem] py-6 hover:bg-gray-300"
                  onClick={handle}
                >
                  시간대별 매출 분석
                </button>
                <button
                  className="bg-gray-200 rounded py-6 w-[9rem] hover:bg-gray-300"
                  onClick={handle}
                >
                  결제 방식별 매출 분석 
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-center items-center gap-2 my-2">
            <button
              className="bg-gray-200 rounded py-6 w-[9rem] hover:bg-gray-300"
              onClick={() => router.push("/setting")}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}