import { useCallback, useEffect, useMemo, useState } from "react";
import { del, get, patch, post } from "./api.js";

const makeIcon = (glyph) => function Icon({ size = 18 }) {
  return <span className="ui-icon" style={{ width: size, height: size, fontSize: Math.max(12, size - 4) }}>{glyph}</span>;
};

const Award = makeIcon("★");
const ChevronRight = makeIcon("›");
const Grid2X2 = makeIcon("▦");
const LogOut = makeIcon("↗");
const Medal = makeIcon("◎");
const Plus = makeIcon("+");
const Search = makeIcon("⌕");
const ShieldCheck = makeIcon("✓");
const Trophy = makeIcon("♕");
const UserRoundCog = makeIcon("◉");
const UsersRound = makeIcon("●");

const nav = [
  { href: "/admin", label: "관리자 대시보드", icon: Grid2X2, admin: true },
  { href: "/admin/contests", label: "공모전 관리", icon: Trophy, admin: true },
  { href: "/admin/members", label: "회원 관리", icon: UserRoundCog, admin: true },
  { href: "/admin/teams", label: "팀 관리", icon: UsersRound, admin: true },
  { href: "/awards", label: "입상 결과", icon: Medal },
  { href: "/contests", label: "공모전", icon: Trophy },
  { href: "/teams", label: "팀 찾기", icon: UsersRound },
  { href: "/leader-apply", label: "팀장 신청", icon: ShieldCheck }
];

const emptyContest = {
  title: "",
  organizer: "",
  prize: "",
  registrationPeriod: "",
  category: "",
  description: "",
  isActive: true,
  link: "",
  registrationDeadline: "",
  awardCount: 0,
  maxTeamSize: 5,
  duplicateAllowed: false,
  hasPresentation: false,
  presentationDate: "",
  hackathonDate: "",
  linkedCommercialization: false,
  hasCertificate: false,
  notes: ""
};

function route() {
  return window.location.pathname || "/";
}

function go(path) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new Event("mast:navigate"));
}

function useRoute() {
  const [path, setPath] = useState(route());
  useEffect(() => {
    const update = () => setPath(route());
    window.addEventListener("popstate", update);
    window.addEventListener("mast:navigate", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("mast:navigate", update);
    };
  }, []);
  return path;
}

function App() {
  const path = useRoute();
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const res = await get("/auth/me");
      setUser(res.member);
    } catch {
      setUser(null);
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const logout = async () => {
    await post("/auth/logout", {});
    setUser(null);
    go("/");
  };

  if (booting) return <Splash />;
  if (!user && ["/", "/admin"].includes(path)) return <Login onLogin={setUser} />;

  return (
    <Shell user={user} path={path} onLogout={logout}>
      <Router path={path} user={user} setUser={setUser} />
    </Shell>
  );
}

function Router({ path, user, setUser }) {
  if (!user && path !== "/") return <Login onLogin={setUser} memberMode />;
  if (path === "/" || path === "/dashboard") return <Dashboard />;
  if (path === "/admin") return <Dashboard admin />;
  if (path === "/admin/contests") return <ContestAdmin />;
  if (path === "/admin/members") return <MembersAdmin />;
  if (path === "/admin/teams") return <TeamsAdmin />;
  if (path === "/contests") return <ContestList />;
  if (path === "/teams") return <TeamsList user={user} />;
  if (path.startsWith("/teams/")) return <TeamDetail id={Number(path.split("/")[2])} user={user} />;
  if (path === "/my-team") return <MyTeam />;
  if (path === "/my-applications") return <MyApplications />;
  if (path === "/leader-apply") return <LeaderApply />;
  if (path === "/awards") return <Awards />;
  return <NotFound />;
}

function Splash() {
  return (
    <main className="login-page">
      <div className="pulse-mark">M</div>
    </main>
  );
}

