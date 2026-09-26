# product/

에이전트가 만드는 **Expo(React Native) 앱**의 코드가 이 디렉토리에 생성됩니다 (design phase 이후).

## 실행 (아이폰에서 확인하기)
1. 아이폰 App Store에서 **Expo Go** 앱을 설치합니다.
2. 이 저장소를 체크아웃한 환경(GitHub Actions/Routine)에서:
   ```
   cd product
   npx expo start --tunnel
   ```
3. 터미널에 뜨는 QR 코드를 Expo Go 로 스캔하면 아이폰에서 바로 실행됩니다.

## 테스트
```
cd product && npm test
```
(`jest-expo` 프리셋. 순수 로직 위주로 테스트하고, UI는 최소한만 스냅샷/렌더 테스트합니다.)

## 구조 원칙
- Managed workflow 유지 (`ios/`, `android/` 폴더를 생성하는 prebuild/eject 금지 — Mac 없이 유지보수해야 함)
- 패키지 추가는 `npx expo install <pkg>` 사용 (Expo SDK 버전 호환 보장)
- 로컬 저장은 `@react-native-async-storage/async-storage`, 서버/유료 API 없음
