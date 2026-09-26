# 경쟁 제품 조사 — 요리용 멀티 타이머 (slug: multi-timer)

> Run #2, T-002. WebSearch로 App Store 상 유사 앱 5개 조사. (WebFetch로 개별 페이지 직접 열람은 아직 안 함 — 검색 결과 스니펫 기반. 가격 등 세부 수치는 출처 링크로 재확인 가능.)

## 경쟁 제품 표

| 앱 | 가격 | 주요 기능 | 리뷰의 불만/문제점 |
|---|---|---|---|
| [About Timers - Kitchen Timer](https://apps.apple.com/us/app/about-timers-kitchen-timer/id1609127805) | 프리미엄(구독/구매) | 동시 다중 타이머, 색상 구분, 이름 지정, Dynamic Island, Live Activities, Apple Watch 연동 | "복원 구매"를 매번 눌러야 하고 유료 결제했는데도 무료판처럼 동작한다는 불만 |
| [Multi Kitchen & Cooking Timer](https://apps.apple.com/us/app/multi-kitchen-cooking-timer/id1049758801) | 무료(추정, 미확인) | 타이머별 라벨 지정 | **치명적 버그**: 여러 타이머를 동시에 돌리면 소리가 안 나고 화면 배너 깜빡임만 있어 "쓸모없다"는 리뷰 |
| [Multi Timer: Kitchen Timer](https://apps.apple.com/tt/app/multi-timer-kitchen-timer/id6450061494) | 미확인 | 라벨 + 알림 | 조사 안 됨 (추가 조사 필요) |
| [MultiTimer: Multiple timers](https://apps.apple.com/us/app/multitimer-multiple-timers/id973421278) | 무료 + Pro 구독($1.99/월, $7.99/년, $17.99 평생) | 커스텀 라벨/색/아이콘/알림음, 카운트다운/카운트업/뽀모도로/인터벌/스톱워치 등 다양한 타이머 타입, 광고 없음, Apple Watch 연동 | Apple Watch 알림이 가끔 실패해 워치 앱을 못 믿겠다는 불만 |
| [All the Timers](https://macsources.com/all-the-timers-ios-timer-app-review/) | 무료(하단 광고바) + $1.99 광고 제거 | 여러 타이머 | 하단 광고바가 거슬린다는 평가 (타이머 영역은 침범 안 함) |
| [Time Timer](https://apps.apple.com/us/app/time-timer/id332520417) (참고용, 신경다양성 특화) | 구독 파이월 | 시각적 타이머 | 예전엔 무료로 훌륭했는데 이제 일부 기능이 구독 뒤에 잠겨있다는 불만 |

## 빈틈(Gap) 요약

1. **"동시에 여러 개 + 확실한 알림"의 신뢰성 문제**: 가장 직접적인 경쟁 제품(Multi Kitchen & Cooking Timer)이 정확히 이 지점에서 실패하고 있음(소리 없이 배너만 깜빡임 → "쓸모없음" 평가). 로컬 알림(`expo-notifications`)으로 각 타이머 종료 시 확실하게 소리+진동+배너를 울리는 것만 제대로 해도 직접적인 차별점이 됨.
2. **무료/광고 없음 자체는 이미 경쟁 중**: MultiTimer, Multi Timer: Utility 등 이미 "완전 무료, 광고 없음"을 내세우는 앱이 존재함 → "무료"만으로는 차별화 부족. ideas-1.md 의 Gap 4점은 다소 과대평가였을 가능성 (자기반박 항목과 일치).
3. **구독/복원구매 마찰**: 여러 경쟁 앱이 구독·인앱결제 UX에서 불만(복원 구매 반복 요구, 파이월)을 유발함. 완전 무료+로컬 저장 구조(mission.md 제약과 일치)면 이 마찰 자체가 사라짐 — 다만 이는 "없어서 좋다"는 소극적 차별점이지 강한 이유는 아님.
4. **Watch 연동 신뢰성 문제**: 여러 앱이 Apple Watch 알림 실패를 겪음 — 이번 MVP 범위(Expo Go, Watch 미지원)에서는 애초에 해당 없는 리스크라 오히려 단순함이 안정성으로 작용할 수 있음.
5. **차별화가 뚜렷하지 않음(반박)**: 표에 있는 5개 앱 모두 "라벨 + 동시 다중 타이머 + 알림"이라는 핵심 기능을 이미 제공 중. 우리가 만들 앱이 여기에 추가할 뚜렷한 한 문장 차별점이 아직 없음 — "알림 신뢰성"과 "완전 무료·가입 없음"의 조합 정도가 현재로선 최선이나, 이것만으로 Differentiation 3점(가설)을 유지할 수 있을지는 validate 단계에서 재검토 필요.

## 가격 구조 관찰
경쟁 대부분이 "무료 다운로드 + 구독/평생 Pro" 모델. 완전 무료(광고·구독 없음)를 표방하는 앱도 이미 최소 2개(MultiTimer, Multi Timer: Utility) 존재.

## 한계 / 추가 조사 필요
- 이번 조사는 WebSearch 스니펫 기반이며 실제 앱을 설치해 사용해보지 않았다 (Expo Go 환경에서 App Store 앱 설치는 범위 밖). 리뷰 인용은 검색 스니펫의 요약이므로 원문 링크로 교차 확인 권장.
- "Multi Timer: Kitchen Timer" 는 상세 조사가 부족함.
- 한국 앱스토어/네이버 등 국내 사용자 불만은 조사하지 않음 (영어권 App Store 리뷰 위주) — validate 단계에서 필요시 보강.

## Run #5 추가 타겟 조사 (Critic 요구사항 반영)

- **MultiTimer 알림 신뢰성**: [Help Center](https://help.multitimer.net/troubleshooting-for-ios)에 iOS/Android 전용 트러블슈팅 문서가 있을 정도로 실제로 알림 실패 이슈가 있음("다른 앱으로 전환하거나 폰을 내려놓으면 알람이 안 울린다"). 원인은 iOS 백그라운드 실행 제약·무음/잠금 설정·배터리 최적화 — **앱 설계가 아니라 OS 플랫폼 제약**이라, 동일한 `expo-notifications` 기반인 우리 앱도 피할 수 없다.
- **조리 프리셋 니치**: 계란 삶기만 검색해도 EggApp, Egg Timer – Smart Cook, EggTime, Boiled Egg Timer, Egg Timer Plus 등 6개 이상의 정교한 전용 앱이 이미 존재(크기·고도·냉장 여부까지 보정). 상세 근거는 docs/validation/multi-timer.md 참조.

## 왜 이 조사가 틀렸을 수 있는가
- 검색 스니펫은 요약이라 실제 리뷰 개수·최신성(오래된 리뷰일 수 있음)을 알 수 없다.
- "쓸모없다"는 평가가 있는 경쟁 앱이 실제로는 여전히 다운로드 순위가 높을 수 있어, 그 결함이 시장에서 치명적이지 않을 가능성도 있다.
- 이미 무료+라벨+알림을 잘 하는 앱(MultiTimer)이 존재하므로, 실제 Gap은 처음 가정(4점)보다 낮을 수 있다 (validate에서 점수 재평가 필요).
