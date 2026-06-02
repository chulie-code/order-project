import type { Metadata } from "next";
import { Fraunces, Gowun_Batang, Gowun_Dodum } from "next/font/google";

import { LeadForm } from "@/components/leads/lead-form";

import styles from "./page.module.css";

// 디자인 폰트. next/font 가 셀프 호스팅하고 CSS 변수로 노출한다.
// (한글 글리프는 폰트의 unicode-range face 로 함께 포함된다.)
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});
const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gowun-batang",
});
const gowunDodum = Gowun_Dodum({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gowun-dodum",
});

export const metadata: Metadata = {
  title: "오더레터 — 디저트 사장님을 위한 예약·선결제",
  description:
    "흩어진 주문 받느라 지친 디저트 사장님을 위한 예약·선결제 페이지. 어디서 주문받든 링크 하나로 노쇼와 밤늦은 주문 문의를 끝내세요.",
};

export default function Home() {
  const fontVars = `${fraunces.variable} ${gowunBatang.variable} ${gowunDodum.variable}`;

  return (
    <div className={`${fontVars} ${styles.page}`}>
      <nav>
        <div className={styles.wordmark}>
          오더레터<span className={styles.dot}>.</span>
        </div>
        <a href="#leads" className={styles.navCta}>
          사전 신청
        </a>
      </nav>

      <header className={styles.hero}>
        <span className={`${styles.eyebrow} ${styles.reveal} ${styles.d1}`}>
          홈베이킹 · 케이크 공방 사장님 전용
        </span>
        <h1 className={`${styles.reveal} ${styles.d2}`}>
          흩어진 주문 받느라
          <br />
          지친 사장님을 위한
          <br />
          <em>예약·선결제 페이지</em>
        </h1>
        <p className={`${styles.sub} ${styles.reveal} ${styles.d3}`}>
          어디서 주문받든 링크 하나로. 고객이 직접 픽업 시간을 고르고 미리 결제해요. 노쇼도, 밤늦은
          주문 문의도 이제 그만.
        </p>
        <div className={`${styles.heroCtaRow} ${styles.reveal} ${styles.d4}`}>
          <a href="#leads" className={styles.btnPrimary}>
            베타 무료로 먼저 써보기
          </a>
          <span className={styles.heroNote}>정식 오픈 전 신청한 사장님께 무료 혜택 ✦</span>
        </div>
        <div className={`${styles.heroStats} ${styles.reveal} ${styles.d5}`}>
          <div className={styles.stat}>
            <div className={styles.statN}>선결제</div>
            <div className={styles.statL}>노쇼 걱정 끝</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statN}>자동 알림</div>
            <div className={styles.statL}>픽업 전날 카톡 리마인드</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statN}>하루 한도</div>
            <div className={styles.statL}>만들 수 있는 만큼만 주문</div>
          </div>
        </div>
      </header>

      <section className={`${styles.block} ${styles.pain}`}>
        <div className={styles.secLabel}>이런 적 있으시죠</div>
        <h2 className={`${styles.secTitle} ${styles.kserif}`}>매번 똑같은 주문 문의, 매번 같은 고민</h2>
        <div className={styles.painGrid}>
          <div className={styles.painCard}>
            <div className={styles.ic}>💬</div>
            <h3>밤늦게 쏟아지는 주문 문의</h3>
            <p>
              {
                '"이거 언제 픽업돼요?" "옵션 뭐 있어요?" 같은 질문에 하루 종일 답장하느라 정작 베이킹할 시간이 없어요.'
              }
            </p>
          </div>
          <div className={styles.painCard}>
            <div className={styles.ic}>🥲</div>
            <h3>노쇼와 당일 취소</h3>
            <p>정성껏 만들어 뒀는데 안 찾아가는 손님. 재료비도, 시간도 그대로 손해예요.</p>
          </div>
          <div className={styles.painCard}>
            <div className={styles.ic}>📅</div>
            <h3>뒤죽박죽 주문 관리</h3>
            <p>카톡·DM·메모장에 흩어진 주문. 오늘 몇 개 만들어야 하는지 머릿속으로 계산해요.</p>
          </div>
        </div>
      </section>

      <section className={styles.block}>
        <div className={styles.secLabel}>오더레터가 해결해요</div>
        <h2 className={`${styles.secTitle} ${styles.kserif}`}>주문받는 일, 이제 자동으로</h2>
        <div className={styles.featList}>
          <div className={styles.feat}>
            <div className={styles.num}>01</div>
            <div>
              <h3>선결제로 노쇼 차단</h3>
              <p>
                고객이 주문할 때 미리 결제해요. 선입금 100%든 예약금 50%든 원하는 대로. 안 찾아가는
                손님 걱정이 사라집니다.
              </p>
            </div>
          </div>
          <div className={styles.feat}>
            <div className={styles.num}>02</div>
            <div>
              <h3>카카오톡 자동 알림</h3>
              <p>
                주문 접수와 픽업 전날 리마인드를 카톡으로 자동 발송. 손님이 잊지 않게, 사장님이
                일일이 챙기지 않게.
              </p>
            </div>
          </div>
          <div className={styles.feat}>
            <div className={styles.num}>03</div>
            <div>
              <h3>하루 생산 한도 자동 마감</h3>
              <p>
                {
                  '"케이크는 하루 5개까지"처럼 한도를 정하면 그 날짜는 자동 마감. 감당할 수 있는 만큼만 주문이 들어와요.'
                }
              </p>
            </div>
          </div>
          <div className={styles.feat}>
            <div className={styles.num}>04</div>
            <div>
              <h3>레터링·픽업시간 깔끔하게</h3>
              <p>
                레터링 문구, 픽업 시간, 선물 받는 분 정보까지 폼으로 정리. 여기저기 채팅으로 주고받던
                걸 한 번에.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.block} ${styles.steps}`}>
        <div className={styles.secLabel}>시작은 이렇게 간단해요</div>
        <h2 className={styles.secTitle}>3분이면 내 주문 페이지 완성</h2>
        <div className={styles.stepRow}>
          <div className={styles.step}>
            <div className={styles.sN}>1</div>
            <h3>메뉴 올리기</h3>
            <p>케이크·디저트 사진과 가격, 옵션, 사전주문 일수를 등록해요.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.sN}>2</div>
            <h3>링크 공유</h3>
            <p>내 전용 주소를 어느 채널 프로필이든 한 줄 붙여넣기.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.sN}>3</div>
            <h3>주문 받기</h3>
            <p>고객이 직접 예약·결제. 사장님은 대시보드에서 확인만.</p>
          </div>
        </div>
      </section>

      <section className={`${styles.block} ${styles.waitlist}`} id="leads">
        <div className={styles.wlInner}>
          <div className={styles.secLabel}>사전 신청</div>
          <h2 className={`${styles.secTitle} ${styles.kserif}`}>먼저 써볼 디저트 사장님을 찾아요</h2>
          <p className={styles.lead}>
            정식 오픈 전, 베타로 무료 이용하고 피드백을 들려주실 사장님을 모십니다. 신청하시면 오픈
            소식을 가장 먼저 알려드릴게요.
          </p>
          <ul className={styles.benefits}>
            <li className={styles.benefit}>
              <span className={styles.benefitMark}>✓</span>
              <span className={styles.benefitText}>
                <strong>무료 이용</strong>
                <span>정식 오픈 전까지 모든 기능을 무료로 써보실 수 있어요.</span>
              </span>
            </li>
            <li className={styles.benefit}>
              <span className={styles.benefitMark}>✓</span>
              <span className={styles.benefitText}>
                <strong>1:1 셋업 지원</strong>
                <span>메뉴 등록부터 주문 페이지 세팅까지 1:1로 도와드려요.</span>
              </span>
            </li>
            <li className={styles.benefit}>
              <span className={styles.benefitMark}>✓</span>
              <span className={styles.benefitText}>
                <strong>의견을 제품에 반영</strong>
                <span>주신 피드백을 우선순위로 제품에 직접 반영합니다.</span>
              </span>
            </li>
          </ul>
          <LeadForm />
        </div>
      </section>

      <footer>
        <div>오더레터 — 디저트 사장님을 위한 예약·선결제</div>
        <div>
          © 2026 오더레터 · 문의 <a href="mailto:choo4925@gmail.com">choo4925@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}
