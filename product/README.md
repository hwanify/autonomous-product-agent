# product/ — 요리용 멀티 타이머 (Expo)

## 실행 (아이폰에서 확인하기)
1. 아이폰 App Store에서 **Expo Go** 앱을 설치합니다.
2. 이 저장소를 체크아웃한 환경(GitHub Actions/Routine)에서:
   ```
   cd product
   npx expo start --tunnel
   ```
3. 터미널에 뜨는 QR 코드를 Expo Go 로 스캔하면 아이폰에서 바로 실행됩니다.

## 현재 상태 (T-010)
Expo 프로젝트 초기화 + 타이머 코어 로직(`lib/timer.ts`) + 알림 스케줄링 래퍼(`lib/notifications.ts`)까지 되어 있습니다.
App.tsx 는 이제 이 두 모듈을 사용하는 알림 검증 데모 화면입니다. 아직 화면에서 실제 타이머를 만들고 볼 수는 없습니다
(라벨/다중 실행/프리셋 UI) — `lib/timer.ts` 를 화면에 연결하는 작업은 T-012 에서 합니다.

**중요**: 이 앱의 핵심 가치는 "앱이 꺼져 있거나 백그라운드여도 타이머 알림이 확실히 온다"는 것인데,
**이 부분은 아직 실제 아이폰(Expo Go)에서 검증되지 않았습니다.** 사람이 이 검증을 미루고 구현을 먼저 진행하도록
지시해(state/decisions.md D-011) 검증을 `test` phase 로 미뤘습니다. 지금 이 앱을 실기기에서 열어 위 데모 버튼으로
직접 확인해보실 수 있으면 언제든 환영이며, 결과는 `state/inbox.md` 에 남겨주시면 반영됩니다.

## 테스트
```
cd product && npm test
```
`jest-expo` 프리셋으로 설정되어 있습니다. 현재 `lib/timer.ts`(타이머 코어 로직) 21개 + `lib/notifications.ts`(알림 스케줄링, `expo-notifications` 모킹) 7개, 총 28개 유닛 테스트가 통과합니다.
`npx expo lint` 는 이 컨테이너 환경의 네트워크 정책이 ESLint 자동 설정에 필요한 호출을 막아 아직 설정하지 못했습니다(같은 원인의 다른 사례는 아래 참고).

## 구조 원칙
- Managed workflow 유지 (`ios/`, `android/` 폴더를 생성하는 prebuild/eject 금지 — Mac 없이 유지보수해야 함)
- 패키지 추가는 원칙적으로 `npx expo install <pkg>` 를 쓰지만, 이 컨테이너 환경의 네트워크 정책이
  `expo install` 이 호출하는 호환성 체크 API(React Native Directory 등)를 막고 있어 이번엔 `npm install <pkg>` 로 설치한 뒤
  `package.json` 에서 버전이 설치된 Expo SDK(현재 57)와 맞는지 수동 확인했습니다.
- 로컬 저장은 `@react-native-async-storage/async-storage` 예정 (T-011), 서버/유료 API 없음
