# SEA GANI - 스쿠버다이빙 해양환경 정보 서비스

SEA GANI는 Vue.js 프론트엔드 프레임워크 과제의 날씨 서비스를 국내 스쿠버다이빙 포인트 정보 서비스로 확장한 프로젝트입니다.

다이빙 포인트 검색, 현재 해양 상태 확인, 날짜와 시간대별 다이빙 예보 비교, 다이버 현장 소식 공유 기능을 제공합니다. 단순 Mockup에 머무르지 않고 OpenWeather, 기상청, 국립해양조사원, Copernicus Marine 데이터를 연결해 실제 관측값과 예보값을 화면에 반영했습니다.

이 주제를 선택한 이유는 스쿠버다이빙 강사로 활동하면서 실제 다이빙 준비 과정에 필요하다고 느꼈던 기능을 한곳에 모으고 싶었기 때문입니다. 포인트마다 흩어진 날씨, 파도, 수온, 물때와 조류 정보를 각각 찾아봐야 했던 경험을 바탕으로, 입수 직전의 상태 확인과 주말 투어 계획을 하나의 서비스에서 할 수 있도록 설계했습니다.

현재는 Vue.js 과제로 시작한 프로토타입이지만, 직접 현장에서 사용해 보고 다이버와 강사에게 필요한 기능을 계속 보완하여 실제 서비스로 확장하는 것을 목표로 합니다.

> 이 서비스의 정보는 학습 및 참고용입니다. 실제 입수 여부는 기상특보, 현지 다이빙숍 및 강사의 안내를 함께 확인해 판단해야 합니다.

## 1. 프로젝트 목적

기존 날씨 과제의 핵심 학습 요소를 유지하면서 다음 질문에 답할 수 있는 다이빙 서비스로 주제를 변경했습니다.

- 국내에 어떤 다이빙 포인트가 있는가?
- 오늘 또는 입수 직전 포인트의 해양 상태는 어떤가?
- 이번 주 다이빙 투어는 어느 날짜와 시간대가 적합한가?
- 실제 현장에 있는 다이버가 본 바다 상황은 어떤가?

기능을 많이 보여주는 것보다 다이빙을 준비하는 사용자가 `지금 들어가도 되는가`, `이번 주에는 언제 가는 것이 나은가`를 빠르게 판단하도록 돕는 것을 우선했습니다. 이에 따라 현재 관측과 미래 예보를 같은 화면에 섞지 않고 목적별 화면으로 분리했습니다.

화면의 역할은 다음처럼 구분했습니다.

| 화면 | 목적 | 데이터 성격 |
| --- | --- | --- |
| 포인트 찾기 | 여러 포인트 검색 및 비교 | 포인트 목록과 상태 요약 |
| 상세보기 | 오늘 또는 입수 직전 상태 확인 | 최신 관측값 중심 |
| 다이빙 예보 | 이번 주 투어 날짜와 시간 선택 | 날짜·시간대별 예보값 중심 |
| 현장 소식 | 사용자 제보 확인 및 등록 | 브라우저에 저장되는 커뮤니티 데이터 |

## 2. 주요 기능

### 2.1 포인트 찾기

- 국립해양조사원 스킨스쿠버 지점 API를 이용한 포인트 목록 구성
- 포인트 이름에 지역명을 함께 표시해 동명의 장소를 구분
- 한글 포인트 검색
- 특보 지역, 높은 파고, 강풍 지역 등 요약 카드 필터
- 추천순, 거리순, 관심도순 정렬
- 브라우저 위치 권한을 이용한 포인트 거리 계산
- 즐겨찾기 등록 및 `localStorage` 저장
- 카드 선택에 따른 주의 항목 표시
- 상세보기와 다이빙 예보 화면으로 이동

포인트 현황 카드는 빠른 탐색에 집중하도록 구성했습니다. 수온, 파도, 바람, 물때와 같은 상세 수치는 중복해서 보여주지 않고 상세보기에서 확인하도록 역할을 분리했습니다.

### 2.2 포인트 상세보기

상세보기는 `오늘 또는 입수 직전, 현재 해양 상태를 확인하세요.`라는 목적에 맞춰 최신 관측값을 중심으로 구성했습니다.

- 현재 날씨와 기온
- 기상청 해양기상부이 기준 해수면 수온
- Copernicus Marine 기반 0m, 10m, 20m, 30m 예상 수온
- 파고, 파주기, 파향
- 풍속, 풍향
- 오늘의 물때와 조류 강도
- 만조·간조 시간과 예상 조위
- 기상특보
- 사용한 관측소 이름, 포인트와 관측소 사이의 거리, 관측 시각

