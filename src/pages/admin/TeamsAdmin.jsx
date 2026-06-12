import { useEffect, useState } from "react";
import { del, get, patch, post } from "../../api.js";
import { TeamApplicationsBoard } from "../../components/admin/TeamApplicationsBoard.jsx";
import { DataTable } from "../../components/DataTable.jsx";
import { Field } from "../../components/Field.jsx";
import { FilterTabs } from "../../components/FilterTabs.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { emptyTeamEdit } from "../../lib/constants.js";

export function TeamsAdmin() {
  const [tab, setTab] = useState("teams");
  const [teams, setTeams] = useState([]);
  const [apps, setApps] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState(emptyTeamEdit);

  const refresh = () => {
    get("/teams").then(setTeams).catch(() => setTeams([]));
    get("/applications").then(setApps).catch(() => setApps([]));
  };

  useEffect(() => {
    refresh();
  }, []);

  const openEdit = (team) => {
    setEditingTeam(team.id);
    setTeamForm({
      introduction: team.introduction ?? "",
      requiredMembers: team.requiredMembers ?? 4,
      status: team.status ?? "recruiting",
    });
  };

  const saveTeam = async (event) => {
    event.preventDefault();
    if (!editingTeam) return;
    await patch(`/teams/${editingTeam}`, teamForm);
    setEditingTeam(null);
    setTeamForm(emptyTeamEdit);
    refresh();
  };

  const pendingCount = apps.filter((app) => app.status === "pending").length;

  return (
    <>
      <PageHeader title="팀·지원 관리" subtitle="팀 목록과 지원 현황을 관리합니다" />
      <FilterTabs
        items={[
          { value: "teams", label: `팀 목록 (${teams.length})` },
          { value: "applications", label: `지원 현황 (${apps.length}${pendingCount ? ` · 검토 ${pendingCount}` : ""})` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {editingTeam && (
        <form className="admin-form admin-form-compact admin-inline-panel" onSubmit={saveTeam}>
          <h3 className="form-section-title">팀 수정 #{editingTeam}</h3>
          <div className="admin-inline-fields">
            <Field label="모집 인원">
              <input
                type="number"
                min={1}
                value={teamForm.requiredMembers}
                onChange={(e) => setTeamForm({ ...teamForm, requiredMembers: Number(e.target.value) })}
              />
            </Field>
            <Field label="상태">
              <select
                value={teamForm.status}
                onChange={(e) => setTeamForm({ ...teamForm, status: e.target.value })}
              >
                <option value="recruiting">모집 중</option>
                <option value="matched">매칭 완료</option>
                <option value="closed">종료</option>
              </select>
            </Field>
          </div>
          <Field label="팀 소개">
            <textarea
              value={teamForm.introduction}
              onChange={(e) => setTeamForm({ ...teamForm, introduction: e.target.value })}
              rows={2}
            />
          </Field>
          <div className="profile-popover-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingTeam(null)}>
              취소
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              저장
            </button>
          </div>
        </form>
      )}

      {tab === "teams" && (
        <DataTable
          compact
          rows={teams.map((team) => ({
            id: team.id,
            contestTitle: team.contestTitle,
            leaderName: team.leaderName,
            status: team.status,
            currentMembers: `${team.currentMembers}/${team.requiredMembers}`,
          }))}
          columns={["contestTitle", "leaderName", "status", "currentMembers"]}
          actions={(row) => (
            <>
              <button type="button" onClick={() => openEdit(teams.find((team) => team.id === row.id))}>
                수정
              </button>
              <button
                type="button"
                onClick={async () => {
                  await post(`/teams/${row.id}/close`, {});
                  refresh();
                }}
              >
                완료
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm("이 팀을 삭제할까요?")) {
                    await del(`/teams/${row.id}`);
                    refresh();
                  }
                }}
              >
                삭제
              </button>
            </>
          )}
        />
      )}

      {tab === "applications" && (
        <TeamApplicationsBoard teams={teams} applications={apps} onRefresh={refresh} />
      )}
    </>
  );
}
