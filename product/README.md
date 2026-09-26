# product/ — 요리용 멀티 타이머 (Expo)

## 실행 (아이폰에서 확인하기)
1. 아이폰 App Store에서 **Expo Go** 앱을 설치합니다.
2. 이 저장소를 체크아웃한 환경(GitHub Actions/Routine)에서:
   ```
   cd product
   npx expo start --tunnel
   ```
3. 터미널에 뜨는 QR 코드를 Expo Go 로 스캔하면 아이폰에서 바로 실행됩니다.

## 현재 상태 (T-012a)
실제 타이머 화면이 동작합니다: 홈 화면(`screens/Home.tsx`)에서 "+ 새 타이머"로 라벨+시간을 입력해 타이머를 만들고,
여러 개를 동시에 실행하며(`components/TimerCard.tsx`), 일시정지/재개/취소할 수 있습니다. `lib/timer.ts`+`lib/notifications.ts`
가 연결되어 있어 타이머를 시작하면 실제로 로컬 알림이 예약됩니다. 프리셋 UI(저장된 타이머 빠른 시작)는 아직 없습니다(T-012b).

**중요**: 이 앱의 핵심 가치는 "앱이 꺼져 있거나 백그라운드여도 타이머 알림이 확실히 온다"는 것인데,
**이 부분은 아직 실제 아이폰(Expo Go)에서 검증되지 않았습니다.** 사람이 이 검증을 미루고 구현을 먼저 진행하도록
지시해(state/decisions.md D-011) 검증을 `test` phase 로 미뤘습니다. 지금 이 앱을 실기기에서 열어 타이머를 하나 만든 뒤
화면을 끄거나 앱을 종료해서 직접 확인해보실 수 있으면 언제든 환영이며, 결과는 `state/inbox.md` 에 남겨주시면 반영됩니다.

## 테스트
```
cd product && npm test
```
`jest-expo` 프리셋으로 설정되어 있습니다. 현재 `lib/timer.ts` 21개 + `lib/notifications.ts` 7개 + `lib/presets.ts`(프리셋 저장/불러오기, AsyncStorage 모킹) 7개, 총 35개 유닛 테스트가 통과합니다.
`npx expo lint` 는 이 컨테이너 환경의 네트워크 정책이 ESLint 자동 설정에 필요한 호출을 막아 아직 설정하지 못했습니다(같은 원인의 다른 사례는 아래 참고).

## 구조 원칙
- Managed workflow 유지 (`ios/`, `android/` 폴더를 생성하는 prebuild/eject 금지 — Mac 없이 유지보수해야 함)
- 패키지 추가는 원칙적으로 `npx expo install <pkg>` 를 쓰지만, 이 컨테이너 환경의 네트워크 정책이
  `expo install` 이 호출하는 호환성 체크 API(React Native Directory 등)를 막고 있어 `npm install <pkg>` 로 설치한 뒤
  `product/node_modules/expo/bundledNativeModules.json` 에서 설치된 Expo SDK(현재 57)가 기대하는 정확한 버전을 확인해
  다르면 `npm install <pkg>@<정확한버전> --save-exact` 로 맞춥니다(state/decisions.md D-013).
- 로컬 저장은 `@react-native-async-storage/async-storage@2.2.0`(SDK 57 호환 버전 고정), 서버/유료 API 없음
