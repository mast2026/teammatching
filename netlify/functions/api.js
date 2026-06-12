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
  contestTitle: "contest_title",
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
  memberId: "member_id",
  tagTone: "tag_tone",
  publishedAt: "published_at",
  isPublished: "is_published"
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
    adminPassword: process.env.ADMIN_PASSWORD || process.env.REPLIT_ADMIN_PASSWORD || "123456",
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

const requireAuth = (event) => {
  const user = authFromCookie(event);
  if (!user) {
    throw Object.assign(new Error("로그인이 필요합니다."), { statusCode: 401 });
  }
  return user;
};

const requireAdmin = (event) => {
  const user = requireAuth(event);
  if (!["admin", "professor"].includes(user.role)) {
    throw Object.assign(new Error("관리자 권한이 필요합니다."), { statusCode: 403 });
  }
  return user;
};

const isAdminUser = (user) => ["admin", "professor"].includes(user?.role);

async function getReadKeys(supabase, memberId) {
  const { data, error } = await supabase
    .from("team_matching_notification_reads")
    .select("notification_key")
    .eq("member_id", memberId);
  if (error) {
    if (error.code === "42P01") return new Set();
    throw error;
  }
  return new Set((data ?? []).map((row) => row.notification_key));
}

async function markReadKeys(supabase, memberId, keys = []) {
  if (!keys.length) return;
  const rows = keys.map((notification_key) => ({ member_id: memberId, notification_key }));
  const { error } = await supabase
    .from("team_matching_notification_reads")
    .upsert(rows, { onConflict: "member_id,notification_key" });
  if (error && error.code !== "42P01") throw error;
}

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

