import { useState } from "react";
import { Field } from "./Field.jsx";
import { Modal } from "./Modal.jsx";

const initialForm = {
  contestTitle: "",
  contestLink: "",
  contestPeriod: "",
  contestDescription: "",
  introduction: "",
  requiredMembers: 4,
};

export function TeamCreateModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleClose = () => {
    if (submitting) return;
    setForm(initialForm);
    setError("");
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        ...form,
        requiredMembers: Number(form.requiredMembers),
      });
      setForm(initialForm);
      onClose();
    } catch (err) {
      setError(err.message || "팀 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="팀 만들기" onClose={handleClose}>
      <form className="team-create-form" onSubmit={handleSubmit}>
        <Field label="공모전 이름">
          <input
            value={form.contestTitle}
            onChange={(e) => update("contestTitle", e.target.value)}
            placeholder="공모전 이름 입력"
            required
          />
        </Field>
        <Field label="링크">
          <input
            type="text"
            value={form.contestLink}
            onChange={(e) => update("contestLink", e.target.value)}
            placeholder="https://"
          />
        </Field>
        <Field label="기간">
          <input
            value={form.contestPeriod}
            onChange={(e) => update("contestPeriod", e.target.value)}
            placeholder="예: 2026.03.01 ~ 2026.05.31"
            required
          />
        </Field>
        <Field label="공모전 설명">
          <textarea
            value={form.contestDescription}
            onChange={(e) => update("contestDescription", e.target.value)}
            placeholder="공모전 주제, 평가 기준, 참가 자격 등"
            required
          />
        </Field>
        <Field label="어떤 사람들과 같이 하기를 원하는지">
          <textarea
            value={form.introduction}
            onChange={(e) => update("introduction", e.target.value)}
            placeholder="희망 역할, 경험, 협업 스타일 등"
            required
          />
        </Field>
        <Field label="모집 인원">
          <input
            type="number"
            min={2}
            max={20}
            value={form.requiredMembers}
            onChange={(e) => update("requiredMembers", e.target.value)}
            required
          />
        </Field>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={submitting}>
            취소
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "생성 중..." : "팀 만들기"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
