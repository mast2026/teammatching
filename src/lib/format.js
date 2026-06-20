const STATUS_LABELS = {
  recruiting: "모집 중",
  matched: "매칭 완료",
  pending: "검토 중",
  accepted: "수락됨",
  rejected: "거절됨",
  closed: "종료"
};

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "-";
}

export function statusTone(status) {
  if (status === "accepted" || status === "matched") return "success";
  if (status === "rejected") return "danger";
  if (status === "pending" || status === "recruiting") return "warning";
  return "neutral";
}

export function parseDeadline(value) {
  if (!value) return null;
  const normalized = String(value)
    .replace(/\./g, "-")
    .replace(/~/g, " ")
    .replace(/[^\d\-/ ]/g, " ")
    .trim();
  const parts = normalized.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (parts) {
    return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  }
  const short = normalized.match(/(\d{1,2})[/-](\d{1,2})/);
  if (short) {
    const year = new Date().getFullYear();
    return new Date(year, Number(short[1]) - 1, Number(short[2]));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function dDay(value) {
  const date = parseDeadline(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "마감";
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
}

export function isContestClosed(contest) {
  if (!contest || contest.isActive === false) return true;
  const deadline = contest.registrationDeadline || contest.registrationPeriod;
  return dDay(deadline) === "마감";
}

const KST_OPTIONS = { timeZone: "Asia/Seoul" };

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ko-KR", KST_OPTIONS);
}

export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ko-KR", {
    ...KST_OPTIONS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

export function prizeDistributionLabel(value) {
  if (!value) return "";
  const normalized = String(value).trim();
  const labels = {
    균등분배: "균등 분배",
    "균등 분배": "균등 분배",
    협의: "팀 내 협의",
    "팀 내 협의": "팀 내 협의",
    비율: "기여도 비율",
    leader: "팀장 우선 배분"
  };
  return labels[normalized] || normalized;
}

export function truncate(text, max = 80) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function splitCategories(category) {
  if (!category) return [];
  return String(category)
    .split(/[,/|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function formatValue(value) {
  if (typeof value === "boolean") return value ? "Y" : "N";
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export const tableLabels = {
  title: "공모전명",
  organizer: "주최",
  registrationPeriod: "접수 기간",
  category: "분야",
  teamCount: "팀",
  name: "이름",
  school: "학교",
  major: "전공",
  generation: "기수",
  role: "역할",
  isLeader: "팀장",
  hasPassword: "비번 설정",
  applicantName: "지원자",
  contestTitle: "공모전",
  leaderName: "팀장",
  status: "상태",
  leaderPriority: "우선순위",
  surveyRole: "역할",
  created_at: "신청일",
  message: "메시지",
  currentMembers: "인원",
  tag: "태그",
  publishedAt: "게시일",
  isPublished: "상태",
  target: "수신",
  body: "내용",
  awardResult: "결과",
  body: "내용"
};

export function tableLabel(key) {
  return tableLabels[key] || key;
}

export const surveyLabels = {
  surveyPurpose: "참여 목적",
  surveyIntensity: "참여 강도",
  surveyRole: "희망 역할",
  surveyExperience: "경험",
  surveyStrengths: "강점",
  surveyTeamStyle: "팀 스타일"
};

export function countTeamsByContest(teams) {
  const map = new Map();
  for (const team of teams) {
    map.set(team.contestId, (map.get(team.contestId) ?? 0) + 1);
  }
  return map;
}

export function summarizeTeamsByContest(teams) {
  const map = new Map();
  for (const team of teams) {
    if (!team.contestId) continue;
    const entry = map.get(team.contestId) ?? { recruiting: 0, matched: 0 };
    if (team.status === "recruiting") entry.recruiting += 1;
    else if (team.status === "matched") entry.matched += 1;
    map.set(team.contestId, entry);
  }
  return map;
}

export function countApplicationsByTeam(applications) {
  const map = new Map();
  for (const app of applications) {
    map.set(app.teamId, (map.get(app.teamId) ?? 0) + 1);
  }
  return map;
}
