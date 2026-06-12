import { useEffect, useMemo, useState } from "react";
import { get } from "../../api.js";
import { ContestCard } from "../../components/ContestCard.jsx";
import { EmptyState } from "../../components/EmptyState.jsx";
import { FilterTabs } from "../../components/FilterTabs.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { SearchBar } from "../../components/SearchBar.jsx";
import {
  summarizeTeamsByContest,
  isContestClosed,
  parseDeadline,
  splitCategories,
} from "../../lib/format.js";
import { Trophy } from "lucide-react";

function sortContests(rows, sort) {
  return [...rows].sort((a, b) => {
    if (sort === "latest") {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    const da = parseDeadline(a.registrationDeadline || a.registrationPeriod);
    const db = parseDeadline(b.registrationDeadline || b.registrationPeriod);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da - db;
  });
}

function filterContests(contests, { search, category, closedOnly }) {
  const query = search.trim().toLowerCase();
  return contests.filter((c) => {
    const closed = isContestClosed(c);
    if (closedOnly ? !closed : closed) return false;
    const matchQuery =
      !query || `${c.title} ${c.organizer} ${c.category}`.toLowerCase().includes(query);
    const matchCategory =
      category === "all" || splitCategories(c.category).some((cat) => cat === category);
    return matchQuery && matchCategory;
  });
}

export function ContestList({ search = "", onSearchChange }) {
  const [contests, setContests] = useState([]);
  const [teams, setTeams] = useState([]);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("deadline");
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    get("/contests").then(setContests).catch(() => setContests([]));
    get("/teams").then(setTeams).catch(() => setTeams([]));
  }, []);

  const teamSummaryMap = useMemo(() => summarizeTeamsByContest(teams), [teams]);

  const categories = useMemo(() => {
    const set = new Set();
    contests
      .filter((c) => !isContestClosed(c))
      .forEach((c) => splitCategories(c.category).forEach((cat) => set.add(cat)));
    return ["all", ...Array.from(set).slice(0, 8)];
  }, [contests]);

  const openContests = useMemo(() => {
    const rows = filterContests(contests, { search, category, closedOnly: false });
    return sortContests(rows, sort);
  }, [contests, search, category, sort]);

  const closedContests = useMemo(() => {
    const rows = filterContests(contests, { search, category, closedOnly: true });
    return sortContests(rows, sort);
  }, [contests, search, category, sort]);

  const closedCount = useMemo(() => contests.filter((c) => isContestClosed(c)).length, [contests]);

  return (
    <>
      <PageHeader title="공모전" subtitle="참여 가능한 공모전을 탐색하고 팀을 찾아보세요" />
      <div className="toolbar">
        <SearchBar value={search} onChange={onSearchChange} placeholder="공모전명, 주최, 분야 검색" />
        <FilterTabs
          items={[
            { value: "deadline", label: "마감 임박순" },
            { value: "latest", label: "최신순" },
          ]}
          value={sort}
          onChange={setSort}
        />
      </div>
      <div className="chip-filter-row">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`chip-filter ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat === "all" ? "전체" : cat}
          </button>
        ))}
      </div>

      {openContests.length ? (
        <section className="contest-list-standalone">
          {openContests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              teamSummary={teamSummaryMap.get(contest.id)}
              list
            />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={Trophy}
          title="진행 중인 공모전이 없습니다"
          description="다른 키워드나 카테고리로 다시 검색해보세요."
        />
      )}

      {closedCount > 0 && (
        <div className="closed-contests-toggle-wrap">
          <button
            type="button"
            className="closed-contests-toggle"
            onClick={() => setShowClosed((prev) => !prev)}
            aria-expanded={showClosed}
          >
            {showClosed ? "마감된 공모전 숨기기" : `마감된 공모전 보기 (${closedContests.length})`}
          </button>
        </div>
      )}

      {showClosed && closedContests.length > 0 && (
        <section className="contest-list-standalone closed-contests-section">
          {closedContests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              teamSummary={teamSummaryMap.get(contest.id)}
              list
            />
          ))}
        </section>
      )}

      {showClosed && closedContests.length === 0 && (
        <p className="closed-contests-empty">조건에 맞는 마감된 공모전이 없습니다.</p>
      )}
    </>
  );
}
