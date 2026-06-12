import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { del, get, post } from "../../api.js";
import { DataTable } from "../../components/DataTable.jsx";
import { Field } from "../../components/Field.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { emptyAdminNotification } from "../../lib/constants.js";
import { formatDate } from "../../lib/format.js";

export function NotificationsAdmin() {
  const [rows, setRows] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(emptyAdminNotification);

  const refresh = () =>
    get("/admin/notifications").then(setRows).catch(() => setRows([]));

  useEffect(() => {
    refresh();
    get("/members").then(setMembers).catch(() => setMembers([]));
  }, []);

  const send = async (event) => {
    event.preventDefault();
    await post("/admin/notifications", {
      ...form,
      memberId: form.memberId ? Number(form.memberId) : null,
    });
    setForm(emptyAdminNotification);
    refresh();
  };

  return (
    <>
      <PageHeader title="알림 발송" subtitle="전체 또는 특정 회원에게 알림을 보냅니다" />
      <form className="admin-form" onSubmit={send}>
        <Field label="수신 대상">
          <select
            value={form.memberId}
            onChange={(e) => setForm({ ...form, memberId: e.target.value })}
          >
            <option value="">전체 회원</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} · {member.school} · {member.generation}기
              </option>
            ))}
          </select>
        </Field>
        <Field label="제목">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="내용">
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
        </Field>
        <Field label="이동 링크 (선택)">
          <input
            value={form.href}
            onChange={(e) => setForm({ ...form, href: e.target.value })}
            placeholder="/announcements"
          />
        </Field>
        <button className="btn btn-primary" type="submit">
          <Plus size={18} /> 알림 발송
        </button>
      </form>
      <DataTable
        rows={rows.map((row) => ({
          ...row,
          target: row.memberName || "전체",
          createdAt: formatDate(row.createdAt),
        }))}
        columns={["target", "title", "body", "createdAt"]}
        actions={(row) => (
          <button
            type="button"
            onClick={async () => {
              if (window.confirm("이 알림을 삭제할까요?")) {
                await del(`/admin/notifications/${row.id}`);
                refresh();
              }
            }}
          >
            삭제
          </button>
        )}
      />
    </>
  );
}
