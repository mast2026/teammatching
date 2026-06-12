import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { post } from "../../api.js";
import { Field } from "../../components/Field.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { SectionCard } from "../../components/SectionCard.jsx";

export function LeaderApply() {
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    await post("/leader-applications", { message });
    setDone(true);
  };

  return (
    <>
      <PageHeader title="팀장 신청" subtitle="공모전 팀을 만들고 운영할 수 있는 권한을 신청합니다" />
      <div className="two-column">
        <SectionCard title="신청 안내">
          <ul className="bullet-list">
            <li>팀장 권한이 있어야 팀 모집을 시작할 수 있습니다.</li>
            <li>관리자 검토 후 승인되면 팀 만들기 버튼이 활성화됩니다.</li>
            <li>참여하고 싶은 공모전과 본인 경험을 간단히 적어주세요.</li>
          </ul>
        </SectionCard>
        <form className="admin-form" onSubmit={submit}>
          <Field label="신청 메시지">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="참여 희망 공모전, 팀 운영 경험, 모집 계획 등을 작성해주세요."
              required
            />
          </Field>
          <button className="btn btn-primary" type="submit">
            <ShieldCheck size={18} /> 신청하기
          </button>
          {done && <p className="success">신청이 접수되었습니다. 관리자 승인을 기다려주세요.</p>}
        </form>
      </div>
    </>
  );
}