상세 페이지는 먼저 기본 정보를 표시하고 느린 Copernicus 수심별 수온은 별도로 불러옵니다. 수온 API 때문에 전체 페이지가 늦게 열리지 않도록 비동기 로딩을 분리했습니다.

### 2.3 다이빙 예보

다이빙 예보는 `이번 주 다이빙 계획을 위해 날짜와 시간대별 예보를 비교하세요.`라는 목적에 맞춰 예측값 중심으로 구성했습니다.

- 최대 풍속, 강수확률, 파고를 바탕으로 날짜별 `무난`, `확인 필요`, `주의` 요약
- 5일간 3시간 단위 날씨 예보
- 시간대별 날씨, 기온, 강수확률
- 풍속과 풍향
- 기상청 예상 유의파고
- 해상 예보구역 기준 파주기와 파향
- 국립해양조사원 예보 기준 물때와 조류 강도
- 선택 날짜의 만조·간조 시간
- 선택 포인트 중심의 OpenStreetMap 지도
- 바람, 파도, 강수 레이어 전환
- 시간대별 예보 자동 재생

예보 파주기와 파향이 없을 때 현재 부이값으로 대체하지 않습니다. 예보 화면에는 예보 자료만 표시하고, 가까운 해양기상부이의 현재 관측값은 별도의 `해양 현재 관측` 카드에 분리해 오해를 줄였습니다.

파도 지도 애니메이션은 실제 파향을 재현하지 않습니다. 유의파고가 높을수록 선택 포인트 주변의 파문이 조금 더 크고 선명하게 보이는 참고용 시각화입니다.

### 2.4 현장 소식

- 실제 포인트 카탈로그를 이용한 작성 포인트 선택
- 닉네임, 수중 시야, 파도 상태, 혼잡도, 자유 내용 입력
- 입수하지 않고 밖에서 본 상황도 작성할 수 있도록 시야에 `모름` 제공
- 포인트별 현장 소식 필터
- 등록 내용을 `localStorage`에 저장
- Element Plus `ElMessage`를 이용한 입력 경고 및 성공 알림
- Element Plus `ElMessageBox`를 이용한 등록 전 확인창

현재 현장 소식은 과제용 브라우저 저장 방식이므로 다른 사용자와 서버를 통해 공유되지는 않습니다.

### 2.5 기타 화면

- 안전 가이드
- 서비스 소개
- 존재하지 않는 주소의 404 페이지
- 섭씨·화씨 단위 전환
- 모바일 및 태블릿 반응형 레이아웃

## 3. 사용한 외부 데이터와 API

### OpenWeather

사용 목적:

- 현재 날씨와 기온
- 5일·3시간 날씨 예보
- 강수확률과 강수량
- 풍속과 풍향

클라이언트의 `VITE_OPENWEATHER_API_KEY`를 사용하며 Axios로 요청합니다.

### 기상청 API허브

사용 목적:

- 가까운 해양기상부이의 관측값
- 유의파고, 최대파고, 평균파고
- 파주기와 파향
- 해수면 수온
- 해상 세부구역 예보
- 단기예보 격자 `WAV` 파고
- 기상특보

포인트 좌표와 가장 가까운 자료 보유 관측소를 계산해 사용합니다. 해상 예보의 파주기와 파향은 포인트의 정확한 좌표가 아니라 포인트가 속한 해상 예보구역 기준입니다.

로컬에서는 Vite 프록시의 `/kma-api` 경로를 사용하고, Vercel에서는 `vercel.json`의 외부 rewrite를 통해 기상청 API허브로 전달합니다.

### 국립해양조사원 스킨스쿠버 지수 API

사용 목적:

- 국내 스킨스쿠버 포인트 목록
- 포인트 좌표
- 예보 날짜와 오전·오후 구분
- 물때
- 최소·최대 파고
- 최소·최대 예상 유속
- 최소·최대 수온
- 스킨스쿠버 지수와 점수

API에서 제공하는 최소·최대 유속 중 최대 예상 유속을 기준으로 조류 강도를 다음처럼 분류합니다.

| 최대 예상 유속 | 표시 |
| --- | --- |
| 0.3m/s 미만 | 잔잔 |
| 0.3m/s 이상 0.7m/s 미만 | 보통 |
| 0.7m/s 이상 1.0m/s 미만 | 강함 |
| 1.0m/s 이상 | 매우 강함 |

### 국립해양조사원 조석 예보 API

사용 목적:

- 포인트에서 가장 가까운 조석 관측소 선택
- 날짜별 만조·간조 시간
- 예상 조위
- 포인트와 관측소 사이의 거리