function Login({ onLogin, memberMode = false }) {
  const [mode, setMode] = useState(memberMode ? "member" : "admin");
  const [password, setPassword] = useState("");
  const [member, setMember] = useState({ name: "", school: "", generation: "1" });
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const res =
        mode === "admin"
          ? await post("/auth/admin/login", { password })
          : await post("/auth/login", member);
      onLogin(res.member);
      go(mode === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main className="login-page">
      <header className="login-brand">
        <h1>대학연합동아리 MAST</h1>
        <p>팀 매칭 플랫폼</p>
      </header>
      <form className="login-card" onSubmit={submit}>
        <h2>{mode === "admin" ? "관리자 로그인" : "일반 회원 로그인"}</h2>
        {mode === "admin" ? (
          <Field label="관리자 비밀번호">
            <input
              autoFocus
              type="password"
              value={password}
              placeholder="비밀번호 입력"
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
        ) : (
          <div className="field-grid">
            <Field label="이름">
              <input value={member.name} onChange={(event) => setMember({ ...member, name: event.target.value })} />
            </Field>
            <Field label="학교">
              <input value={member.school} onChange={(event) => setMember({ ...member, school: event.target.value })} />
            </Field>
            <Field label="기수">
              <input value={member.generation} onChange={(event) => setMember({ ...member, generation: event.target.value })} />
            </Field>
          </div>
        )}
        {message && <p className="form-error">{message}</p>}
        <button className="primary-btn" type="submit">
          {mode === "admin" ? "관리자 로그인" : "회원 로그인"}
        </button>
        <button className="text-btn" type="button" onClick={() => setMode(mode === "admin" ? "member" : "admin")}>
          {mode === "admin" ? "일반 회원 로그인" : "관리자 로그인"}
        </button>
      </form>
    </main>
  );
}

function Shell({ children, user, path, onLogout }) {
  const visibleNav = nav.filter((item) => !item.admin || ["admin", "professor"].includes(user?.role));
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => go(user?.role === "admin" ? "/admin" : "/dashboard")}>
          <span>M</span>
          <b>MAST</b>
          <small>팀 매칭</small>
        </button>
        <nav>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = path === item.href;
            return (
              <button key={item.href} className={active ? "active" : ""} onClick={() => go(item.href)}>
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <strong>{user?.name}</strong>
          <span>{user?.school} {user?.generation ? `${user.generation}기` : ""}</span>
          <button onClick={onLogout}>
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </header>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Metric({ icon: Icon, value, label, tone = "blue" }) {
  return (
    <div className="metric-card">
      <span className={`metric-icon ${tone}`}>
        <Icon size={22} />
      </span>
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    get("/admin/stats").then(setStats).catch(() => setStats({}));
  }, []);
  const cards = [
    ["totalMembers", "전체 회원", UsersRound, "blue"],
    ["totalLeaders", "팀장", UserRoundCog, "gold"],
    ["totalContests", "공모전", Trophy, "sky"],
    ["totalTeams", "전체 팀", UsersRound, "purple"],
    ["recruitingTeams", "모집 중인 팀", UsersRound, "green"],
    ["totalApplications", "전체 지원", Trophy, "orange"],
    ["pendingApplications", "검토 대기 중", Trophy, "red"]
  ];
  return (
    <>
      <PageHeader title="관리자 대시보드" subtitle="MAST 공모전 팀 매칭 전체 현황" />
      <section className="metric-grid">
        {cards.map(([key, label, Icon, tone]) => (
          <Metric key={key} icon={Icon} value={stats?.[key] ?? "-"} label={label} tone={tone} />
        ))}
      </section>
      <section className="shortcut-grid">
        <Shortcut icon={Trophy} title="공모전 관리" text="공모전 목록 추가/수정/삭제" href="/admin/contests" />
        <Shortcut icon={UserRoundCog} title="회원 관리" text="회원 목록 관리 및 팀장 권한 부여" href="/admin/members" />
        <Shortcut icon={UsersRound} title="팀 관리" text="팀 매칭 현황 및 관리" href="/admin/teams" />
      </section>
    </>
  );
}

function Shortcut({ icon: Icon, title, text, href }) {
  return (
    <button className="shortcut" onClick={() => go(href)}>
      <Icon size={22} />
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <ChevronRight />
    </button>
  );
}

