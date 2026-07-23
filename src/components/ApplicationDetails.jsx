import { surveyLabels } from "../lib/format.js";

function joinTags(tags) {
  return Array.isArray(tags) ? tags.filter(Boolean).join(", ") : tags;
}

function DetailRow({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="application-detail-row">
      <span>{label}</span>
      <strong>{Array.isArray(value) ? joinTags(value) : value}</strong>
    </div>
  );
}

export function MemberScore({ score }) {
  if (!score) return null;
  return (
    <div className="member-score">
      <div>
        <span>신뢰도</span>
        <strong>{score.baseTotal}/{score.maxBase}</strong>
      </div>
      <small>
        충실도 {score.profileScore} · 참석 {score.activityScore}
        {score.peerReviewCount ? ` · 동료 ${score.peerScore}` : ""}
        {score.provisional ? " · 참고 점수" : ""}
      </small>
    </div>
  );
}

export function ApplicationDetails({ application }) {
  return (
    <div className="application-details">
      <MemberScore score={application.memberScore} />
      <div className="application-detail-grid">
        <DetailRow label="핵심 어필" value={application.capabilityAppeal} />
        <DetailRow label={surveyLabels.surveyPurpose} value={application.surveyPurpose} />
        <DetailRow label={surveyLabels.surveyIntensity} value={application.surveyIntensity} />
        <DetailRow label={surveyLabels.surveyRole} value={application.surveyRole} />
        <DetailRow label={surveyLabels.surveyExperience} value={application.surveyExperience} />
        <DetailRow label={surveyLabels.surveyStrengths} value={application.surveyStrengths} />
        <DetailRow label={surveyLabels.surveyTeamStyle} value={application.surveyTeamStyle} />
        <DetailRow label="가능 시간" value={application.availabilityNote} />
        <DetailRow label="성향" value={application.personalityTags} />
        <DetailRow label="분야/역량" value={application.skillTags} />
        <DetailRow label="거절 사유" value={application.rejectReason} />
      </div>
    </div>
  );
}