로컬에서는 `/khoa-tide-api`, Vercel에서는 외부 rewrite를 통해 공공데이터포털 API로 요청합니다.

### Copernicus Marine

사용 데이터셋:

```text
cmems_mod_glo_phy-thetao_anfc_0.083deg_PT6H-i
```

사용 목적:

- 포인트 주변 해양모델 격자 검색
- 약 0m, 10m, 20m, 30m 수심의 예상 수온 조회

Copernicus 계정정보를 브라우저에 노출하지 않기 위해 Vercel Python Function인 `/api/water-temperature`에서 조회합니다.

- 한국 주변 좌표만 요청 가능
- 포인트 주변 반경에서 유효한 해양 격자 선택
- 약 8~9km 해상도의 모델 예측값 사용
- 서버 3시간 캐시
- 브라우저 3시간 캐시
- 첫 요청이 느릴 수 있어 클라이언트 제한 시간 60초 적용
- 상세 페이지 본문과 수심별 수온 로딩을 분리

Copernicus 값은 모델 예측값이므로 실제 현장 수온과 차이가 있을 수 있습니다.

### OpenStreetMap 및 Leaflet

- OpenStreetMap 타일을 실제 지도 배경으로 사용
- Leaflet으로 지도 확대·축소, 포인트 이동 및 마커 표시 구현
- 포인트 변경 시 선택 포인트 좌표로 지도 이동

## 4. Vue.js 과제 요구사항 반영

| 과제 학습 요소 | 프로젝트 반영 내용 |
| --- | --- |
| 배열 렌더링 `v-for` | 포인트 카드, 날짜 탭, 시간대 예보, 조석 이벤트, 현장 소식 목록 반복 출력 |
| 조건부 렌더링 `v-if` | 로딩·오류·빈 결과·특보·API 자료 유무·선택 상태 분기 |
| 양방향 바인딩 `v-model` | 포인트 검색, 필터, 예보 포인트 선택, 현장 소식 작성 폼 |
| 이벤트와 수식어 | 카드 선택, 버튼 클릭, `@click.stop`, `@submit.prevent` |
| `ref` | 검색어, 선택 포인트, API 데이터, 폼, 로딩 상태 관리 |
| `computed` | 필터 결과, 날짜별 상태, 선택 시간 예보, 조류 강도 등 파생 상태 계산 |
| `watch` | 포인트·날짜·시간 선택 변경에 따른 API 및 지도 갱신 |
| `watchEffect` | 검색 조건과 반응형 상태 추적 실습 |
| Props | 부모의 포인트·알림·필터 데이터를 하위 컴포넌트에 전달 |
| Emits | 검색 변경, 카드 선택, 상세보기, 예보 보기, 즐겨찾기 이벤트를 부모에 전달 |
| Slot | `BaseDashboardCard`에 검색 및 목록 콘텐츠 주입 |
| Component | 검색창, 카드, 환경 요약, 단위 토글 등을 재사용 컴포넌트로 분리 |
| Lifecycle | `onMounted`에서 포인트 카탈로그와 API 자료 로딩, `onUnmounted`에서 타이머·지도 정리 |
| Vue Router | 지연 로딩, 동적 상세 경로, 프로그래밍 방식 이동, Catch-all 404 적용 |
| Pinia | 섭씨·화씨 단위 상태와 변환 기능을 전역 Store로 관리 |
| Axios | OpenWeather 및 공공 API 통신과 오류 처리 |
| 외부 UI 라이브러리 | Element Plus의 Message와 MessageBox를 현장 소식 등록에 적용 |
| 외부 라이브러리 | Leaflet 기반 실제 지도 구현 |
| Modern JavaScript | 구조 분해, 스프레드, 옵셔널 체이닝, 널 병합, async/await, Promise 병렬 처리 |
| 환경변수 | API 인증정보를 `.env.local`과 Vercel 환경변수로 분리 |
| 코드 품질 | ESLint, Oxlint, Prettier 적용 |
| Build | Vite 프로덕션 빌드 및 Vercel 배포 설정 |

## 5. 컴포넌트 및 화면 구조