function ContestAdmin() {
  const [contests, setContests] = useState([]);
  const [form, setForm] = useState(emptyContest);
  const [editing, setEditing] = useState(null);
  const refresh = () => get("/contests").then(setContests);
  useEffect(refresh, []);
  const save = async (event) => {
    event.preventDefault();
    if (editing) await patch(`/contests/${editing}`, form);
    else await post("/contests", form);
    setEditing(null);
    setForm(emptyContest);
    refresh();
  };
  const edit = (contest) => {
    setEditing(contest.id);
    setForm({ ...emptyContest, ...contest });
  };
  return (
    <>
      <PageHeader title="공모전 관리" subtitle="공모전 목록 추가/수정/삭제" />
      <form className="admin-form" onSubmit={save}>
        <Field label="공모전명"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
        <Field label="주최"><input value={form.organizer ?? ""} onChange={(e) => setForm({ ...form, organizer: e.target.value })} /></Field>
        <Field label="상금"><input value={form.prize ?? ""} onChange={(e) => setForm({ ...form, prize: e.target.value })} /></Field>
        <Field label="접수 기간"><input value={form.registrationPeriod ?? ""} onChange={(e) => setForm({ ...form, registrationPeriod: e.target.value })} /></Field>
        <Field label="카테고리"><input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
        <Field label="링크"><input value={form.link ?? ""} onChange={(e) => setForm({ ...form, link: e.target.value })} /></Field>
        <Field label="최대 팀원"><input type="number" value={form.maxTeamSize ?? 5} onChange={(e) => setForm({ ...form, maxTeamSize: Number(e.target.value) })} /></Field>
        <label className="check"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> 활성화</label>
        <Field label="설명"><textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <button className="primary-btn" type="submit"><Plus size={18} /> {editing ? "수정 저장" : "공모전 추가"}</button>
      </form>
      <DataTable
        rows={contests}
        columns={["title", "organizer", "registrationPeriod", "category", "teamCount"]}
        actions={(row) => (
          <>
            <button onClick={() => edit(row)}>수정</button>
            <button onClick={async () => { await del(`/contests/${row.id}`); refresh(); }}>삭제</button>
          </>
        )}
      />
    </>
  );
}

function MembersAdmin() {
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState("");
  const refresh = () => get("/members").then(setMembers);
  useEffect(refresh, []);
  const filtered = members.filter((m) => `${m.name} ${m.school} ${m.major ?? ""}`.includes(query));
  return (
    <>
      <PageHeader title="회원 관리" subtitle="회원 목록 관리 및 팀장 권한 부여" />
      <SearchBox value={query} onChange={setQuery} placeholder="이름, 학교, 전공 검색" />
      <DataTable
        rows={filtered}
        columns={["name", "school", "major", "generation", "role", "isLeader"]}
        actions={(row) => (
          <button onClick={async () => { await post(`/members/${row.id}/${row.isLeader ? "revoke-leader" : "grant-leader"}`, {}); refresh(); }}>
            {row.isLeader ? "팀장 해제" : "팀장 부여"}
          </button>
        )}
      />
    </>
  );
}

function TeamsAdmin() {
  const [teams, setTeams] = useState([]);
  const [apps, setApps] = useState([]);
  const refresh = () => {
    get("/teams").then(setTeams);
    get("/applications").then(setApps);
  };
  useEffect(refresh, []);
  return (
    <>
      <PageHeader title="팀 관리" subtitle="팀 매칭 현황 및 지원 관리" />
      <section className="list-grid">
        {teams.map((team) => <TeamCard key={team.id} team={team} admin onRefresh={refresh} />)}
      </section>
      <h2 className="section-title">지원 현황</h2>
      <DataTable
        rows={apps}
        columns={["applicantName", "contestTitle", "leaderName", "status", "leaderPriority"]}
        actions={(row) => (
          <>
            <button onClick={async () => { await post(`/applications/${row.id}/accept`, {}); refresh(); }}>승인</button>
            <button onClick={async () => { await post(`/applications/${row.id}/reject`, {}); refresh(); }}>거절</button>
          </>
        )}
      />
    </>
  );
}

