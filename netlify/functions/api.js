import { createClient } from "@supabase/supabase-js";
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

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
  neededRoles: "needed_roles",
  workStyle: "work_style",
  meetingStyle: "meeting_style",
  interestAreas: "interest_areas",
  personalityTags: "personality_tags",
  skillTags: "skill_tags",
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
  capabilityAppeal: "capability_appeal",
  availabilityNote: "availability_note",
  rejectReason: "reject_reason",
  leaderPriority: "leader_priority",
  memberId: "member_id",
  tagTone: "tag_tone",
  publishedAt: "published_at",
  isPublished: "is_published",
  passwordHash: "password_hash",
  passwordSetAt: "password_set_at"
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

const publicMember = (row) => {
  const member = toCamel(row);
  if (!member || typeof member !== "object") return member;
  const hasPassword = Boolean(member.passwordHash ?? member.hasPassword);
  delete member.passwordHash;
  return { ...member, hasPassword };
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
    advisorPassword: process.env.ADVISOR_PASSWORD || process.env.REPLIT_ADVISOR_PASSWORD || "",
    sessionSecret: process.env.SESSION_SECRET || serviceRoleKey
  };
};

const signValue = (value, secret) => createHmac("sha256", secret).update(value).digest("base64url");
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const makeSignedValue = (payload, secret) => {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${value}.${signValue(value, secret)}`;
};

const readSignedValue = (signedValue, secret) => {
  const [value, signature] = String(signedValue ?? "").split(".");
  if (!value || !signature) return null;
  const expected = signValue(value, secret);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
};

const cookieFor = (user, secret) => {
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toUTCString();
  return `mast_tm_session=${makeSignedValue(publicMember(user), secret)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}; Expires=${expires}`;
};

const clearSessionCookie =
  "mast_tm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";

const authFromCookie = (event) => {
  const cookie = event.headers.cookie || event.headers.Cookie || "";
  const match = cookie.match(/mast_tm_session=([^;]+)/);
  if (!match) return null;
  try {
    const { sessionSecret } = env();
    return readSignedValue(match[1], sessionSecret);
  } catch {
    return null;
  }
};

const makeSetupToken = (memberId, secret) =>
  makeSignedValue(
    {
      purpose: "member-password-setup",
      memberId,
      exp: Date.now() + 10 * 60 * 1000
    },
    secret
  );

const readSetupToken = (token, secret) => {
  const payload = readSignedValue(token, secret);
  if (!payload || payload.purpose !== "member-password-setup" || Date.now() > payload.exp) return null;
  return payload;
};

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("base64url");
  const iterations = 310000;
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");
  return `pbkdf2$sha256$${iterations}$${salt}$${hash}`;
};

const verifyPassword = (password, storedHash) => {
  const [scheme, digest, iterations, salt, expected] = String(storedHash ?? "").split("$");
  if (scheme !== "pbkdf2" || digest !== "sha256" || !iterations || !salt || !expected) return false;
  const actual = pbkdf2Sync(password, salt, Number(iterations), 32, digest).toString("base64url");
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
};

const validatePassword = (password, passwordConfirm = password) => {
  if (typeof password !== "string" || password.length < 6) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  if (password !== passwordConfirm) {
    return "비밀번호 확인이 일치하지 않습니다.";
  }
  return null;
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

const scoreCompleteness = (values, maxScore) => {
  const filled = values.filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.values(value).some(Boolean);
    return String(value ?? "").trim().length > 0;
  }).length;
  return Math.round((filled / values.length) * maxScore);
};

const clampScore = (value, max) => Math.max(0, Math.min(max, Math.round(value)));

async function optionalSelect(supabase, table, queryBuilder) {
  try {
    const query = queryBuilder(supabase.from(table));
    const { data, error } = await query;
    if (error) {
      if (error.code === "42P01" || error.code === "42703") return [];
      throw error;
    }
    return data ?? [];
  } catch (error) {
    if (error.code === "42P01" || error.code === "42703") return [];
    throw error;
  }
}

async function memberScoreMap(supabase, applicationRows, memberMap) {
  const memberIds = [...new Set((applicationRows ?? []).map((row) => row.applicant_id).filter(Boolean))];
  if (!memberIds.length) return new Map();

  const [events, peerReviews] = await Promise.all([
    optionalSelect(supabase, "team_matching_member_score_events", (query) =>
      query.select("*").in("member_id", memberIds)
    ),
    optionalSelect(supabase, "team_matching_peer_reviews", (query) =>
      query.select("*").in("reviewee_id", memberIds)
    )
  ]);

  const eventMap = new Map();
  for (const event of events) {
    const list = eventMap.get(event.member_id) ?? [];
    list.push(event);
    eventMap.set(event.member_id, list);
  }

  const reviewMap = new Map();
  for (const review of peerReviews) {
    const list = reviewMap.get(review.reviewee_id) ?? [];
    list.push(review);
    reviewMap.set(review.reviewee_id, list);
  }

  return new Map(
    (applicationRows ?? []).map((row) => {
      const member = memberMap.get(row.applicant_id) ?? {};
      const item = toCamel(row);
      const profileScore = scoreCompleteness(
        [
          member.name,
          member.school,
          member.generation,
          member.major,
          item.message,
          item.capabilityAppeal,
          item.surveyPurpose,
          item.surveyIntensity,
          item.surveyRole,
          item.surveyExperience,
          item.surveyStrengths,
          item.surveyTeamStyle,
          item.personalityTags,
          item.skillTags,
          item.availabilityNote
        ],
        40
      );

      const offlineEvents = (eventMap.get(row.applicant_id) ?? []).filter((event) =>
        ["offline_attendance", "offline_verified"].includes(event.event_type)
      );
      const verifiedCount = offlineEvents.filter((event) => event.verified).length;
      const attendanceScore = Math.min(offlineEvents.length, 5) * 3;
      const verifiedScore = offlineEvents.length ? (verifiedCount / offlineEvents.length) * 15 : 0;
      const activityScore = clampScore(attendanceScore + verifiedScore, 30);

      const reviews = reviewMap.get(row.applicant_id) ?? [];
      const peerScore = reviews.length
        ? clampScore(
            reviews.reduce((sum, review) => {
              const avg =
                (Number(review.participation ?? 0) +
                  Number(review.sincerity ?? 0) +
                  Number(review.collaboration ?? 0) +
                  Number(review.communication ?? 0)) /
                4;
              return sum + (avg / 5) * 30;
            }, 0) / reviews.length,
            30
          )
        : 0;

      const score = {
        baseTotal: profileScore + activityScore,
        maxBase: 70,
        total: profileScore + activityScore + peerScore,
        maxTotal: 100,
        profileScore,
        activityScore,
        peerScore,
        offlineCount: offlineEvents.length,
        verifiedOfflineCount: verifiedCount,
        peerReviewCount: reviews.length,
        provisional: offlineEvents.length === 0 && reviews.length === 0
      };

      return [row.id, score];
    })
  );
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
  const scores = await memberScoreMap(supabase, rows ?? [], memberMap);
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
      leaderId: team?.leaderId ?? null,
      leaderName: team?.leaderName ?? "",
      teamStatus: team?.status ?? "",
      memberScore: scores.get(row.id) ?? null
    };
  });
  if (filter.memberId) output = output.filter((row) => row.applicantId === filter.memberId);
  return output;
}

async function route(event) {
  const { supabase, adminPassword, advisorPassword, sessionSecret } = env();
  const method = event.httpMethod;
  const rawPath = event.path.replace(/^\/\.netlify\/functions\/api/, "").replace(/^\/api/, "") || "/";
  const path = rawPath.replace(/\/+$/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  const body = readBody(event);

  if (method === "POST" && path === "/auth/admin/login") {
    if (body.password !== adminPassword) return json(401, { message: "비밀번호가 올바르지 않습니다." });
    const user = { id: 1, name: "관리자", school: "MAST", generation: 1, role: "admin", isLeader: false };
    return json(200, { member: user }, { "Set-Cookie": cookieFor(user, sessionSecret) });
  }

  if (method === "POST" && path === "/auth/advisor/login") {
    if (!advisorPassword || body.password !== advisorPassword) return json(401, { message: "비밀번호가 올바르지 않습니다." });
    const user = { id: 62, name: "지도교수", school: "MAST", generation: 1, role: "professor", isLeader: false };
    return json(200, { member: user }, { "Set-Cookie": cookieFor(user, sessionSecret) });
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
    if (!member) return json(401, { message: "입력한 회원 정보를 찾을 수 없습니다. 이름, 학교, 기수를 확인해 주세요." });
    if (!member.password_hash) {
      return json(200, {
        setupRequired: true,
        setupToken: makeSetupToken(member.id, sessionSecret),
        member: publicMember(member)
      });
    }
    if (!body.password) {
      return json(200, {
        passwordRequired: true,
        member: publicMember(member)
      });
    }
    if (!verifyPassword(body.password, member.password_hash)) {
      return json(401, { message: "비밀번호가 올바르지 않습니다." });
    }
    const user = publicMember(member);
    return json(200, { member: user }, { "Set-Cookie": cookieFor(user, sessionSecret) });
  }

  if (method === "POST" && path === "/auth/setup-password") {
    const setupPayload = readSetupToken(body.setupToken, sessionSecret);
    if (!setupPayload?.memberId) return json(401, { message: "비밀번호 설정 시간이 만료되었습니다. 다시 로그인해 주세요." });
    const passwordError = validatePassword(body.password, body.passwordConfirm);
    if (passwordError) return json(400, { message: passwordError });
    const { data, error } = await supabase
      .from("team_matching_members")
      .update({
        password_hash: hashPassword(body.password),
        password_set_at: new Date().toISOString()
      })
      .eq("id", setupPayload.memberId)
      .is("password_hash", null)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) return json(409, { message: "이미 비밀번호가 설정되었습니다. 설정한 비밀번호로 로그인해 주세요." });
    const user = publicMember(data);
    return json(200, { member: user }, { "Set-Cookie": cookieFor(user, sessionSecret) });
  }

  if (method === "POST" && path === "/auth/logout") {
    return json(200, { ok: true }, { "Set-Cookie": clearSessionCookie });
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
    const member = data ? publicMember(data) : session;
    return json(200, { member }, data ? { "Set-Cookie": cookieFor(member, sessionSecret) } : {});
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
      const member = publicMember(data);
      return json(200, { member }, { "Set-Cookie": cookieFor(member, sessionSecret) });
    }
    if (method === "GET" && parts.length === 1) {
      requireAdmin(event);
      const { data, error } = await supabase.from("team_matching_members").select("*").order("name");
      if (error) throw error;
      return json(200, (data ?? []).map(publicMember));
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
      return json(201, publicMember(data));
    }
    if (method === "DELETE" && parts.length === 2 && parts[1] !== "me") {
      requireAdmin(event);
      const { error } = await supabase.from("team_matching_members").delete().eq("id", Number(parts[1]));
      if (error) throw error;
      return json(200, { ok: true });
    }
    if (method === "PATCH" && parts.length === 2) {
      requireAdmin(event);
      const allowed = ["name", "school", "major", "generation", "role", "is_leader"];
      const { data, error } = await supabase
        .from("team_matching_members")
        .update(toSnake(body, allowed))
        .eq("id", Number(parts[1]))
        .select("*")
        .single();
      if (error) throw error;
      return json(200, publicMember(data));
    }
    if (method === "POST" && parts[2] === "reset-password") {
      requireAdmin(event);
      const { data, error } = await supabase
        .from("team_matching_members")
        .update({ password_hash: null, password_set_at: null })
        .eq("id", Number(parts[1]))
        .select("*")
        .single();
      if (error) throw error;
      return json(200, publicMember(data));
    }
    if (method === "POST" && parts[2] === "grant-leader") {
      requireAdmin(event);
      const { data, error } = await supabase.from("team_matching_members").update({ is_leader: true }).eq("id", Number(parts[1])).select("*").single();
      if (error) throw error;
      return json(200, publicMember(data));
    }
    if (method === "POST" && parts[2] === "revoke-leader") {
      requireAdmin(event);
      const { data, error } = await supabase.from("team_matching_members").update({ is_leader: false }).eq("id", Number(parts[1])).select("*").single();
      if (error) throw error;
      return json(200, publicMember(data));
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
        "needed_roles",
        "work_style",
        "meeting_style",
        "interest_areas",
        "personality_tags",
        "skill_tags",
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
        introduction: body.introduction ?? "",
        neededRoles: body.neededRoles ?? [],
        workStyle: body.workStyle ?? "",
        meetingStyle: body.meetingStyle ?? "",
        interestAreas: body.interestAreas ?? [],
        personalityTags: body.personalityTags ?? [],
        skillTags: body.skillTags ?? []
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
      const user = requireAuth(event);
      const rows = await applications(supabase);
      if (isAdminUser(user)) return json(200, rows);
      return json(200, rows.filter((row) => row.leaderId === user.id));
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
      const updatePayload = {
        status,
        reject_reason: status === "rejected" ? body.rejectReason ?? "기타" : null
      };
      const { data, error } = await supabase
        .from("team_matching_applications")
        .update(updatePayload)
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
