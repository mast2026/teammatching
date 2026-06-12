import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { del, get, patch, post } from "../../api.js";
import { DataTable } from "../../components/DataTable.jsx";
import { Field } from "../../components/Field.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { emptyAward } from "../../lib/constants.js";

export function AwardsAdmin() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyAward);
  const [editing, setEditing] = useState(null);

  const refresh = () => get("/awards").then(setRows).catch(() => setRows([]));
  useEffect(() => {
    refresh();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    if (editing) await patch(`/awards/${editing}`, form);
    else await post("/awards", form);
    setEditing(null);
    setForm(emptyAward);
    refresh();
  };

  const edit = (row) => {
    setEditing(row.id);
    setForm({
      contestTitle: row.contestTitle ?? "",
      awardResult: row.awardResult ?? "",
      body: row.body ?? "",
    });
  };

  return (
    <>
      <PageHeader title="입상 결과 관리" subtitle="공모전명·결과·내용을 직접 등록합니다" />
      <form className="admin-form admin-form-compact" onSubmit={save}>
        <Field label="공모전 이름">
          <input
            value={form.contestTitle}
            onChange={(e) => setForm({ ...form, contestTitle: e.target.value })}
            placeholder="예: 2026 MAST 창업 경진대회"
            required
          />
        </Field>
        <Field label="결과">
          <input
            value={form.awardResult}
            onChange={(e) => setForm({ ...form, awardResult: e.target.value })}
            placeholder="예: 대상, 최우수상"
            required
          />
        </Field>
        <Field label="내용">
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="팀 구성, 수상 내역, 후기 등"
            rows={3}
          />
        </Field>
        <button className="btn btn-primary btn-sm" type="submit">
          <Plus size={16} /> {editing ? "수정 저장" : "입상 결과 등록"}
        </button>
        {editing && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setEditing(null);
              setForm(emptyAward);
            }}
          >
            취소
          </button>
        )}
      </form>
      <DataTable
        compact
        rows={rows}
        columns={["contestTitle", "awardResult", "body"]}
        actions={(row) => (
          <>
            <button type="button" onClick={() => edit(row)}>
              수정
            </button>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("이 입상 결과를 삭제할까요?")) {
                  await del(`/awards/${row.id}`);
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