function ContestList() {
  const [contests, setContests] = useState([]);
  useEffect(() => { get("/contests").then(setContests); }, []);
  return (
    <>
      <PageHeader title="공모전" subtitle="참여 가능한 공모전 목록" />
      <section className="list-grid">
        {contests.map((contest) => (
          <article className="contest-card" key={contest.id}>
            <span>{contest.category || "공모전"}</span>
            <h2>{contest.title}</h2>
            <p>{contest.description}</p>
            <dl>
              <div><dt>주최</dt><dd>{contest.organizer}</dd></div>
              <div><dt>접수</dt><dd>{contest.registrationPeriod}</dd></div>
              <div><dt>상금</dt><dd>{contest.prize}</dd></div>
            </dl>
            {contest.link && <a href={contest.link} target="_blank" rel="noreferrer">공모전 보기</a>}
          </article>
        ))}
      </section>
    </>
  );
}

function TeamsList({ user }) {
  const [teams, setTeams] = useState([]);
  const [contests, setContests] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ contestId: "", requiredMembers: 4, introduction: "", prizeDistribution: "" });
  const refresh = () => get("/teams").then(setTeams);
  useEffect(() => {
    refresh();
    get("/contests").then(setContests);
  }, []);
  const createTeam = async (event) => {
    event.preventDefault();
    await post("/teams", { ...form, contestId: Number(form.contestId), requiredMembers: Number(form.requiredMembers) });
    setFormOpen(false);
    refresh();
  };
  return (
    <>
      <PageHeader
        title="팀 찾기"
        subtitle="모집 중인 팀을 확인하고 합류를 신청하세요"
        action={user?.isLeader && <button className="primary-btn" onClick={() => setFormOpen(!formOpen)}><Plus size={18} /> 팀 만들기</button>}
      />
      {formOpen && (
        <form className="admin-form" onSubmit={createTeam}>
          <Field label="공모전">
            <select value={form.contestId} onChange={(e) => setForm({ ...form, contestId: e.target.value })} required>
              <option value="">선택</option>
              {contests.map((contest) => <option key={contest.id} value={contest.id}>{contest.title}</option>)}
            </select>
          </Field>
          <Field label="모집 인원"><input type="number" value={form.requiredMembers} onChange={(e) => setForm({ ...form, requiredMembers: e.target.value })} /></Field>
          <Field label="팀 소개"><textarea value={form.introduction} onChange={(e) => setForm({ ...form, introduction: e.target.value })} /></Field>
          <Field label="상금 분배"><input value={form.prizeDistribution} onChange={(e) => setForm({ ...form, prizeDistribution: e.target.value })} /></Field>
          <button className="primary-btn">생성</button>
        </form>
      )}
      <section className="list-grid">
        {teams.map((team) => <TeamCard key={team.id} team={team} onRefresh={refresh} />)}
      </section>
    </>
  );
}

function TeamCard({ team, admin, onRefresh }) {
  return (
    <article className="team-card">
      <div className="team-top">
        <span className={`status ${team.status}`}>{team.status}</span>
        <button onClick={() => go(`/teams/${team.id}`)}>상세</button>
      </div>
      <h2>{team.contestTitle}</h2>
      <p>{team.introduction}</p>
      <dl>
        <div><dt>팀장</dt><dd>{team.leaderName}</dd></div>
        <div><dt>인원</dt><dd>{team.currentMembers}/{team.requiredMembers}</dd></div>
        <div><dt>분배</dt><dd>{team.prizeDistribution}</dd></div>
      </dl>
      <div className="chip-row">
        {team.members.map((member) => <span key={member.memberId}>{member.name}</span>)}
      </div>
      {admin && (
        <div className="row-actions">
          <button onClick={async () => { await post(`/teams/${team.id}/close`, {}); onRefresh(); }}>매칭 완료</button>
          <button onClick={async () => { const awardResult = window.prompt("입상 결과"); await post(`/teams/${team.id}/award`, { awardResult }); onRefresh(); }}>수상 입력</button>
        </div>
      )}
    </article>
  );
}

