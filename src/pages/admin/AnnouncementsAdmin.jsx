import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { del, get, patch, post } from "../../api.js";
import { DataTable } from "../../components/DataTable.jsx";
import { Field } from "../../components/Field.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { emptyAnnouncement } from "../../lib/constants.js";

export function AnnouncementsAdmin() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyAnnouncement);
  const [editing, setEditing] = useState(null);

  const refresh = () => get("/announcements").then(setRows).catch(() => setRows([]));
  useEffect(() => {
    refresh();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    if (editing) await patch(`/announcements/${editing}`, form);
    else await post("/announcements", form);
    setEditing(null);
    setForm(emptyAnnouncement);
    refresh();
  };

  const edit = (row) => {
    setEditing(row.id);
    setForm({
      title: row.title ?? "",
      body: row.body ?? "",
    });
  };

  return (
    <>
      <PageHeader title="공지사항 관리" subtitle="제목과 내용만 등록합니다" />
      <form className="admin-form admin-form-compact" onSubmit={save}>
        <Field label="제목">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="내용">
          <textarea value={form.body ?? ""} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} required />
        </Field>
        <button className="btn btn-primary btn-sm" type="submit">
          <Plus size={16} /> {editing ? "공지 수정" : "공지 추가"}
        </button>
        {editing && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setEditing(null);
              setForm(emptyAnnouncement);
            }}
          >
            취소
          </button>
        )}
      </form>
      <DataTable
        compact
        rows={rows.map((row) => ({
          ...row,
          publishedAt: (row.publishedAt || row.createdAt || "").slice(0, 10),
        }))}
        columns={["title", "publishedAt"]}
        actions={(row) => (
          <>
            <button type="button" onClick={() => edit(rows.find((item) => item.id === row.id) ?? row)}>
              수정
            </button>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("이 공지를 삭제할까요?")) {
                  await del(`/announcements/${row.id}`);
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