async function listDbNotifications(supabase, userId) {
  const { data, error } = await supabase
    .from("team_matching_notifications")
    .select("*")
    .or(`member_id.is.null,member_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01") return [];
    throw error;
  }
  return (data ?? []).map((row) => {
    const item = toCamel(row);
    return {
      id: `db-${item.id}`,
      type: item.type ?? "notice",
      title: item.title,
      body: item.body ?? "",
      href: item.href ?? null,
      createdAt: item.createdAt
    };
  });
}

async function listNotifications(supabase, userId) {
  const [applicationRows, myTeams, { data: leaderRows }, dbRows, readKeys] = await Promise.all([
    applications(supabase),
    listTeams(supabase, { memberId: userId }),
    supabase
      .from("team_matching_leader_applications")
      .select("*")
      .eq("member_id", userId)
      .order("updated_at", { ascending: false }),
    listDbNotifications(supabase, userId),
    getReadKeys(supabase, userId)
  ]);

  const leaderTeamIds = new Set(
    (myTeams ?? []).filter((team) => team.leaderId === userId).map((team) => team.id)
  );
  const notifications = [...dbRows];

  for (const app of applicationRows ?? []) {
    if (app.applicantId === userId && ["accepted", "rejected"].includes(app.status)) {
      notifications.push({
        id: `application-${app.id}-${app.status}`,
        type: "application_result",
        title: app.status === "accepted" ? "팀 지원이 승인되었습니다" : "팀 지원이 거절되었습니다",
        body: `${app.contestTitle || "공모전"} · ${app.leaderName || "팀장"} 팀`,
        href: "/my-applications",
        createdAt: app.updatedAt || app.createdAt
      });
    }

    if (leaderTeamIds.has(app.teamId) && app.status === "pending") {
      notifications.push({
        id: `pending-application-${app.id}`,
        type: "application_pending",
        title: "새 팀 지원이 도착했습니다",
        body: `${app.applicantName || "회원"}님이 ${app.contestTitle || "공모전"} 팀에 지원했습니다`,
        href: "/my-team",
        createdAt: app.createdAt
      });
    }
  }

  for (const row of leaderRows ?? []) {
    const item = toCamel(row);
    if (item.status === "pending") continue;
    notifications.push({
      id: `leader-application-${item.id}-${item.status}`,
      type: "leader_application_result",
      title: item.status === "accepted" ? "팀장 신청이 승인되었습니다" : "팀장 신청이 거절되었습니다",
      body:
        item.status === "accepted"
          ? "이제 팀 모집을 시작할 수 있습니다."
          : "다시 신청하거나 관리자에게 문의하세요.",
      href: "/teams",
      createdAt: item.updatedAt || item.createdAt
    });
  }

  return notifications
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .map((item) => ({ ...item, read: readKeys.has(item.id) }));
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
    const session = authFromCookie(event);
    if (!session?.id) return json(200, { member: session });
    if (["admin", "professor"].includes(session.role)) {
      return json(200, { member: session });
    }
    const { data, error } = await supabase
      .from("team_matching_members")
      .select("*")
      .eq("id", session.id)
      .maybeSingle();
    if (error) throw error;
    const member = data ? toCamel(data) : session;
    return json(200, { member }, data ? { "Set-Cookie": cookieFor(member) } : {});
  }

  if (method === "GET" && path === "/notifications") {
    const user = requireAuth(event);
    const items = await listNotifications(supabase, user.id);
    return json(200, { items });
  }

  if (method === "POST" && path === "/notifications/read") {
    const user = requireAuth(event);
    await markReadKeys(supabase, user.id, body.keys ?? []);
    return json(200, { ok: true });
  }

  if (method === "GET" && path === "/schools") {
    const { data, error } = await supabase.from("team_matching_members").select("school").order("school");
    if (error) throw error;
    const schools = [...new Set((data ?? []).map((row) => row.school).filter(Boolean))];
    return json(200, schools);
  }

  if (method === "GET" && path === "/admin/stats") {
    requireAdmin(event);
    return json(200, await stats(supabase));
  }

  if (parts[0] === "announcements") {
    const user = authFromCookie(event);
    if (method === "GET" && parts.length === 1) {
      let query = supabase.from("team_matching_announcements").select("*").order("published_at", { ascending: false });
      if (!isAdminUser(user)) {
        query = query.eq("is_published", true);
      }
      const { data, error } = await query;
      if (error) {
        if (error.code === "42P01") return json(200, []);
        throw error;
      }
      return json(200, (data ?? []).map(toCamel));
    }
    if (method === "POST" && parts.length === 1) {
      requireAdmin(event);
      const allowed = ["tag", "tag_tone", "title", "body", "published_at", "is_published"];
      const payload = toSnake(
        {
          title: body.title,
          body: body.body ?? "",
          tag: "공지",
          tagTone: "notice",
          publishedAt: body.publishedAt ?? new Date().toISOString(),
          isPublished: body.isPublished ?? true
        },
        allowed
      );
      const { data, error } = await supabase
        .from("team_matching_announcements")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return json(201, toCamel(data));
    }
    if (method === "PATCH" && parts.length === 2) {
      requireAdmin(event);
      const allowed = ["tag", "tag_tone", "title", "body", "published_at", "is_published"];
      const payload = toSnake(
        {
          title: body.title,
          body: body.body ?? "",
          ...(body.publishedAt !== undefined ? { publishedAt: body.publishedAt } : {}),
          ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {})
        },
        allowed
      );
      const { data, error } = await supabase
        .from("team_matching_announcements")
        .update(payload)
        .eq("id", Number(parts[1]))
        .select("*")
        .single();
      if (error) throw error;
      return json(200, toCamel(data));
    }
    if (method === "DELETE" && parts.length === 2) {
      requireAdmin(event);
      const { error } = await supabase.from("team_matching_announcements").delete().eq("id", Number(parts[1]));
      if (error) throw error;
      return json(200, { ok: true });
    }
  }

  if (parts[0] === "admin" && parts[1] === "notifications") {
    if (method === "GET" && parts.length === 2) {
      requireAdmin(event);
      const { data, error } = await supabase
        .from("team_matching_notifications")
        .select("*, team_matching_members(name, school)")
        .order("created_at", { ascending: false });
      if (error) {
        if (error.code === "42P01") return json(200, []);
        throw error;
      }
      return json(
        200,
        (data ?? []).map((row) => ({
          ...toCamel(row),
          memberName: row.team_matching_members?.name ?? "전체",
          memberSchool: row.team_matching_members?.school ?? ""
        }))
      );
    }
    if (method === "POST" && parts.length === 2) {
      requireAdmin(event);
      const payload = {
        member_id: body.memberId ?? null,
        type: body.type ?? "notice",
        title: body.title ?? "",
        body: body.body ?? "",
        href: body.href ?? null
      };
      const { data, error } = await supabase
        .from("team_matching_notifications")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return json(201, toCamel(data));
    }
    if (method === "DELETE" && parts.length === 3) {
      requireAdmin(event);
      const { error } = await supabase
        .from("team_matching_notifications")
        .delete()
        .eq("id", Number(parts[2]));
      if (error) throw error;
      return json(200, { ok: true });
    }
  }

  if (parts[0] === "members") {
    if (method === "PATCH" && parts[1] === "me") {
      const user = authFromCookie(event);
      if (!user) return json(401, { message: "로그인이 필요합니다." });
      const allowed = ["school", "major"];
      const { data, error } = await supabase
        .from("team_matching_members")
        .update(toSnake(body, allowed))
        .eq("id", user.id)
        .select("*")
        .single();
      if (error) throw error;
      const member = toCamel(data);
      return json(200, { member }, { "Set-Cookie": cookieFor(member) });
    }
    if (method === "GET" && parts.length === 1) {
      requireAdmin(event);
      const { data, error } = await supabase.from("team_matching_members").select("*").order("name");
      if (error) throw error;
      return json(200, (data ?? []).map(toCamel));
    }
    if (method === "POST" && parts.length === 1) {
      requireAdmin(event);
      const allowed = ["name", "school", "major", "generation", "role", "is_leader"];
      const payload = toSnake(
        {
          ...body,
          role: body.role ?? "member",
          isLeader: body.isLeader ?? false,
          generation: body.generation ? Number(body.generation) : null
        },
        allowed
      );
      const { data, error } = await supabase
        .from("team_matching_members")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return json(201, toCamel(data));
    }
    if (method === "DELETE" && parts.length === 2 && parts[1] !== "me") {
      requireAdmin(event);
      const { error } = await supabase.from("team_matching_members").delete().eq("id", Number(parts[1]));
      if (error) throw error;
      return json(200, { ok: true });
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
      requireAuth(event);
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
    if (method === "GET" && parts.length === 1) {
      requireAuth(event);
      return json(200, await listTeams(supabase));
    }
    if (method === "GET" && parts[1] === "my") {
      const user = requireAuth(event);
      return json(200, await listTeams(supabase, { memberId: user.id }));
    }
    if (method === "GET" && parts.length === 2) {
      requireAuth(event);
      const teams = await listTeams(supabase);
      return json(200, teams.find((team) => team.id === Number(parts[1])) ?? null);
    }
    if (method === "PATCH" && parts.length === 2) {
      requireAdmin(event);
      const allowed = [
        "contest_id",
        "leader_id",
        "required_members",
        "introduction",
        "prize_distribution",
        "status",
        "award_result"
      ];
      const { data, error } = await supabase
        .from("team_matching_teams")
        .update(toSnake(body, allowed))
        .eq("id", Number(parts[1]))
        .select("*")
        .single();
      if (error) throw error;
      return json(200, toCamel(data));
    }
    if (method === "DELETE" && parts.length === 2) {
      requireAdmin(event);
      const { error } = await supabase.from("team_matching_teams").delete().eq("id", Number(parts[1]));
      if (error) throw error;
      return json(200, { ok: true });
    }
    if (method === "POST" && parts.length === 1) {
      const user = authFromCookie(event);
      if (!user) return json(401, { message: "로그인이 필요합니다." });
      let contestId = body.contestId ? Number(body.contestId) : null;
      if (!contestId && body.contestTitle) {
        const { data: contest, error: contestError } = await supabase
          .from("team_matching_contests")
          .insert({
            title: body.contestTitle,
            link: body.contestLink ?? null,
            registration_period: body.contestPeriod ?? null,
            description: body.contestDescription ?? null,
            is_active: true
          })
          .select("*")
          .single();
        if (contestError) throw contestError;
        contestId = contest.id;
      }
      if (!contestId) return json(400, { message: "공모전 정보를 입력해주세요." });
      const payload = toSnake({
        contestId,
        leaderId: user.id,
        currentMembers: 1,
        status: "recruiting",
        requiredMembers: body.requiredMembers ?? 4,
        introduction: body.introduction ?? ""
      });
      const { data, error } = await supabase.from("team_matching_teams").insert(payload).select("*").single();
      if (error) throw error;
      await supabase.from("team_matching_team_members").insert({ team_id: data.id, member_id: user.id });
      await supabase.from("team_matching_members").update({ is_leader: true }).eq("id", user.id);
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
    if (method === "GET" && parts.length === 1) {
      requireAdmin(event);
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
      const user = authFromCookie(event);
      if (!user) return json(401, { message: "로그인이 필요합니다." });
      const applicationId = Number(parts[1]);
      const { data: application, error: appError } = await supabase
        .from("team_matching_applications")
        .select("*")
        .eq("id", applicationId)
        .single();
      if (appError) throw appError;
      const { data: team, error: teamError } = await supabase
        .from("team_matching_teams")
        .select("*")
        .eq("id", application.team_id)
        .single();
      if (teamError) throw teamError;
      const isAdmin = ["admin", "professor"].includes(user.role);
      const isLeader = team.leader_id === user.id;
      if (!isAdmin && !isLeader) {
        return json(403, { message: "팀장 또는 관리자만 처리할 수 있습니다." });
      }
      const status = parts[2] === "accept" ? "accepted" : "rejected";
      const { data, error } = await supabase
        .from("team_matching_applications")
        .update({ status })
        .eq("id", applicationId)
        .select("*")
        .single();
      if (error) throw error;
      if (status === "accepted") {
        const { data: existingMember } = await supabase
          .from("team_matching_team_members")
          .select("id")
          .eq("team_id", team.id)
          .eq("member_id", application.applicant_id)
          .maybeSingle();
        if (!existingMember) {
          await supabase.from("team_matching_team_members").insert({
            team_id: team.id,
            member_id: application.applicant_id
          });
          await supabase
            .from("team_matching_teams")
            .update({ current_members: (team.current_members ?? 1) + 1 })
            .eq("id", team.id);
        }
      }
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
    if (method === "GET" && parts.length === 1) {
      requireAdmin(event);
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
    if (method === "GET" && parts.length === 1) {
      requireAuth(event);
      const { data, error } = await supabase
        .from("team_matching_awards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        if (error.code === "42P01" || error.code === "42703") {
          const teams = await listTeams(supabase);
          return json(
            200,
            teams
              .filter((team) => team.awardResult)
              .map((team) => ({
                id: team.id,
                contestTitle: team.contestTitle,
                awardResult: team.awardResult,
                body: "",
                teamId: team.id,
                createdAt: team.createdAt
              }))
          );
        }
        throw error;
      }
      return json(200, (data ?? []).map(toCamel));
    }
    if (method === "POST" && parts.length === 1) {
      requireAdmin(event);
      const { data, error } = await supabase
        .from("team_matching_awards")
        .insert({
          contest_title: body.contestTitle ?? "",
          award_result: body.awardResult ?? "",
          body: body.body ?? "",
          team_id: body.teamId ?? null,
          contest_id: body.contestId ?? null
        })
        .select("*")
        .single();
      if (error) throw error;
      return json(201, toCamel(data));
    }
    if (method === "PATCH" && parts.length === 2) {
      requireAdmin(event);
      const allowed = ["contest_title", "award_result", "body", "team_id", "contest_id"];
      const { data, error } = await supabase
        .from("team_matching_awards")
        .update(toSnake(body, allowed))
        .eq("id", Number(parts[1]))
        .select("*")
        .single();
      if (error) throw error;
      return json(200, toCamel(data));
    }
    if (method === "DELETE" && parts.length === 2) {
      requireAdmin(event);
      const { error } = await supabase.from("team_matching_awards").delete().eq("id", Number(parts[1]));
      if (error) throw error;
      return json(200, { ok: true });
    }
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
