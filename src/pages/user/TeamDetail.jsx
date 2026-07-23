import { useEffect, useState } from "react";
import { get, post } from "../../api.js";
import { ChoiceChips } from "../../components/ChoiceChips.jsx";
import { Field } from "../../components/Field.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { SectionCard } from "../../components/SectionCard.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { emptySurvey } from "../../lib/constants.js";
import { prizeDistributionLabel, statusLabel, surveyLabels } from "../../lib/format.js";
import {
  meetingStyleOptions,
  personalityTagOptions,
  skillTagOptions,
  surveyIntensityOptions,
  surveyPurposeOptions,
  surveyTeamStyleOptions
} from "../../lib/matchingForm.js";
import { go } from "../../lib/navigation.js";

export function TeamDetail({ id }) {
  const [team, setTeam] = useState(null);
  const [message, setMessage] = useState("");
  const [survey, setSurvey] = useState(emptySurvey);
  const [capabilityAppeal, setCapabilityAppeal] = useState("");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [personalityTags, setPersonalityTags] = useState([]);
  const [skillTags, setSkillTags] = useState([]);

  useEffect(() => {
    get(`/teams/${id}`).then(setTeam).catch(() => setTeam(null));
  }, [id]);

  const apply = async (event) => {
    event.preventDefault();
    await post("/applications", {
      teamId: id,
      message,
      ...survey,
      capabilityAppeal,
      personalityTags,
      skillTags,
      availabilityNote
    });
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
        {(team.workStyle || team.meetingStyle || team.interestAreas?.length || team.personalityTags?.length || team.skillTags?.length) && (
          <div className="team-structured-meta">
            {team.workStyle && <span>{team.workStyle}</span>}
            {team.meetingStyle && <span>{team.meetingStyle}</span>}
            {team.interestAreas?.map((tag) => <span key={tag}>{tag}</span>)}
            {team.personalityTags?.map((tag) => <span key={tag}>{tag}</span>)}
            {team.skillTags?.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        )}
      </SectionCard>

      {team.neededRoles?.length > 0 && (
        <SectionCard title="찾는 팀원">
          <div className="needed-role-list compact">
            {team.neededRoles.map((role, index) => (
              <article key={`${role.label}-${index}`} className="needed-role-card readonly">
                <span className="needed-role-label">{role.label || String.fromCharCode(65 + index)}</span>
                <strong>{role.title}</strong>
                {role.description && <p>{role.description}</p>}
              </article>
            ))}
          </div>
        </SectionCard>
      )}

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
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="왜 이 팀에 지원하는지 간단히 적어주세요."
              required
            />
          </Field>
          <Field label="무엇을 잘할 수 있나요">
            <textarea
              value={capabilityAppeal}
              onChange={(e) => setCapabilityAppeal(e.target.value)}
              placeholder="내가 맡을 수 있는 일, 경험, 자신 있는 결과물을 적어주세요."
              required
            />
          </Field>
          <div className="field">
            <span>{surveyLabels.surveyPurpose}</span>
            <ChoiceChips options={surveyPurposeOptions} value={survey.surveyPurpose} onChange={(value) => setSurvey({ ...survey, surveyPurpose: value })} multiple={false} />
          </div>
          <div className="field">
            <span>{surveyLabels.surveyIntensity}</span>
            <ChoiceChips options={surveyIntensityOptions} value={survey.surveyIntensity} onChange={(value) => setSurvey({ ...survey, surveyIntensity: value })} multiple={false} />
          </div>
          <div className="field">
            <span>{surveyLabels.surveyRole}</span>
            <ChoiceChips options={skillTagOptions} value={survey.surveyRole} onChange={(value) => setSurvey({ ...survey, surveyRole: value })} multiple={false} />
          </div>
          <Field label={surveyLabels.surveyExperience}>
            <input
              value={survey.surveyExperience}
              onChange={(e) => setSurvey({ ...survey, surveyExperience: e.target.value })}
              placeholder="관련 경험이나 공모전 지원 경험"
            />
          </Field>
          <Field label={surveyLabels.surveyStrengths}>
            <input
              value={survey.surveyStrengths}
              onChange={(e) => setSurvey({ ...survey, surveyStrengths: e.target.value })}
              placeholder="예: 자료조사, 발표, 디자인, 개발"
            />
          </Field>
          <div className="field">
            <span>{surveyLabels.surveyTeamStyle}</span>
            <ChoiceChips options={surveyTeamStyleOptions} value={survey.surveyTeamStyle} onChange={(value) => setSurvey({ ...survey, surveyTeamStyle: value })} multiple={false} />
          </div>
          <div className="field">
            <span>성향</span>
            <ChoiceChips options={personalityTagOptions} value={personalityTags} onChange={setPersonalityTags} />
          </div>
          <div className="field">
            <span>분야/역량</span>
            <ChoiceChips options={skillTagOptions} value={skillTags} onChange={setSkillTags} />
          </div>
          <Field label="회의 가능 방식/시간대">
            <input
              value={availabilityNote}
              onChange={(e) => setAvailabilityNote(e.target.value)}
              placeholder={`${meetingStyleOptions[0]}, 평일 저녁 가능 등`}
            />
          </Field>
          <button className="btn btn-primary" type="submit">
            지원하기
          </button>
        </form>
      )}
    </div>
  );
}
