# 관리자 기능 확장 설정

## 1. Supabase SQL 실행 (필수)

Supabase Dashboard → SQL Editor 에서 아래 파일을 **한 번** 실행하세요.

`supabase_admin_features_migration.sql`

생성되는 테이블:

- `team_matching_announcements` — 공지사항
- `team_matching_notifications` — 관리자 발송 알림
- `team_matching_notification_reads` — 알림 읽음 상태

## 2. 관리자 메뉴

| 경로 | 기능 |
|------|------|
| `/admin` | 대시보드·통계 |
| `/admin/contests` | 공모전 CRUD |
| `/admin/members` | 회원 추가/수정/삭제·팀장 권한 |
| `/admin/teams` | 팀 수정/삭제·지원·팀장 신청 |
| `/admin/awards` | 입상 결과 등록/수정/삭제 |
| `/admin/announcements` | 공지사항 CRUD |
| `/admin/notifications` | 알림 발송·삭제 |

## 3. API 인증

관리자·회원 목록·지원 목록 등 민감 API는 로그인/관리자 권한이 필요합니다.

SQL 미실행 시 공지·알림 API는 빈 배열을 반환하거나 오류가 날 수 있습니다.
