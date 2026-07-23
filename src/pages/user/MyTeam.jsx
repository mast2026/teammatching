import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import { get, post } from "../../api.js";
import { ApplicationDetails } from "../../components/ApplicationDetails.jsx";
import { EmptyState } from "../../components/EmptyState.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { SectionCard } from "../../components/SectionCard.jsx";
import { TeamCard } from "../../components/TeamCard.jsx";
import { rejectReasonOptions } from "../../lib/matchingForm.js";
import { go } from "../../lib/navigation.js";

const steps = [
  { step: "1", title: "공모전 선택", text: "참여할 공모전을 고르세요" },
  { step: "2", title: "팀 정보 작성", text: "모집 인원과 팀 소개를 입력하세요" },
  { step: "3", title: "팀원 모집", text: "지원자를 검토하고 팀을 완성하세요" },
];

export function MyTeam({ user }) {
  const [teams, setTeams] = useState([]);
  const [applications, setApplications] = useState([]);
  const [rejectReasons, setRejectReasons] = useState({});

  const refresh = useCallback(() => {
    get("/teams/my").then(setTeams).catch(() => setTeams([]));
    get("/applications").then(setApplications).catch(() => setApplications([]));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const leaderTeamIds = useMemo(
    () => new Set(teams.filter((team) => team.leaderId === user?.id).map((team) => team.id)),
    [teams, user?.id]
  );

  const pendingApplications = useMemo(
    () => applications.filter((row) => leaderTeamIds.has(row.teamId) && row.status === "pending"),
    [applications, leaderTeamIds]
  );

  const handleApplication = async (id, action) => {
    await post(`/applications/${id}/${action}`, {
      rejectReason: action === "reject" ? rejectReasons[id] ?? "기타" : null
    });
    refresh();
  };

  return (
    <>
      <PageHeader
        title="내 팀 관리"
        subtitle="내가 만든 팀과 속한 팀을 관리하세요"
        action={
          <button type="button" className="btn btn-primary" onClick={() => go("/teams")}>
            <Plus size={18} /> 팀 만들기
          </button>
        }
      />

      {pendingApplications.length > 0 && (
        <SectionCard title="받은 지원서" subtitle="팀장으로서 검토가 필요한 지원입니다">
          <div className="application-review-list">
            {pendingApplications.map((row) => (
              <article key={row.id} className="application-review-item">
                <div>
                  <strong>{row.applicantName}</strong>
                  <p>
                    {row.contestTitle} · {row.applicantSchool}
                    {row.applicantGeneration ? ` · ${row.applicantGeneration}기` : ""}
                  </p>
                  {row.message && <p className="application-review-message">{row.message}</p>}
                  <ApplicationDetails application={row} />
                </div>
                <div className="application-review-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleApplication(row.id, "accept")}
                  >
                    승인
                  </button>
                  <select
                    value={rejectReasons[row.id] ?? "기타"}
                    onChange={(event) => setRejectReasons((prev) => ({ ...prev, [row.id]: event.target.value }))}
                    aria-label="거절 사유"
                  >
                    {rejectReasonOptions.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleApplication(row.id, "reject")}
                  >
                    거절
                  </button>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      )}

      {teams.length ? (
        <section className="contest-list-stack">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} showApply={false} list />
          ))}
        </section>
      ) : (
        <div className="empty-page">
          <EmptyState
            icon={UsersRound}
            title="아직 팀이 없습니다"
            description="공모전을 선택하고 팀원을 모집해보세요."
            action={
              <button type="button" className="btn btn-soft btn-sm" onClick={() => go("/teams")}>
                팀 만들기
              </button>
            }
          />
          <section className="steps-card">
            <h3>팀 모집 3단계</h3>
            <div className="steps-grid">
              {steps.map((item) => (
                <article key={item.step}>
                  <span>{item.step}</span>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
