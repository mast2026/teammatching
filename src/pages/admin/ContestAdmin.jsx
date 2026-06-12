import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { del, get, patch, post } from "../../api.js";
import { AutoResizeTextarea } from "../../components/AutoResizeTextarea.jsx";
import { DataTable } from "../../components/DataTable.jsx";
import { Field } from "../../components/Field.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { emptyContest } from "../../lib/constants.js";

export function ContestAdmin() {
  const [contests, setContests] = useState([]);
  const [form, setForm] = useState(emptyContest);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const refresh = () => get("/contests").then(setContests).catch(() => setContests([]));
  useEffect(() => {
    refresh();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    if (editing) await patch(`/contests/${editing}`, form);
    else await post("/contests", form);
    setEditing(null);
    setForm(emptyContest);
    setFormOpen(false);
    refresh();
  };

  const edit = (contest) => {
    setEditing(contest.id);
    setForm({ ...emptyContest, ...contest });
    setFormOpen(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyContest);
    setFormOpen(false);
  };

  return (
    <>
      <PageHeader
        title="공모전 관리"
        subtitle="공모전 추가·수정·삭제"
        action={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (formOpen && !editing) cancelEdit();
              else {
                setFormOpen(true);
                setEditing(null);
                setForm(emptyContest);
              }
            }}
          >
            <Plus size={16} /> 공모전 추가
          </button>
        }
      />
      {formOpen && (
        <form className="admin-form admin-form-compact admin-form-contest" onSubmit={save}>
          <Field label="공모전명" className="field-full">
            <AutoResizeTextarea
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              minRows={1}
              required
            />
          </Field>
          <div className="admin-inline-fields admin-inline-fields-2">
            <Field label="주최">
              <AutoResizeTextarea
                value={form.organizer ?? ""}
                onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                minRows={1}
              />
            </Field>
            <Field label="카테고리">
              <AutoResizeTextarea
                value={form.category ?? ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                minRows={1}
              />
            </Field>
            <Field label="접수 기간">
              <AutoResizeTextarea
                value={form.registrationPeriod ?? ""}
                onChange={(e) => setForm({ ...form, registrationPeriod: e.target.value })}
                minRows={1}
              />
            </Field>
            <Field label="마감일">
              <AutoResizeTextarea
                value={form.registrationDeadline ?? ""}
                onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                minRows={1}
              />
            </Field>
          </div>
          <Field label="링크" className="field-full">
            <AutoResizeTextarea
              value={form.link ?? ""}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              minRows={1}
            />
          </Field>
          <Field label="설명" className="field-full">
            <AutoResizeTextarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              minRows={3}
            />
          </Field>
          <div className="profile-popover-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
              취소
            </button>
            <button className="btn btn-primary btn-sm" type="submit">
              {editing ? "수정 저장" : "공모전 추가"}
            </button>
          </div>
        </form>
      )}
      <DataTable
        compact
        rows={contests}
        columns={["title", "organizer", "registrationPeriod", "category"]}
        actions={(row) => (
          <>
            <button type="button" onClick={() => edit(row)}>
              수정
            </button>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("이 공모전을 삭제할까요?")) {
                  await del(`/contests/${row.id}`);
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
