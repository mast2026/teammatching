import { useEffect, useState } from "react";
import {
  ClipboardList,
  Trophy,
  UserRoundCog,
  UsersRound
} from "lucide-react";
import { get } from "../../api.js";
import { DataTable } from "../../components/DataTable.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { QuickActionCard } from "../../components/QuickActionCard.jsx";
import { SectionCard } from "../../components/SectionCard.jsx";
import { StatCard } from "../../components/StatCard.jsx";

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    get("/admin/stats").then(setStats).catch(() => setStats({}));
    get("/teams").then(setTeams).catch(() => setTeams([]));
    get("/applications").then(setApplications).catch(() => setApplications([]));
  }, []);

  const cards = [
    ["totalMembers", "전체 회원", UserRoundCog, "blue"],
    ["totalLeaders", "팀장", UserRoundCog, "gold"],
    ["totalContests", "공모전", Trophy, "sky"],
    ["totalTeams", "전체 팀", UsersRound, "purple"],
    ["recruitingTeams", "모집 중인 팀", UsersRound, "green"],
    ["totalApplications", "전체 지원", ClipboardList, "orange"],
    ["pendingApplications", "검토 대기 중", ClipboardList, "red"]
  ];

  return (
    <>
      <PageHeader title="관리자 대시보드" subtitle="MAST 공모전 팀 매칭 전체 현황" />
      <section className="stat-grid">
        {cards.map(([key, label, Icon, tone]) => (
          <StatCard key={key} icon={Icon} value={stats?.[key] ?? "-"} label={label} tone={tone} />
        ))}
      </section>
      <section className="quick-action-grid">
        <QuickActionCard icon={Trophy} title="공모전" text="공모전 추가/수정/삭제" href="/admin/contests" />
        <QuickActionCard icon={UserRoundCog} title="회원" text="회원 등록/수정/삭제·팀장 권한" href="/admin/members" />
        <QuickActionCard icon={UsersRound} title="팀·지원" text="팀 수정/삭제·지원·팀장 신청" href="/admin/teams" />
      </section>
      <div className="admin-preview-grid">
        <SectionCard title="최근 지원" href="/admin/teams" className="dashboard-preview-card">
          <DataTable
            fluid
            wrap
            compact
            rows={applications.slice(0, 5)}
            columns={["applicantName", "contestTitle", "status", "created_at"]}
          />
        </SectionCard>
        <SectionCard title="최근 생성 팀" href="/admin/teams" className="dashboard-preview-card">
          <DataTable
            fluid
            wrap
            compact
            rows={teams.slice(0, 5).map((team) => ({
              id: team.id,
              contestTitle: team.contestTitle,
              leaderName: team.leaderName,
              status: team.status,
              currentMembers: `${team.currentMembers}/${team.requiredMembers}`
            }))}
            columns={["contestTitle", "leaderName", "status", "currentMembers"]}
          />
        </SectionCard>
      </div>
    </>
  );
}
