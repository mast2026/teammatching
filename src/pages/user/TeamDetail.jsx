import { useEffect, useState } from "react";
import { get, post } from "../../api.js";
import { Field } from "../../components/Field.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { SectionCard } from "../../components/SectionCard.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { emptySurvey } from "../../lib/constants.js";
import { prizeDistributionLabel, statusLabel, surveyLabels } from "../../lib/format.js";
import { go } from "../../lib/navigation.js";

export function TeamDetail({ id }) {
  const [team, setTeam] = useState(null);
  const [message, setMessage] = useState("");
  const [survey, setSurvey] = useState(emptySurvey);

  useEffect(() => {
    get(`/teams/${id}`).then(setTeam).catch(() => setTeam(null));
  }, [id]);

  const apply = async (event) => {
    event.preventDefault();
    await post("/applications", { teamId: id, message, ...survey });
    go("/my-applications");
  };

  if (!team) return <p className="loading-text">팀 정보를 불러오는 중입니다.</p>;

  const memberCount = team.members?.length ?? team.currentMembers ?? 0;
  const prizeLabel = prizeDistributionLabel(team.prizeDistribution);

  return (
    <div className="team-detail-page">
      <PageHeader
        title={team.contestTitle}
        subtitle={`${team.leaderName} 팀장 · ${team.leaderSchool || "학교 미입력"}`}
        action={<StatusBadge status={team.status} />}
      />

      <div className="team-detail-stats">
        <div className="team-stat-card">
          <span className="team-stat-label">모집 인원</span>
          <strong className="team-stat-value">
            {memberCount}/{team.requiredMembers}
          </strong>
          <small>{statusLabel(team.status)}</small>
        </div>
        {prizeLabel ? (
          <div className="team-stat-card">
            <span className="team-stat-label">수상금 배분</span>
            <strong className="team-stat-value">{prizeLabel}</strong>
            <small>입상 시 상금을 나누는 방식</small>
          </div>
        ) : null}
      </div>

      <SectionCard title="팀 소개">
        <p className="team-intro-text">{team.introduction || "팀 소개가 아직 등록되지 않았습니다."}</p>
      </SectionCard>

      <SectionCard title={`팀원 ${memberCount}명`}>
        <ul className="team-member-list">
          {team.members?.map((member) => (
            <li key={member.memberId ?? member.id} className="team-member-item">
              <div className="team-member-main">
                <strong>{member.name}</strong>
                {member.isLeader && <span className="inline-badge">팀장</span>}
              </div>
              <span className="team-member-meta">
                {[member.school, member.generation ? `${member.generation}기` : "", member.major]
                  .filter(Boolean)
                  .join(" · ") || "정보 없음"}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      {team.status === "recruiting" && (
        <form className="admin-form team-apply-form" onSubmit={apply}>
          <h3 className="form-section-title">지원하기</h3>
          <Field label="지원 메시지">
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required />
          </Field>
          {Object.keys(survey).map((key) => (
            <Field key={key} label={surveyLabels[key]}>
              <input value={survey[key]} onChange={(e) => setSurvey({ ...survey, [key]: e.target.value })} />
            </Field>
          ))}
          <button className="btn btn-primary" type="submit">
            지원하기
          </button>
        </form>
      )}
    </div>
  );
}
