import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ClipboardList, Trophy, UserRound, UsersRound } from "lucide-react";
import { get } from "../../api.js";
import { ApplicationCard } from "../../components/ApplicationCard.jsx";
import { ContestCard } from "../../components/ContestCard.jsx";
import { EmptyState } from "../../components/EmptyState.jsx";
import { QuickActionCard } from "../../components/QuickActionCard.jsx";
import { SectionCard } from "../../components/SectionCard.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { isContestClosed, parseDeadline, summarizeTeamsByContest } from "../../lib/format.js";
import { go } from "../../lib/navigation.js";

const primaryActions = [
  { icon: Trophy, title: "공모전 탐색", href: "/contests" },
  { icon: UsersRound, title: "팀 매칭", href: "/teams" },
  { icon: ClipboardList, title: "내 지원 확인", href: "/my-applications" },
  { icon: UserRound, title: "내 팀", href: "/my-team" },
];

export function UserDashboard({ user }) {
  const [contests, setContests] = useState([]);
  const [teams, setTeams] = useState([]);
  const [applications, setApplications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [myTeams, setMyTeams] = useState([]);

  useEffect(() => {
    get("/contests").then(setContests).catch(() => setContests([]));
    get("/teams").then(setTeams).catch(() => setTeams([]));
    get("/applications/my").then(setApplications).catch(() => setApplications([]));
    get("/teams/my").then(setMyTeams).catch(() => setMyTeams([]));
    get("/announcements").then(setAnnouncements).catch(() => setAnnouncements([]));
  }, []);

  const teamSummaryMap = useMemo(() => summarizeTeamsByContest(teams), [teams]);

  const recommendedContests = useMemo(() => {
    return contests
      .filter((c) => !isContestClosed(c))
      .sort((a, b) => {
        const da = parseDeadline(a.registrationDeadline || a.registrationPeriod);
        const db = parseDeadline(b.registrationDeadline || b.registrationPeriod);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da - db;
      })
      .slice(0, 5);
  }, [contests]);

  const recentApplications = applications.slice(0, 3);
  const matchedCount = applications.filter((a) => a.status === "accepted").length;
  const activeContestCount = contests.filter((c) => !isContestClosed(c)).length;

  return (
    <div className="dashboard-page">
      <section className="welcome-card">
        <h1>{user?.name ?? "회원"}님, 안녕하세요 👋</h1>
        <p>지금 참여할 공모전을 찾아보세요.</p>
      </section>

      <section className="dashboard-action-grid" aria-label="주요 메뉴">
        {primaryActions.map((action) => (
          <QuickActionCard key={action.href} {...action} />
        ))}
      </section>

      <section className="kpi-bar" aria-label="내 활동 요약">
        <div className="kpi-item">
          <span>진행중인 공모전</span>
          <strong>{activeContestCount}</strong>
        </div>
        <div className="kpi-item">
          <span>내가 지원한 공모전</span>
          <strong>{applications.length}</strong>
        </div>
        <div className="kpi-item">
          <span>매칭 완료</span>
          <strong>{matchedCount}</strong>
        </div>
        <div className="kpi-item">
          <span>내 팀</span>
          <strong>{myTeams.length}</strong>
        </div>
      </section>

      <SectionCard title="추천 공모전" href="/contests" className="section-card-flat">
        {recommendedContests.length ? (
          <div className="contest-list-embedded">
            {recommendedContests.map((contest) => (
              <ContestCard
                key={contest.id}
                contest={contest}
                teamSummary={teamSummaryMap.get(contest.id)}
                list
                embedded
              />
            ))}
          </div>
        ) : (
          <EmptyState
            inset
            icon={Trophy}
            title="표시할 공모전이 없어요"
            description="새 공모전이 등록되면 여기에서 확인할 수 있어요."
            action={
              <button type="button" className="btn btn-cta btn-sm" onClick={() => go("/contests")}>
                공모전 보러가기
              </button>
            }
          />
        )}
      </SectionCard>

      <div className="dashboard-bottom-grid">
        <SectionCard title="내 지원 현황" href="/my-applications" className="section-card-flat">
          {recentApplications.length ? (
            <div className="stack-list compact">
              {recentApplications.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </div>
          ) : (
            <EmptyState
              inset
              icon={ClipboardList}
              title="아직 지원한 공모전이 없어요"
              description="관심 있는 공모전을 찾아 팀에 지원해보세요."
              action={
                <button type="button" className="btn btn-cta btn-sm" onClick={() => go("/contests")}>
                  공모전 보러가기
                </button>
              }
            />
          )}
        </SectionCard>

        <SectionCard title="내 팀 상태" href="/my-team" className="section-card-flat">
          {myTeams.length ? (
            <div className="side-team-list">
              {myTeams.slice(0, 3).map((team) => (
                <button key={team.id} type="button" className="side-team-item" onClick={() => go("/my-team")}>
                  <div>
                    <strong className="line-clamp-1">{team.contestTitle || "공모전 팀"}</strong>
                    <span>{team.leaderName ? `${team.leaderName} 팀장` : "팀 정보"}</span>
                  </div>
                  <StatusBadge status={team.status} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              inset
              icon={UsersRound}
              title="아직 소속된 팀이 없어요"
              description="팀에 지원하거나 팀장으로 팀을 만들어보세요."
              action={
                <button type="button" className="btn btn-cta btn-sm" onClick={() => go("/teams")}>
                  팀 찾아보기
                </button>
              }
            />
          )}
        </SectionCard>
      </div>

      <section className="notice-card">
        <header className="notice-card-header">
          <h2>최근 공지</h2>
          <button type="button" className="link-btn" onClick={() => go("/announcements")}>
            전체 보기 <ChevronRight size={14} />
          </button>
        </header>
        <ul className="notice-list">
          {announcements.slice(0, 3).map((item) => (
            <li key={item.id}>
              <span className="notice-title line-clamp-1">{item.title}</span>
              <time>{(item.publishedAt || item.date || "").slice(0, 10).replace(/-/g, ".")}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
