// pages/create.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axiosInstance";
import Spinner from "../../components/Spinner";
import { useFormStore } from "../../store/formStore";

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);

  // Zustand 스토어에서 상태와 업데이트 함수를 가져옴
  const { storeName, storePlace, password, setStoreName, setStorePlace, setPassword } = useFormStore();

  // 디바운싱을 위한 타이머 레퍼런스
  const nameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const placeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pwTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      router.push("/");
    }
  }, [router]);

  const handleGoBack = () => {
    if (step === 1) {
      router.push("/home");
    } else {
      setStep((prev) => prev - 1);
    }
  };

  // --------------------------------------------
  // 1) 매장 이름 입력
  // --------------------------------------------
  const handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStoreName(value);
    if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    nameTimerRef.current = setTimeout(() => {
      console.log("매장 이름 자동저장:", value);
      if (value.trim() !== "") {
        setStep(2);
      }
    }, 2000);
  };

  // --------------------------------------------
  // 2) 매장 주소 입력 (카카오 주소 API 사용)
  // --------------------------------------------
  const handleOpenKakaoAddress = () => {
    if (typeof window === "undefined" || !window.daum?.Postcode) {
      alert("카카오 주소 API가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    (new (window.daum.Postcode as any)({
      oncomplete: (data: any) => {
        setStorePlace(data.address);
        console.log("카카오 주소 선택: ", data.address);
        if (placeTimerRef.current) clearTimeout(placeTimerRef.current);
        placeTimerRef.current = setTimeout(() => {
          if (data.address.trim() !== "") {
            setStep(3);
          }
        }, 2000);
      },
    })).open();
  };

  const handleChangePlace = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStorePlace(e.target.value);
    if (placeTimerRef.current) clearTimeout(placeTimerRef.current);
    placeTimerRef.current = setTimeout(() => {
      console.log("매장 주소 자동저장: ", e.target.value);
      if (e.target.value.trim() !== "") {
        setStep(3);
      }
    }, 2000);
  };
  // --------------------------------------------
  // 3) 비밀번호(4자리) (Zustand 사용)
  // --------------------------------------------
  const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    // Zustand 스토어에 업데이트 (동기적 업데이트)
    setPassword(val);

    if (pwTimerRef.current) clearTimeout(pwTimerRef.current);
    pwTimerRef.current = setTimeout(() => {
      console.log("비밀번호 자동저장:", val);
      // Zustand의 상태가 최신으로 업데이트되었는지 보장하기 위해 getState()를 사용
      if (val.length === 4) {
        console.log("비밀번호 자동저장 후 제출:", val);
        submitPayload();
      }
    }, 1000);
  };

  // submitPayload에서 최신 상태를 직접 가져옴
  const submitPayload = async () => {
    // useFormStore.getState()를 사용하여 항상 최신 상태를 가져온다.
    const { storeName, storePlace, password } = useFormStore.getState();

    console.log("Debug: storeName:", storeName);
    console.log("Debug: storePlace:", storePlace);
    console.log("Debug: password:", password);

    if (!storeName || !storePlace || password.length !== 4) {
      alert("모든 필드를 올바르게 입력해주세요.");
      return;
    }

    try {
      const payload = { storeName, storePlace, password };
      console.log("최종 payload:", payload);
      await axiosInstance.post("/api/stores", payload);

      setStep(4); // 스피너 단계로 전환
      setTimeout(() => {
        router.push("/home");
      }, 5000);
    } catch (error) {
      console.error("매장 생성 실패:", error);
      alert("매장 생성에 실패했습니다.");
      router.push("/home");
    }
  };

  const renderStep = () => {
    if (step === 4) {
      return <Spinner />;
    }

    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-4 text-lg">매장 이름을 작성해주세요.</p>
            <input
              type="text"
              value={storeName}
              onChange={handleChangeName}
              className="w-[300px] h-10 rounded-md border border-gray-300 px-3 outline-none"
              placeholder="매장 이름을 입력"
            />
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-4 text-lg">매장 주소를 작성해주세요.</p>
            <input
              type="text"
              value={storePlace}
              onChange={handleChangePlace}
              className="w-[300px] h-10 rounded-md border border-gray-300 px-3 outline-none mb-2"
              placeholder="직접 주소를 입력하거나 검색하기"
            />
            <button
              onClick={handleOpenKakaoAddress}
              className="mt-4 border-none test-xs text-gray-500 rounded-md hover:text-gray-900 transition"
            >
              카카오 주소 검색
            </button>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-4 text-lg">사용하실 비밀번호 4자리를 입력해주세요.</p>
            <input
              type="password"
              maxLength={4}
              value={password}
              onChange={handleChangePassword}
              className="w-[300px] h-10 rounded-md border border-gray-300 px-3 outline-none text-center"
              placeholder="4자리 숫자"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-transparent relative">
      {step !== 4 && (
        <button
          onClick={handleGoBack}
          className="absolute top-5 left-5 bg-transparent text-gray-500 px-2 py-1 text-sm rounded hover:text-gray-900"
        >
          Back
        </button>
      )}
      <div className="bg-transparent border-none w-[80%] md:w-[600px] h-[300px] rounded-md flex flex-col items-center justify-center">
        {renderStep()}
      </div>
    </div>
  );
}
