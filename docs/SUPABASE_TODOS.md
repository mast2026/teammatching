# Supabase / API 후속 작업 제안

이번 UI 고도화 작업에서는 Supabase 및 Netlify Functions API를 **수정하지 않았습니다**.
아래 항목은 추후 별도 승인 후 진행할 수 있는 제안사항입니다.

## 데이터 / 스키마

1. **공지사항 테이블** (`team_matching_announcements`)
   - 현재 `src/data/announcements.fixture.js` mock 데이터 사용
   - 필드 예: `id`, `tag`, `title`, `body`, `published_at`

2. **알림 테이블** (`team_matching_notifications`)
   - 상단 알림 벨 배지용
   - 현재 fixture `notificationCount = 3` 사용

3. **회원 추가/삭제 API**
   - Replit 관리자에 있던 기능
   - 현재 API는 조회·팀장 권한 부여/해제만 지원

4. **팀 상태 전체 enum + PATCH API**
   - UI에 표시 가능한 상태: 모집 중, 매칭 진행 중, 매칭 완료, 매칭 실패, 대기 중, 활동 중, 종료
   - 현재는 `close`/`award` POST 엔드포인트 위주

## API 응답 보강

5. **`GET /dashboard/stats` (사용자 전용)**
   - 현재 사용자 대시보드는 `/contests`, `/teams`, `/applications/my`를 조합해 client-side 집계

6. **`contests` 응답에 `teamCount` 서버 집계**
   - 현재 프론트에서 teams 목록으로 계산

7. **`teams` 응답에 `applicationCount`**
   - 현재 applications 목록을 client-side로 집계

8. **`/admin/stats` 인증 추가**
   - 현재 무인증으로 전체 통계 노출 가능 (보안 개선 필요)

## 데이터 이전

9. **Replit export 데이터 import**
   - `supabase_team_matching_import.sql` 생성·실행은 별도 승인 후
   - 회원/공모전/팀/지원 데이터 포함

## Auth

10. **지도교수 비밀번호 (`ADVISOR_PASSWORD`)**
    - UI는 `/auth/advisor/login` 연동 완료
    - Netlify 환경변수 설정 여부는 배포 환경에서 확인 필요
