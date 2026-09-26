# product/ — 요리용 멀티 타이머 (Expo)

## 실행 (아이폰에서 확인하기)
1. 아이폰 App Store에서 **Expo Go** 앱을 설치합니다.
2. 이 저장소를 체크아웃한 환경(GitHub Actions/Routine)에서:
   ```
   cd product
   npx expo start --tunnel
   ```
3. 터미널에 뜨는 QR 코드를 Expo Go 로 스캔하면 아이폰에서 바로 실행됩니다.

## 현재 상태 (T-007)
Expo 프로젝트 초기화 + `expo-notifications` 설치 + 알림 권한 요청/예약 최소 데모(App.tsx)까지 되어 있습니다.
아직 실제 타이머 기능(라벨, 다중 실행, 프리셋)은 구현되지 않았습니다 — 그 전에 알림 신뢰성 검증(T-008)이 먼저 필요합니다.

## 테스트
```
cd product && npm test
```
(`jest-expo` 프리셋 도입 예정 — 아직 테스트 스크립트는 설정 전입니다. T-009 부터 `lib/` 순수 로직과 함께 추가됩니다.)

## 구조 원칙
- Managed workflow 유지 (`ios/`, `android/` 폴더를 생성하는 prebuild/eject 금지 — Mac 없이 유지보수해야 함)
- 패키지 추가는 원칙적으로 `npx expo install <pkg>` 를 쓰지만, 이 컨테이너 환경의 네트워크 정책이
  `expo install` 이 호출하는 호환성 체크 API(React Native Directory 등)를 막고 있어 이번엔 `npm install <pkg>` 로 설치한 뒤
  `package.json` 에서 버전이 설치된 Expo SDK(현재 57)와 맞는지 수동 확인했습니다.
- 로컬 저장은 `@react-native-async-storage/async-storage` 예정 (T-011), 서버/유료 API 없음