function TeamDetail({ id }) {
  const [team, setTeam] = useState(null);
  const [message, setMessage] = useState("");
  const [survey, setSurvey] = useState({
    surveyPurpose: "",
    surveyIntensity: "",
    surveyRole: "",
    surveyExperience: "",
    surveyStrengths: "",
    surveyTeamStyle: ""
  });
  useEffect(() => { get(`/teams/${id}`).then(setTeam); }, [id]);
  const apply = async (event) => {
    event.preventDefault();
    await post("/applications", { teamId: id, message, ...survey });
    go("/my-applications");
  };
  if (!team) return <p>팀 정보를 불러오는 중입니다.</p>;
  return (
    <>
      <PageHeader title={team.contestTitle} subtitle={`${team.leaderName} 팀장 · ${team.status}`} />
      <article className="detail-panel">
        <p>{team.introduction}</p>
        <div className="chip-row">{team.members.map((m) => <span key={m.memberId}>{m.name}</span>)}</div>
      </article>
      <form className="admin-form" onSubmit={apply}>
        <Field label="지원 메시지"><textarea value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
        {Object.keys(survey).map((key) => (
          <Field key={key} label={surveyLabel(key)}>
            <input value={survey[key]} onChange={(e) => setSurvey({ ...survey, [key]: e.target.value })} />
          </Field>
        ))}
        <button className="primary-btn">지원하기</button>
      </form>
    </>
  );
}

function MyTeam() {
  const [teams, setTeams] = useState([]);
  useEffect(() => { get("/teams/my").then(setTeams); }, []);
  return (
    <>
      <PageHeader title="내 팀" subtitle="내가 속한 팀 현황" />
      <section className="list-grid">{teams.map((team) => <TeamCard key={team.id} team={team} />)}</section>
    </>
  );
}

function MyApplications() {
  const [rows, setRows] = useState([]);
  useEffect(() => { get("/applications/my").then(setRows); }, []);
  return (
    <>
      <PageHeader title="내 지원 현황" subtitle="팀 지원 처리 상태" />
      <DataTable rows={rows} columns={["contestTitle", "leaderName", "status", "surveyRole", "created_at"]} />
    </>
  );
}

function LeaderApply() {
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    await post("/leader-applications", { message });
    setDone(true);
  };
  return (
    <>
      <PageHeader title="팀장 신청" subtitle="공모전 팀을 만들고 운영할 수 있는 권한을 신청합니다" />
      <form className="detail-panel" onSubmit={submit}>
        <Field label="신청 메시지"><textarea value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
        <button className="primary-btn">신청하기</button>
        {done && <p className="success">신청이 접수되었습니다.</p>}
      </form>
    </>
  );
}

function Awards() {
  const [rows, setRows] = useState([]);
  useEffect(() => { get("/awards").then(setRows); }, []);
  return (
    <>
      <PageHeader title="입상 결과" subtitle="MAST 팀 매칭을 통해 참여한 공모전 성과" />
      {rows.length ? (
        <section className="list-grid">{rows.map((team) => <TeamCard key={team.id} team={team} />)}</section>
      ) : (
        <article className="empty-state"><Award size={40} /><strong>등록된 입상 결과가 없습니다.</strong></article>
      )}
    </>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <label className="search-box">
      <Search size={18} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function DataTable({ rows, columns, actions }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{label(column)}</th>)}
            {actions && <th>관리</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => <td key={column}>{formatValue(row[column])}</td>)}
              {actions && <td className="row-actions">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="empty-line">표시할 데이터가 없습니다.</p>}
    </div>
  );
}

function NotFound() {
  return <PageHeader title="페이지를 찾을 수 없습니다" subtitle="왼쪽 메뉴에서 다시 이동하세요" />;
}

const labels = {
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
  applicantName: "지원자",
  contestTitle: "공모전",
  leaderName: "팀장",
  status: "상태",
  leaderPriority: "우선순위",
  surveyRole: "역할",
  created_at: "신청일"
};

function label(key) {
  return labels[key] || key;
}

function surveyLabel(key) {
  return {
    surveyPurpose: "참여 목적",
    surveyIntensity: "참여 강도",
    surveyRole: "희망 역할",
    surveyExperience: "경험",
    surveyStrengths: "강점",
    surveyTeamStyle: "팀 스타일"
  }[key];
}

function formatValue(value) {
  if (typeof value === "boolean") return value ? "Y" : "N";
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export default App;