```text
src/
├── components/
│   ├── common/
│   │   ├── BaseDashboardCard.vue
│   │   ├── SearchBar.vue
│   │   └── UnitToggler.vue
│   └── diving/
│       ├── DivingCard.vue
│       ├── DivingParent.vue
│       ├── EnvironmentSummary.vue
│       └── TideInformation.vue
├── router/
│   └── index.js
├── services/
│   ├── copernicusApi.js
│   ├── khoaScubaApi.js
│   ├── khoaTideApi.js
│   ├── kmaApi.js
│   ├── openWeatherApi.js
│   ├── scubaSpotCatalog.js
│   └── spotRegion.js
├── stores/
│   └── configStore.js
└── views/
    ├── DivingHomeView.vue
    ├── DivingDetailView.vue
    ├── DivingForecastView.vue
    ├── PointUpdatesView.vue
    ├── DivingSafetyView.vue
    ├── DivingAboutView.vue
    └── NotFoundView.vue

api/
└── water-temperature.py
```

## 6. 라우팅

| 주소 | 화면 |
| --- | --- |
| `/` | 포인트 찾기 |
| `/diving/:spotId` | 포인트 상세보기 |
| `/forecast` | 다이빙 예보 |
| `/updates` | 현장 소식 |
| `/safety` | 안전 가이드 |
| `/about` | 서비스 소개 |
| `/:pathMatch(.*)*` | 404 페이지 |

모든 페이지 컴포넌트는 동적 import를 이용해 지연 로딩합니다. Vercel에서는 SPA 하위 주소를 새로고침해도 404가 발생하지 않도록 `vercel.json`에 `index.html` rewrite를 설정했습니다.

## 7. 상태 저장과 캐시

### Pinia

- 현재 온도 단위
- 섭씨·화씨 변환 및 표시

### localStorage

- 온도 단위
- 즐겨찾기 포인트
- 현장 소식
- Copernicus 수심별 수온 3시간 캐시

### sessionStorage

- 선택한 포인트
- API에서 불러온 포인트 카탈로그와 상세 화면 전달 데이터

### 서버 메모리 캐시

- Copernicus Python Function의 동일 좌표 결과를 3시간 저장

## 8. 기술 스택

| 분류 | 기술 |
| --- | --- |
| Framework | Vue 3 Composition API |
| Build Tool | Vite 8 |
| Routing | Vue Router |
| State Management | Pinia |
| HTTP Client | Axios |
| Map | Leaflet, OpenStreetMap |
| UI Library | Element Plus |
| Serverless API | Vercel Python Function |
| Ocean Model Client | Copernicus Marine Python API |
| Quality | ESLint, Oxlint, Prettier |
| Deployment | Vercel |

## 9. 로컬 실행 방법

### 요구 환경

- Node.js `20.19.0 이상` 또는 `22.12.0 이상`
- npm
- Copernicus 수심별 수온을 사용할 경우 Python과 별도 가상환경

### 패키지 설치

```bash
npm install
```

### 환경변수 설정

프로젝트 루트에 `.env.local`을 만들고 `.env.example`을 참고해 다음 값을 설정합니다.

```env
VITE_OPENWEATHER_API_KEY=OpenWeather_인증키
VITE_KMA_API_KEY=기상청_API허브_인증키
VITE_KHOA_API_KEY=공공데이터포털_Decoding_인증키

COPERNICUSMARINE_SERVICE_USERNAME=Copernicus_계정_이메일
COPERNICUSMARINE_SERVICE_PASSWORD=Copernicus_계정_비밀번호
```

`VITE_`로 시작하는 값은 Vite 빌드 시 브라우저 코드에 포함될 수 있습니다. 실제 운영 서비스에서는 공공 API 요청도 서버 함수로 이전하는 방식이 더 안전합니다.

### 일반 개발 서버 실행

```bash
npm run dev
```

이 방식은 Vue 화면과 Vite 프록시를 실행하지만 Copernicus 로컬 Python API는 실행하지 않습니다.

### Copernicus를 포함한 로컬 실행

가상환경을 만들고 Python 패키지를 설치합니다.

```bash
python3 -m venv .venv-copernicus
source .venv-copernicus/bin/activate
pip install -r requirements.txt
```

Copernicus 로그인을 확인한 후 통합 개발 서버를 실행합니다.

```bash
copernicusmarine login
npm run dev:full
```

`dev:full`은 Vite 개발 서버와 `127.0.0.1:8787`의 로컬 Copernicus API를 함께 실행합니다. 로컬 Python API는 여러 요청을 동시에 처리할 수 있도록 `ThreadingHTTPServer`를 사용합니다.

## 10. 코드 품질과 빌드

### 전체 정적 검사

```bash
npm run lint
```

ESLint와 Oxlint를 순서대로 실행합니다. Vercel이 로컬에서 자동 생성한 `.vercel` 캐시는 검사 대상에서 제외합니다.

### 코드 포맷팅

```bash
npm run format
```

### 프로덕션 빌드

```bash
npm run build
```

빌드 결과는 `dist` 폴더에 생성됩니다.

