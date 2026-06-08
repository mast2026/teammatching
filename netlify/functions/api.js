import { createClient } from "@supabase/supabase-js";

const json = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  },
  body: JSON.stringify(body)
});

const readBody = (event) => {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
};

const snake = {
  registrationPeriod: "registration_period",
  registrationDeadline: "registration_deadline",
  awardCount: "award_count",
  maxTeamSize: "max_team_size",
  duplicateAllowed: "duplicate_allowed",
  hasPresentation: "has_presentation",
  presentationDate: "presentation_date",
  hackathonDate: "hackathon_date",
  linkedCommercialization: "linked_commercialization",
  hasCertificate: "has_certificate",
  isActive: "is_active",
  isLeader: "is_leader",
  contestId: "contest_id",
  leaderId: "leader_id",
  requiredMembers: "required_members",
  currentMembers: "current_members",
  prizeDistribution: "prize_distribution",
  closedAt: "closed_at",
  awardResult: "award_result",
  teamId: "team_id",
  applicantId: "applicant_id",
  surveyPurpose: "survey_purpose",
  surveyIntensity: "survey_intensity",
  surveyRole: "survey_role",
  surveyExperience: "survey_experience",
  surveyStrengths: "survey_strengths",
  surveyTeamStyle: "survey_team_style",
  leaderPriority: "leader_priority",
  memberId: "member_id"
};

const camel = Object.fromEntries(Object.entries(snake).map(([k, v]) => [v, k]));

const toCamel = (row) => {
  if (!row || typeof row !== "object") return row;
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [camel[key] ?? key, value])
  );
};

const toSnake = (row, allow) => {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    const mapped = snake[key] ?? key;
    if (!allow || allow.includes(mapped)) out[mapped] = value;
  }
  return out;
};

const env = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return {
    supabase: createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    }),
    adminPassword: process.env.ADMIN_PASSWORD || process.env.REPLIT_ADMIN_PASSWORD || "ksj0903",
    advisorPassword: process.env.ADVISOR_PASSWORD || process.env.REPLIT_ADVISOR_PASSWORD || ""
  };
};

