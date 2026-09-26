# product/ — 요리용 멀티 타이머 (Expo)

여러 요리를 동시에 할 때 라벨을 붙여 여러 타이머를 돌리고, 앱이 꺼져 있거나 백그라운드여도 확실하게 알림이 울리는
무료 Expo(React Native) 앱입니다. 서버·계정·유료 API 없이 전부 기기 안에서 동작합니다.

## 실행 (아이폰에서 확인하기)
1. 아이폰 App Store에서 **Expo Go** 앱을 설치합니다.
2. 이 저장소를 새로 체크아웃한 환경(Codespaces 등 포함)에서 **반드시 먼저 패키지를 설치**합니다(`node_modules` 는
   git에 커밋되지 않으므로, 새 환경에서는 이 단계를 건너뛰면 `Unable to resolve module ...` 에러가 납니다):
   ```
   cd product
   npm install
   npx expo start --tunnel
   ```
3. 터미널에 뜨는 QR 코드를 Expo Go 로 스캔하면 아이폰에서 바로 실행됩니다.
4. 그래도 모듈을 못 찾는다는 에러가 나면 Metro 캐시 문제일 수 있습니다: `npx expo start --tunnel -c` (캐시 초기화)
   로 다시 시도해보세요.

(참고: 이 컨테이너 환경에서는 `--tunnel` 이 쓰는 ngrok 접속이 네트워크 정책으로 막혀 있어 이 방법이 지금 당장은 안 될 수
있습니다 — 사람이 클라우드 환경 설정에서 네트워크 접근 범위를 넓히면 됩니다. `--tunnel` 없이 로컬 네트워크(LAN)에서
직접 실행하는 환경이라면 `npx expo start` 만으로도 QR 코드가 뜹니다.)

## 사용법
- 홈 화면에서 **"+ 새 타이머"** 로 라벨(예: "라면")과 분/초를 입력해 타이머를 시작합니다. 여러 개를 동시에 만들 수 있습니다.
- 각 타이머는 남은 시간을 표시하고, **일시정지/재개/취소** 할 수 있습니다.
- 새 타이머를 만들 때 **"프리셋으로 저장"** 을 켜면 화면 위쪽 프리셋 목록에 칩으로 남고, 탭 한 번으로 같은 타이머를
  다시 시작할 수 있습니다(× 로 삭제). 프리셋은 앱을 재시작해도 남아 있습니다(AsyncStorage).
- 타이머를 시작하면 그 순간 로컬 알림이 예약됩니다. 앱이 백그라운드거나 화면이 꺼져 있어도, 시간이 되면 소리+배너로
  알림이 옵니다(단, 이 동작은 아직 실제 아이폰에서 검증되지 않았습니다 — 아래 "알려진 한계" 참고).

## 테스트
```
cd product && npm test
```
`jest-expo` 프리셋으로 설정되어 있습니다. 현재 순수 로직 위주로 총 35개 유닛 테스트가 통과합니다:
- `lib/timer.ts` 21개 — 타이머 생성/일시정지/재개/남은시간 계산, 여러 타이머 동시 관리
- `lib/notifications.ts` 7개 — `expo-notifications` 모킹, 권한 요청, 예약/취소
- `lib/presets.ts` 7개 — `AsyncStorage` 모킹, 프리셋 저장/불러오기(손상된 데이터 방어 포함)

타입체크: `npx tsc --noEmit` (통과). `npx expo lint` 는 이 컨테이너 환경의 네트워크 정책이 ESLint 자동 설정에
필요한 호출을 막아 아직 설정하지 못했습니다.

## 구조
```
App.tsx                        StatusBar + Home 화면 렌더링
screens/Home.tsx               타이머 리스트/프리셋 상태 관리, lib 모듈 연결
components/TimerCard.tsx       타이머 1개 표시(남은시간, 일시정지/재개/취소)
components/NewTimerModal.tsx   새 타이머 생성 폼(라벨, 분/초, 프리셋으로 저장)
components/PresetList.tsx      저장된 프리셋 칩 목록(탭해서 시작, ×로 삭제)
lib/timer.ts                   순수 함수: 타이머 생성/일시정지/재개/남은시간 계산 (테스트 21개)
lib/notifications.ts           expo-notifications 래퍼: 권한, 예약, 취소 (테스트 7개)
lib/presets.ts                 AsyncStorage 래퍼: 프리셋 저장/불러오기 (테스트 7개)
```

## 알려진 한계 / 다음 단계 (test phase 로 이연됨)
- **(해결됨, Run #17)** 사람이 실기기 검증을 처음 시도했을 때 `Unable to resolve module @react-native-async-storage/async-storage` 에러가 발생했습니다. 원인은 이 문서의 실행법에 `npm install` 단계가 빠져 있었기 때문입니다(패키지 자체는 `package.json`/`package-lock.json` 에 정상적으로 있음). 위 "실행" 섹션에 `npm install` 단계를 추가했습니다 — 다시 시도해주세요.
- **이 앱의 핵심 가치("확실한 알림")가 아직 실제 아이폰에서 검증되지 않았습니다.** 사람이 구현을 먼저 진행하도록
  지시해(`state/decisions.md` D-011) 이 검증을 `test` phase 로 미뤘습니다. `test` phase 에서 가장 먼저 해야 할 일은
  이 앱을 실기기(Expo Go)에서 열어 타이머를 하나 만든 뒤 화면을 끄거나 앱을 완전히 종료하고, 예약된 시간에 소리+배너
  알림이 실제로 오는지 확인하는 것입니다. 실패하면 `docs/decisions.md` 의 D-007 조건에 따라 이 제품 선정 자체를
  재검토(pivot)해야 합니다.
- 실행 중이던 타이머 목록은 앱을 완전히 재시작하면 사라집니다(의도된 범위 — 설계 문서 `docs/design/mvp.md` 참고).
  단, 이미 예약된 알림 자체는 OS 가 들고 있으므로 앱을 다시 열지 않아도 울립니다.
- `npx expo lint` 미설정(네트워크 정책 문제, 위 참고).

## 패키지 추가 시 참고
- Managed workflow 유지 (`ios/`, `android/` 폴더를 생성하는 prebuild/eject 금지 — Mac 없이 유지보수해야 함)
- 이 컨테이너 환경에서는 `npx expo install <pkg>` 가 호환성 체크 API 호출 때문에 네트워크 정책으로 막혀 있습니다.
  `npm install <pkg>` 로 설치한 뒤 `product/node_modules/expo/bundledNativeModules.json` 에서 설치된 Expo SDK가
  기대하는 정확한 버전을 확인하고, 다르면 `npm install <pkg>@<정확한버전> --save-exact` 로 맞춥니다
  (`state/decisions.md` D-013 에 상세 절차와 사례 기록).
