import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { del, get, patch, post } from "../../api.js";
import { DataTable } from "../../components/DataTable.jsx";
import { Field } from "../../components/Field.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { SearchBar } from "../../components/SearchBar.jsx";
import { emptyMember } from "../../lib/constants.js";

export function MembersAdmin() {
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState("");
  const [generation, setGeneration] = useState("all");
  const [form, setForm] = useState(emptyMember);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const refresh = () => get("/members").then(setMembers).catch(() => setMembers([]));
  useEffect(() => {
    refresh();
  }, []);

  const generations = useMemo(() => {
    const set = new Set(members.map((m) => String(m.generation)).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [members]);

  const filtered = members.filter((member) => {
    const matchQuery = `${member.name} ${member.school} ${member.major ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchGeneration = generation === "all" || String(member.generation) === generation;
    return matchQuery && matchGeneration;
  });

  const save = async (event) => {
    event.preventDefault();
    const payload = { ...form, generation: form.generation ? Number(form.generation) : null };
    if (editing) await patch(`/members/${editing}`, payload);
    else await post("/members", payload);
    setEditing(null);
    setForm(emptyMember);
    setFormOpen(false);
    refresh();
  };

  const edit = (row) => {
    setEditing(row.id);
    setFormOpen(true);
    setForm({
      name: row.name ?? "",
      school: row.school ?? "",
      major: row.major ?? "",
      generation: row.generation ?? "",
      role: row.role ?? "member",
      isLeader: Boolean(row.isLeader),
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyMember);
    setFormOpen(false);
  };

  return (
    <>
      <PageHeader
        title="회원 관리"
        subtitle="회원 등록·수정·삭제"
        action={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setFormOpen(true);
              setEditing(null);
              setForm(emptyMember);
            }}
          >
            <Plus size={16} /> 회원 추가
          </button>
        }
      />
      {formOpen && (
        <form className="admin-form admin-form-compact" onSubmit={save}>
          <div className="admin-inline-fields admin-inline-fields-4">
            <Field label="이름">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="학교">
              <input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} required />
            </Field>
            <Field label="전공">
              <input value={form.major ?? ""} onChange={(e) => setForm({ ...form, major: e.target.value })} />
            </Field>
            <Field label="기수">
              <input
                value={form.generation}
                onChange={(e) => setForm({ ...form, generation: e.target.value })}
                required
              />
            </Field>
          </div>
          <div className="profile-popover-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
              취소
            </button>
            <button className="btn btn-primary btn-sm" type="submit">
              {editing ? "회원 수정" : "회원 추가"}
            </button>
          </div>
        </form>
      )}
      <div className="admin-toolbar-compact">
        <SearchBar value={query} onChange={setQuery} placeholder="이름, 학교, 전공 검색" />
        <div className="chip-filter-row chip-filter-row-compact">
          {generations.map((gen) => (
            <button
              key={gen}
              type="button"
              className={`chip-filter ${generation === gen ? "active" : ""}`}
              onClick={() => setGeneration(gen)}
            >
              {gen === "all" ? "전체" : `${gen}기`}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        compact
        rows={filtered}
        columns={["name", "school", "major", "generation", "isLeader", "hasPassword"]}
        actions={(row) => (
          <>
            <button type="button" onClick={() => edit(row)}>
              수정
            </button>
            {row.hasPassword && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`${row.name} 회원의 비밀번호를 초기화할까요?`)) {
                    await post(`/members/${row.id}/reset-password`, {});
                    refresh();
                  }
                }}
              >
                비번 초기화
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                await post(`/members/${row.id}/${row.isLeader ? "revoke-leader" : "grant-leader"}`, {});
                refresh();
              }}
            >
              {row.isLeader ? "팀장 해제" : "팀장"}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm(`${row.name} 회원을 삭제할까요?`)) {
                  await del(`/members/${row.id}`);
                  refresh();
                }
              }}
            >
              삭제
            </button>
          </>
        )}
      />
    </>
  );
}
