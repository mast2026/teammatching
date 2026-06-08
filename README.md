# MAST Team Matching

MAST 공모전 팀 매칭 플랫폼을 Replit 서비스 종료에 대비해 재구현한 저장소입니다.

## Stack

- Vite + React
- Netlify static hosting
- Netlify Functions API
- Supabase PostgreSQL

## Supabase Safety Rule

이 앱은 기존 홍보 인증 서비스와 같은 Supabase 프로젝트를 사용할 수 있도록 설계되어 있습니다.

절대 직접 수정하지 않는 기존 영역:

- `public.members`
- `public.promotion_*`
- `storage.proofs`
- `storage.missions`

팀 매칭 앱은 `public.team_matching_*` 테이블만 읽고 씁니다.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
ADVISOR_PASSWORD=
VITE_API_BASE=/.netlify/functions/api
```

`SUPABASE_SERVICE_ROLE_KEY`는 Netlify Functions 서버 환경에만 넣어야 합니다. 브라우저에 노출되는 `VITE_*` 변수로 넣지 마세요.

## Migration

1. Supabase SQL editor에서 schema를 실행합니다.

```sql
-- supabase_team_matching_schema.sql
```

2. Replit export JSON을 로컬에 둡니다.

기본 위치:

```text
.local-data/
```

필수 파일:

- `members.json`
- `contests.json`
- `teams.json`
- `applications.json`
- `leader-applications.json`
- `awards.json`

3. import SQL을 생성합니다.

```bash
npm run import:sql
```

4. 생성된 `supabase_team_matching_import.sql`을 Supabase SQL editor에서 실행합니다.

주의: import SQL에는 회원 데이터가 포함되므로 `.gitignore` 되어 있고 커밋하면 안 됩니다.

## Verification

```bash
npm run build
```

Current exported Replit counts:

- members: 59
- contests: 10
- teams: 8
- team members: 21
- applications: 36
- leader applications: 10
- awards: 0