const cookieFor = (user) =>
  `mast_tm_session=${Buffer.from(JSON.stringify(user)).toString("base64url")}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;

const authFromCookie = (event) => {
  const cookie = event.headers.cookie || event.headers.Cookie || "";
  const match = cookie.match(/mast_tm_session=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

const requireAdmin = (event) => {
  const user = authFromCookie(event);
  if (!user || !["admin", "professor"].includes(user.role)) {
    throw Object.assign(new Error("관리자 권한이 필요합니다."), { statusCode: 401 });
  }
  return user;
};

async function listTeams(supabase, filter = {}) {
  const [{ data: teams, error }, { data: contests }, { data: members }, { data: links }] =
    await Promise.all([
      supabase.from("team_matching_teams").select("*").order("created_at", { ascending: false }),
      supabase.from("team_matching_contests").select("id,title"),
      supabase.from("team_matching_members").select("id,name,school,major,generation,is_leader"),
      supabase.from("team_matching_team_members").select("*")
    ]);
  if (error) throw error;

  const contestMap = new Map((contests ?? []).map((c) => [c.id, c]));
  const memberMap = new Map((members ?? []).map((m) => [m.id, m]));
  let rows = (teams ?? []).map((team) => {
    const leader = memberMap.get(team.leader_id);
    const contest = contestMap.get(team.contest_id);
    const teamMembers = (links ?? [])
      .filter((link) => link.team_id === team.id)
      .map((link) => ({
        id: link.id,
        memberId: link.member_id,
        joinedAt: link.joined_at,
        ...toCamel(memberMap.get(link.member_id))
      }));
    return {
      ...toCamel(team),
      contestTitle: contest?.title ?? "",
      leaderName: leader?.name ?? "",
      leaderSchool: leader?.school ?? "",
      leaderMajor: leader?.major ?? "",
      leaderGeneration: leader?.generation ?? null,
      members: teamMembers
    };
  });

  if (filter.memberId) {
    rows = rows.filter(
      (team) =>
        team.leaderId === filter.memberId ||
        team.members.some((member) => member.memberId === filter.memberId)
    );
  }
  return rows;
}

async function stats(supabase) {
  const [members, leaders, contests, teams, recruiting, applications, pending] = await Promise.all([
    supabase.from("team_matching_members").select("id", { count: "exact", head: true }),
    supabase.from("team_matching_members").select("id", { count: "exact", head: true }).eq("is_leader", true),
    supabase.from("team_matching_contests").select("id", { count: "exact", head: true }),
    supabase.from("team_matching_teams").select("id", { count: "exact", head: true }),
    supabase.from("team_matching_teams").select("id", { count: "exact", head: true }).eq("status", "recruiting"),
    supabase.from("team_matching_applications").select("id", { count: "exact", head: true }),
    supabase.from("team_matching_applications").select("id", { count: "exact", head: true }).eq("status", "pending")
  ]);
  return {
    totalMembers: members.count ?? 0,
    totalLeaders: leaders.count ?? 0,
    totalContests: contests.count ?? 0,
    totalTeams: teams.count ?? 0,
    recruitingTeams: recruiting.count ?? 0,
    totalApplications: applications.count ?? 0,
    pendingApplications: pending.count ?? 0
  };
}

async function applications(supabase, filter = {}) {
  const [{ data: rows, error }, teams, members] = await Promise.all([
    supabase.from("team_matching_applications").select("*").order("created_at", { ascending: false }),
    listTeams(supabase),
    supabase.from("team_matching_members").select("*")
  ]);
  if (error) throw error;
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const memberMap = new Map((members.data ?? []).map((member) => [member.id, member]));
  let output = (rows ?? []).map((row) => {
    const team = teamMap.get(row.team_id);
    const member = memberMap.get(row.applicant_id);
    return {
      ...toCamel(row),
      applicantName: member?.name ?? "",
      applicantSchool: member?.school ?? "",
      applicantMajor: member?.major ?? "",
      applicantGeneration: member?.generation ?? null,
      contestTitle: team?.contestTitle ?? "",
      leaderName: team?.leaderName ?? "",
      teamStatus: team?.status ?? ""
    };
  });
  if (filter.memberId) output = output.filter((row) => row.applicantId === filter.memberId);
  return output;
}

async function route(event) {
  const { supabase, adminPassword, advisorPassword } = env();
  const method = event.httpMethod;
  const rawPath = event.path.replace(/^\/\.netlify\/functions\/api/, "").replace(/^\/api/, "") || "/";
  const path = rawPath.replace(/\/+$/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  const body = readBody(event);

  if (method === "POST" && path === "/auth/admin/login") {
    if (body.password !== adminPassword) return json(401, { message: "비밀번호가 올바르지 않습니다." });
    const user = { id: 1, name: "관리자", school: "MAST", generation: 1, role: "admin", isLeader: false };
    return json(200, { member: user }, { "Set-Cookie": cookieFor(user) });
  }

  if (method === "POST" && path === "/auth/advisor/login") {
    if (!advisorPassword || body.password !== advisorPassword) return json(401, { message: "비밀번호가 올바르지 않습니다." });
    const user = { id: 62, name: "지도교수", school: "MAST", generation: 1, role: "professor", isLeader: false };
    return json(200, { member: user }, { "Set-Cookie": cookieFor(user) });
  }

  if (method === "POST" && path === "/auth/login") {
    const query = supabase
      .from("team_matching_members")
      .select("*")
      .eq("name", body.name ?? "")
      .limit(10);
    const { data, error } = await query;
    if (error) throw error;
    const member = (data ?? []).find((row) => {
      const schoolOk = !body.school || row.school === body.school;
      const generationOk = !body.generation || String(row.generation) === String(body.generation);
      return schoolOk && generationOk;
    });
    if (!member) return json(401, { message: "회원 정보를 찾을 수 없습니다." });
    const user = toCamel(member);
    return json(200, { member: user }, { "Set-Cookie": cookieFor(user) });
  }

  if (method === "POST" && path === "/auth/logout") {
    return json(200, { ok: true }, { "Set-Cookie": "mast_tm_session=; Path=/; Max-Age=0; SameSite=Lax" });
  }

  if (method === "GET" && path === "/auth/me") {
    return json(200, { member: authFromCookie(event) });
  }

  if (method === "GET" && path === "/admin/stats") return json(200, await stats(supabase));

  if (parts[0] === "members") {
    if (method === "GET" && parts.length === 1) {
      const { data, error } = await supabase.from("team_matching_members").select("*").order("name");
      if (error) throw error;
      return json(200, (data ?? []).map(toCamel));
    }
    if (method === "PATCH" && parts.length === 2) {
      requireAdmin(event);
      const { data, error } = await supabase
        .from("team_matching_members")
        .update(toSnake(body))
        .eq("id", Number(parts[1]))
        .select("*")
        .single();
      if (error) throw error;
      return json(200, toCamel(data));
    }
    if (method === "POST" && parts[2] === "grant-leader") {
      requireAdmin(event);
      const { data, error } = await supabase.from("team_matching_members").update({ is_leader: true }).eq("id", Number(parts[1])).select("*").single();
      if (error) throw error;
      return json(200, toCamel(data));
    }
    if (method === "POST" && parts[2] === "revoke-leader") {
      requireAdmin(event);
      const { data, error } = await supabase.from("team_matching_members").update({ is_leader: false }).eq("id", Number(parts[1])).select("*").single();
      if (error) throw error;
      return json(200, toCamel(data));
    }
  }

  if (parts[0] === "contests") {
    if (method === "GET" && parts.length === 1) {
      const { data, error } = await supabase.from("team_matching_contests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return json(200, (data ?? []).map(toCamel));
    }
    if (method === "POST" && parts.length === 1) {
      requireAdmin(event);
      const allowed = ["title", "organizer", "prize", "registration_period", "category", "description", "is_active", "link", "registration_deadline", "award_count", "max_team_size", "duplicate_allowed", "has_presentation", "presentation_date", "hackathon_date", "linked_commercialization", "has_certificate", "notes"];
      const { data, error } = await supabase.from("team_matching_contests").insert(toSnake(body, allowed)).select("*").single();
      if (error) throw error;
      return json(201, toCamel(data));
    }
    if (method === "PATCH" && parts.length === 2) {
      requireAdmin(event);
      const { data, error } = await supabase.from("team_matching_contests").update(toSnake(body)).eq("id", Number(parts[1])).select("*").single();
      if (error) throw error;
      return json(200, toCamel(data));
    }
    if (method === "DELETE" && parts.length === 2) {
      requireAdmin(event);
      const { error } = await supabase.from("team_matching_contests").delete().eq("id", Number(parts[1]));
      if (error) throw error;
      return json(200, { ok: true });
    }
  }

  if (parts[0] === "teams") {
    if (method === "GET" && parts.length === 1) return json(200, await listTeams(supabase));
    if (method === "GET" && parts[1] === "my") {
      const user = authFromCookie(event);
      if (!user) return json(401, { message: "로그인이 필요합니다." });
      return json(200, await listTeams(supabase, { memberId: user.id }));
    }
    if (method === "GET" && parts.length === 2) {
      const teams = await listTeams(supabase);
      return json(200, teams.find((team) => team.id === Number(parts[1])) ?? null);
    }
    if (method === "POST" && parts.length === 1) {
      const user = authFromCookie(event);
      if (!user) return json(401, { message: "로그인이 필요합니다." });
      const payload = toSnake({ ...body, leaderId: user.id, currentMembers: 1, status: "recruiting" });
      const { data, error } = await supabase.from("team_matching_teams").insert(payload).select("*").single();
      if (error) throw error;
      await supabase.from("team_matching_team_members").insert({ team_id: data.id, member_id: user.id });
      return json(201, toCamel(data));
    }
    if (method === "POST" && parts[2] === "close") {
      requireAdmin(event);
      const { data, error } = await supabase.from("team_matching_teams").update({ status: "matched", closed_at: new Date().toISOString() }).eq("id", Number(parts[1])).select("*").single();
      if (error) throw error;
      return json(200, toCamel(data));
    }
    if (method === "POST" && parts[2] === "award") {
      requireAdmin(event);
      const { data, error } = await supabase.from("team_matching_teams").update({ award_result: body.awardResult ?? null }).eq("id", Number(parts[1])).select("*").single();
      if (error) throw error;
      return json(200, toCamel(data));
    }
  }

  if (parts[0] === "applications") {
    if (method === "GET" && parts[1] === "my") {
      const user = authFromCookie(event);
      if (!user) return json(401, { message: "로그인이 필요합니다." });
      return json(200, await applications(supabase, { memberId: user.id }));
    }
    if (method === "GET") {
      return json(200, await applications(supabase));
    }
    if (method === "POST" && parts.length === 1) {
      const user = authFromCookie(event);
      if (!user) return json(401, { message: "로그인이 필요합니다." });
      const payload = toSnake({ ...body, applicantId: user.id, status: "pending" });
      const { data, error } = await supabase.from("team_matching_applications").insert(payload).select("*").single();
      if (error) throw error;
      return json(201, toCamel(data));
    }
    if (method === "POST" && ["accept", "reject"].includes(parts[2])) {
      requireAdmin(event);
      const status = parts[2] === "accept" ? "accepted" : "rejected";
      const { data, error } = await supabase.from("team_matching_applications").update({ status }).eq("id", Number(parts[1])).select("*").single();
      if (error) throw error;
      return json(200, toCamel(data));
    }
    if (method === "PATCH" && parts[2] === "priority") {
      requireAdmin(event);
      const { data, error } = await supabase.from("team_matching_applications").update({ leader_priority: body.leaderPriority ?? null }).eq("id", Number(parts[1])).select("*").single();
      if (error) throw error;
      return json(200, toCamel(data));
    }
  }

  if (parts[0] === "leader-applications") {
    if (method === "GET") {
      const { data, error } = await supabase
        .from("team_matching_leader_applications")
        .select("*, team_matching_members(name, school, major, generation)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json(
        200,
        (data ?? []).map((row) => ({
          ...toCamel(row),
          memberName: row.team_matching_members?.name,
          memberSchool: row.team_matching_members?.school,
          memberMajor: row.team_matching_members?.major,
          memberGeneration: row.team_matching_members?.generation
        }))
      );
    }
    if (method === "POST" && parts.length === 1) {
      const user = authFromCookie(event);
      if (!user) return json(401, { message: "로그인이 필요합니다." });
      const { data, error } = await supabase.from("team_matching_leader_applications").insert({ member_id: user.id, message: body.message ?? "", status: "pending" }).select("*").single();
      if (error) throw error;
      return json(201, toCamel(data));
    }
    if (method === "POST" && ["accept", "reject"].includes(parts[2])) {
      requireAdmin(event);
      const status = parts[2] === "accept" ? "accepted" : "rejected";
      const { data, error } = await supabase.from("team_matching_leader_applications").update({ status }).eq("id", Number(parts[1])).select("*").single();
      if (error) throw error;
      if (status === "accepted") await supabase.from("team_matching_members").update({ is_leader: true }).eq("id", data.member_id);
      return json(200, toCamel(data));
    }
  }

  if (parts[0] === "awards") {
    const teams = await listTeams(supabase);
    return json(200, teams.filter((team) => team.awardResult));
  }

  return json(404, { message: "Not found", path });
}

export const handler = async (event) => {
  try {
    return await route(event);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return json(statusCode, {
      message: error.message || "서버 오류가 발생했습니다."
    });
  }
};