### 빌드 결과 미리보기

```bash
npm run preview
```

## 11. Vercel 배포

Vercel 프로젝트의 Build Command와 Output Directory는 다음과 같습니다.

```text
Build Command: npm run build
Output Directory: dist
```

Vercel 프로젝트의 `Settings > Environment Variables`에 다음 5개 변수를 등록합니다.

```text
VITE_OPENWEATHER_API_KEY
VITE_KMA_API_KEY
VITE_KHOA_API_KEY
COPERNICUSMARINE_SERVICE_USERNAME
COPERNICUSMARINE_SERVICE_PASSWORD
```

각 값은 로컬 `.env.local`의 등호 오른쪽 값을 입력합니다. 배포 환경에 맞게 Production, Preview, Development 범위를 선택한 뒤 다시 배포해야 적용됩니다.

`vercel.json`에는 다음 설정이 포함되어 있습니다.

- `/kma-api`를 기상청 API허브로 전달
- `/khoa-api`를 국립해양조사원 스킨스쿠버 API로 전달
- `/khoa-tide-api`를 국립해양조사원 조석 API로 전달
- `/api/water-temperature` Python Function 유지
- Vue Router 하위 주소 새로고침을 위한 SPA rewrite

## 12. 데이터 해석 시 주의사항

- 다이빙 포인트와 관측소의 위치가 같지 않을 수 있습니다.
- 상세보기의 해양 자료는 가장 가까운 자료 보유 관측소를 사용합니다.
- 기상청 해상예보의 파향과 파주기는 포인트 좌표가 아니라 해상 예보구역 기준입니다.
- Copernicus 수심별 수온은 약 8~9km 해상도의 모델 예측값입니다.
- 파도 지도 애니메이션은 실제 파향이나 파도의 이동 경로가 아닙니다.
- 현장 소식은 사용자 입력이며 공식 관측자료가 아닙니다.
- API 제공기관의 갱신 시각, 관측 누락 및 네트워크 상태에 따라 일부 값이 `자료 없음`으로 표시될 수 있습니다.
- 이 서비스만으로 입수 여부를 판단해서는 안 됩니다.

## 13. 과제를 통해 확장한 내용

강의의 기본 날씨 카드 과제를 다음과 같이 개인화하고 확장했습니다.

1. 도시 날씨 데이터를 국내 스쿠버다이빙 포인트 데이터로 변경했습니다.
2. 단일 날씨 API에서 기상청, 국립해양조사원, Copernicus Marine을 결합한 다중 API 구조로 확장했습니다.
3. 단순 카드 상세 알림을 동적 라우팅 기반 상세 페이지로 변경했습니다.
4. 현재 상태 확인과 미래 투어 계획이라는 사용자 목적에 따라 상세보기와 예보 화면을 분리했습니다.
5. 실제 지도, 시간대 재생, 파고 시각화, 날짜별 상태 비교 기능을 추가했습니다.
6. 현장 소식 작성과 포인트별 필터 기능을 추가했습니다.
7. Pinia로 온도 단위를 전역 관리하고 브라우저 저장 기능을 연결했습니다.
8. Element Plus를 이용해 등록 과정의 확인과 피드백 UX를 개선했습니다.
9. Copernicus 인증정보 보호를 위해 Python 서버리스 함수를 구성했습니다.
10. 느린 외부 API에 대응하기 위해 부분 로딩, 시간 제한, 브라우저·서버 캐시를 적용했습니다.

## 14. 향후 확장 계획

과제 제출 이후에도 실제 다이빙 투어 준비와 현장 사용을 통해 불편한 점을 확인하고 다음 기능을 단계적으로 검토할 계획입니다.

- 실제 사용자 계정과 다이버 프로필
- 서버 데이터베이스를 이용한 현장 소식 공유
- 다이빙숍 및 강사의 포인트 상태 공지
- 포인트별 입수 방식, 최대 수심, 난이도와 주의사항
- 보트·비치 다이빙 구분과 운영 정보
- 사용자 제보 신뢰도와 최신성 표시
- 즐겨찾기 포인트의 주말 조건 알림
- 여러 포인트의 날짜별 예보 비교
- 실제 투어 후 관측값과 예보값의 차이 기록
- 국내 해역에 적합한 조류 및 수온 데이터 추가 검증
- 모바일 현장 사용성을 고려한 화면과 성능 개선

실제 다이빙 안전 판단을 대신하는 서비스가 아니라, 여러 공식 자료와 현장 정보를 이해하기 쉽게 모아 강사와 다이버의 준비 과정을 돕는 도구로 발전시키는 것이 장기 목표입니다.
