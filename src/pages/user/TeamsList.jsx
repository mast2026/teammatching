import { useEffect, useMemo, useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import { get, post } from "../../api.js";
import { EmptyState } from "../../components/EmptyState.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { SearchBar } from "../../components/SearchBar.jsx";
import { TeamCard } from "../../components/TeamCard.jsx";
import { TeamCreateModal } from "../../components/TeamCreateModal.jsx";
import { countApplicationsByTeam } from "../../lib/format.js";
import { getQueryParam, go } from "../../lib/navigation.js";

function readContestFilter() {
  return getQueryParam("contest") || "all";
}

export function TeamsList({ search = "", onSearchChange }) {
  const [teams, setTeams] = useState([]);
  const [contests, setContests] = useState([]);
  const [applications, setApplications] = useState([]);
  const [contestFilter, setContestFilter] = useState(readContestFilter);
  const [statusFilter, setStatusFilter] = useState("recruiting");
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = () => {
    get("/teams").then(setTeams).catch(() => setTeams([]));
    get("/applications").then(setApplications).catch(() => setApplications([]));
    get("/contests").then(setContests).catch(() => setContests([]));
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const sync = () => setContestFilter(readContestFilter());
    window.addEventListener("mast:navigate", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("mast:navigate", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  const activeContest = contests.find((c) => String(c.id) === String(contestFilter));
  const updateContestFilter = (value) => {
    setContestFilter(value);
    go(value === "all" ? "/teams" : `/teams?contest=${value}`);
  };

  const appCountMap = useMemo(() => countApplicationsByTeam(applications), [applications]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return teams.filter((team) => {
      const matchQuery =
        !query ||
        `${team.contestTitle} ${team.leaderName} ${team.introduction} ${team.leaderSchool}`.toLowerCase().includes(query);
      const matchContest = contestFilter === "all" || String(team.contestId) === contestFilter;
      const matchStatus = statusFilter === "all" || team.status === statusFilter;
      return matchQuery && matchContest && matchStatus;
    });
  }, [teams, search, contestFilter, statusFilter]);

  const createTeam = async (form) => {
    await post("/teams", form);
    refresh();
    go("/my-team");
  };

  return (
    <>
      <PageHeader
        title="팀 매칭"
        subtitle="모집 중인 팀을 확인하고 합류를 신청하세요"
        action={
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={18} /> 팀 만들기
          </button>
        }
      />
      {activeContest && (
        <div className="teams-contest-banner">
          <div>
            <strong>{activeContest.title}</strong>
            <span>이 공모전에 참여하는 팀 목록입니다.</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateContestFilter("all")}>
            전체 보기
          </button>
        </div>
      )}
      <div className="toolbar">
        <SearchBar value={search} onChange={onSearchChange} placeholder="팀명, 팀장, 공모전 검색" />
        <select value={contestFilter} onChange={(e) => updateContestFilter(e.target.value)}>
          <option value="all">전체 공모전</option>
          {contests.map((contest) => (
            <option key={contest.id} value={contest.id}>{contest.title}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="recruiting">모집 중</option>
          <option value="matched">매칭 완료</option>
          <option value="all">전체 상태</option>
        </select>
      </div>
      <TeamCreateModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={createTeam} />
      {filtered.length ? (
        <section className="contest-list-standalone">
          {filtered.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              applicationCount={appCountMap.get(team.id) ?? 0}
              showApply
              list
            />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={UsersRound}
          title={activeContest ? "이 공모전에 모집 중인 팀이 없습니다" : "모집 중인 팀이 없습니다"}
          description={
            activeContest
              ? "아직 이 공모전에 팀이 없거나 모집이 마감되었습니다. 직접 팀을 만들어보세요."
              : "다른 공모전을 선택하거나, 직접 팀을 만들어보세요."
          }
          action={
            <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
              팀 만들기
            </button>
          }
        />
      )}
    </>
  );
}
