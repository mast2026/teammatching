export const neededRoleLabels = ["A", "B", "C"];

export const workStyleOptions = [
  "빠르게 출품까지",
  "완성도 중심",
  "아이디어 검증 중심",
  "수상 목표",
  "경험/포트폴리오 중심"
];

export const meetingStyleOptions = [
  "온라인 위주",
  "오프라인 위주",
  "온오프라인 병행",
  "평일 저녁",
  "주말 집중"
];

export const interestAreaOptions = [
  "AI/데이터",
  "XR/메타버스",
  "기획/아이디어",
  "서비스 개발",
  "디자인",
  "마케팅",
  "창업",
  "공공/사회문제"
];

export const personalityTagOptions = [
  "성실함",
  "리더십",
  "문서화",
  "빠른 실행",
  "꼼꼼함",
  "아이디어형",
  "소통 선호",
  "수상 욕심"
];

export const skillTagOptions = [
  "기획",
  "리서치",
  "문서 작성",
  "발표",
  "디자인",
  "프론트엔드",
  "백엔드",
  "데이터 분석",
  "AI/LLM",
  "영상/콘텐츠"
];

export const rejectReasonOptions = [
  "아이디어 방향 불일치",
  "회의 일정 불일치",
  "개인 사정",
  "기타"
];

export const surveyPurposeOptions = [
  "수상 목표",
  "실전 경험",
  "포트폴리오",
  "네트워킹",
  "아이디어 검증"
];

export const surveyIntensityOptions = [
  "가볍게 참여",
  "주 1회 정도",
  "평일 대면 가능",
  "온라인 위주",
  "마감 전 집중 가능"
];

export const surveyTeamStyleOptions = [
  "빡센 팀 선호",
  "균형형 선호",
  "느슨한 팀 선호",
  "상관없음"
];

export const defaultNeededRoles = neededRoleLabels.map((label) => ({
  label,
  title: "",
  description: ""
}));
