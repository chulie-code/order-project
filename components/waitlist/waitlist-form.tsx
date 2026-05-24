"use client";

import { useState } from "react";

import { submitWaitlist } from "@/app/actions";
import styles from "@/app/page.module.css";

type Status = "idle" | "submitting" | "success" | "error";

export function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("submitting");
    setErrorMsg("");

    try {
      const result = await submitWaitlist({
        name: String(fd.get("name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        insta: String(fd.get("insta") ?? ""),
      });

      if (result.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "신청에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } catch (err) {
      // 서버 액션이 거부되거나 네트워크가 끊겨도 "신청 중…"에 멈추지 않도록 한다.
      console.error("[waitlist] 제출 오류:", err);
      setStatus("error");
      setErrorMsg("네트워크 상태를 확인하고 다시 시도해주세요.");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.wlSuccess}>
        <div className={styles.big}>신청 완료됐어요! 🎂</div>
        <p>오픈 준비가 되면 가장 먼저 연락드릴게요. 기다려 주셔서 감사해요.</p>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form className={styles.wlForm} onSubmit={handleSubmit}>
      <label htmlFor="name">성함 / 가게 이름</label>
      <input
        id="name"
        name="name"
        type="text"
        placeholder="예: 오늘의케이크 김사장"
        required
        disabled={submitting}
      />
      <label htmlFor="phone">연락처</label>
      <input
        id="phone"
        name="phone"
        type="tel"
        placeholder="010-0000-0000"
        required
        disabled={submitting}
      />
      <label htmlFor="insta">인스타그램 (선택)</label>
      <input
        id="insta"
        name="insta"
        type="text"
        placeholder="@your_bakery"
        disabled={submitting}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? "신청 중…" : "베타 신청하기"}
      </button>
      {status === "error" && <p className={styles.wlError}>{errorMsg}</p>}
      <p className={styles.wlPrivacy}>
        신청 정보는 베타 안내 목적으로만 사용되며, 언제든 삭제 요청하실 수 있어요.
      </p>
    </form>
  );
}
