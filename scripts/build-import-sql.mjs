import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const exportDir = process.env.REPLIT_EXPORT_DIR
  ? path.resolve(process.env.REPLIT_EXPORT_DIR)
  : path.join(root, ".local-data");
const outPath = path.join(root, "supabase_team_matching_import.sql");

const readJson = async (name) =>
  JSON.parse(await fs.readFile(path.join(exportDir, name), "utf8"));

const sql = (value) => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${String(value).replaceAll("'", "''")}'`;
};

const row = (values) => `(${values.map(sql).join(", ")})`;

const members = await readJson("members.json");
const contests = await readJson("contests.json");
const teams = await readJson("teams.json");
const applications = await readJson("applications.json");
const leaderApplications = await readJson("leader-applications.json");
const awards = await readJson("awards.json");

const lines = [
  "-- Generated from local Replit export JSON.",
  "-- This file contains member data. Do not commit it to a public repository.",
  "-- Run after supabase_team_matching_schema.sql.",
  "begin;",
  "",
  "truncate table",
  "  public.team_matching_awards,",
  "  public.team_matching_leader_applications,",
  "  public.team_matching_applications,",
  "  public.team_matching_team_members,",
  "  public.team_matching_teams,",
  "  public.team_matching_contests,",
  "  public.team_matching_members",
  "restart identity cascade;",
  ""
];

lines.push(
  "insert into public.team_matching_members (id, name, school, major, generation, role, is_leader, created_at) values",
  members
    .map((m) => row([m.id, m.name, m.school, m.major, m.generation, m.role, m.isLeader, m.createdAt]))
    .join(",\n") +
    "\non conflict (id) do update set name = excluded.name, school = excluded.school, major = excluded.major, generation = excluded.generation, role = excluded.role, is_leader = excluded.is_leader, created_at = excluded.created_at;",
  ""
);

lines.push(
  "insert into public.team_matching_contests (id, title, organizer, prize, registration_period, category, description, is_active, link, registration_deadline, award_count, max_team_size, duplicate_allowed, has_presentation, presentation_date, hackathon_date, linked_commercialization, has_certificate, notes, created_at) values",
  contests
    .map((c) =>
      row([
        c.id,
        c.title,
        c.organizer,
        c.prize,
        c.registrationPeriod,
        c.category,
        c.description,
        c.isActive,
        c.link,
        c.registrationDeadline,
        c.awardCount,
        c.maxTeamSize,
        c.duplicateAllowed,
        c.hasPresentation,
        c.presentationDate,
        c.hackathonDate,
        c.linkedCommercialization,
        c.hasCertificate,
        c.notes,
        c.createdAt
      ])
    )
    .join(",\n") +
    "\non conflict (id) do update set title = excluded.title, organizer = excluded.organizer, prize = excluded.prize, registration_period = excluded.registration_period, category = excluded.category, description = excluded.description, is_active = excluded.is_active, link = excluded.link, registration_deadline = excluded.registration_deadline, award_count = excluded.award_count, max_team_size = excluded.max_team_size, duplicate_allowed = excluded.duplicate_allowed, has_presentation = excluded.has_presentation, presentation_date = excluded.presentation_date, hackathon_date = excluded.hackathon_date, linked_commercialization = excluded.linked_commercialization, has_certificate = excluded.has_certificate, notes = excluded.notes, created_at = excluded.created_at;",
  ""
);

lines.push(
  "insert into public.team_matching_teams (id, contest_id, leader_id, required_members, current_members, introduction, prize_distribution, status, closed_at, award_result, created_at) values",
  teams
    .map((t) =>
      row([
        t.id,
        t.contestId,
        t.leaderId,
        t.requiredMembers,
        t.currentMembers,
        t.introduction,
        t.prizeDistribution,
        t.status,
        t.closedAt,
        t.awardResult,
        t.createdAt
      ])
    )
    .join(",\n") +
    "\non conflict (id) do update set contest_id = excluded.contest_id, leader_id = excluded.leader_id, required_members = excluded.required_members, current_members = excluded.current_members, introduction = excluded.introduction, prize_distribution = excluded.prize_distribution, status = excluded.status, closed_at = excluded.closed_at, award_result = excluded.award_result, created_at = excluded.created_at;",
  ""
);

const teamMembers = teams.flatMap((t) =>
  (t.members ?? []).map((m) => ({
    id: m.id,
    teamId: t.id,
    memberId: m.memberId,
    joinedAt: m.joinedAt
  }))
);

if (teamMembers.length) {
  lines.push(
    "insert into public.team_matching_team_members (id, team_id, member_id, joined_at) values",
    teamMembers
      .map((m) => row([m.id, m.teamId, m.memberId, m.joinedAt]))
      .join(",\n") +
      "\non conflict (team_id, member_id) do update set joined_at = excluded.joined_at;",
    ""
  );
}

lines.push(
  "insert into public.team_matching_applications (id, team_id, applicant_id, message, status, survey_purpose, survey_intensity, survey_role, survey_experience, survey_strengths, survey_team_style, leader_priority, created_at) values",
  applications
    .map((a) =>
      row([
        a.id,
        a.teamId,
        a.applicantId,
        a.message,
        a.status,
        a.surveyPurpose,
        a.surveyIntensity,
        a.surveyRole,
        a.surveyExperience,
        a.surveyStrengths,
        a.surveyTeamStyle,
        a.leaderPriority,
        a.createdAt
      ])
    )
    .join(",\n") +
    "\non conflict (id) do update set team_id = excluded.team_id, applicant_id = excluded.applicant_id, message = excluded.message, status = excluded.status, survey_purpose = excluded.survey_purpose, survey_intensity = excluded.survey_intensity, survey_role = excluded.survey_role, survey_experience = excluded.survey_experience, survey_strengths = excluded.survey_strengths, survey_team_style = excluded.survey_team_style, leader_priority = excluded.leader_priority, created_at = excluded.created_at;",
  ""
);

if (leaderApplications.length) {
  lines.push(
    "insert into public.team_matching_leader_applications (id, member_id, status, message, created_at) values",
    leaderApplications
      .map((a) => row([a.id, a.memberId, a.status, a.message, a.createdAt]))
      .join(",\n") +
      "\non conflict (id) do update set member_id = excluded.member_id, status = excluded.status, message = excluded.message, created_at = excluded.created_at;",
    ""
  );
}

if (awards.length) {
  lines.push(
    "insert into public.team_matching_awards (id, team_id, contest_id, award_result, created_at) values",
    awards
      .map((a) => row([a.id, a.teamId, a.contestId, a.awardResult, a.createdAt]))
      .join(",\n") + ";",
    ""
  );
}

for (const table of [
  "team_matching_members",
  "team_matching_contests",
  "team_matching_teams",
  "team_matching_team_members",
  "team_matching_applications",
  "team_matching_leader_applications",
  "team_matching_awards"
]) {
  lines.push(
    `select setval(pg_get_serial_sequence('public.${table}', 'id'), coalesce((select max(id) from public.${table}), 1), true);`
  );
}

lines.push("", "commit;");

await fs.writeFile(outPath, lines.join("\n"));
console.log(`Wrote ${outPath}`);
console.log(
  JSON.stringify(
    {
      members: members.length,
      contests: contests.length,
      teams: teams.length,
      teamMembers: teamMembers.length,
      applications: applications.length,
      leaderApplications: leaderApplications.length,
      awards: awards.length
    },
    null,
    2
  )
);
