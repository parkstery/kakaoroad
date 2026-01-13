
# 카카오맵 경로 탐색기 (Next.js 버전)

이 프로젝트는 카카오맵 API와 Next.js App Router를 사용하여 CORS 문제 없이 경로 탐색 기능을 제공하는 풀스택 애플리케이션입니다.

## 🚀 배포 가이드 (GitHub + Vercel)

이 프로젝트를 무료로 배포하려면 다음 단계를 따라주세요.

### 1. GitHub 저장소 생성
1. [GitHub](https://github.com)에 로그인하고 새 리포지토리(Repository)를 생성합니다.
2. 현재 프로젝트 코드를 해당 리포지토리에 푸시합니다.

### 2. Vercel 프로젝트 생성
1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속합니다.
2. **Add New...** > **Project**를 클릭합니다.
3. GitHub 계정을 연동하고, 방금 생성한 리포지토리를 **Import** 합니다.

### 3. 환경 변수 설정 (필수!)
배포 설정 화면의 **Environment Variables** 섹션에 다음 변수들을 반드시 추가해야 합니다.

| Key | Value | 설명 |
|-----|-------|------|
| `NEXT_PUBLIC_KAKAO_JS_KEY` | `8d2d116d6a534a98e73133808f5843a6` | 브라우저에서 지도를 띄울 때 사용하는 JavaScript 키 |
| `KAKAO_REST_API_KEY` | `8d2d116d6a534a98e73133808f5843a6` | 서버에서 경로 데이터를 받아올 때 사용하는 REST API 키 |

*참고: 카카오 개발자 센터 설정에 따라 JavaScript 키와 REST API 키가 다를 수 있습니다. 현재는 편의상 동일한 키를 기재했습니다.*

### 4. 배포 (Deploy)
1. **Deploy** 버튼을 클릭합니다.
2. 약 1~2분 후 배포가 완료되며, 제공된 도메인으로 접속하여 서비스를 확인할 수 있습니다.

## 🛠️ 주요 기능
- **CORS 해결**: Next.js API Routes를 프록시로 사용하여 브라우저가 아닌 서버가 카카오 API를 호출합니다.
- **보안 강화**: API Key가 브라우저에 노출되지 않고 서버 환경 변수로 안전하게 관리됩니다.
- **로드뷰 연동**: 경로 탐색 시 실제 주행 시뮬레이션을 로드뷰로 확인할 수 있습니다.
