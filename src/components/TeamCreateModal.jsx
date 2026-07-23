import { useState } from "react";
import { ChoiceChips } from "./ChoiceChips.jsx";
import { Field } from "./Field.jsx";
import { Modal } from "./Modal.jsx";
import {
  defaultNeededRoles,
  interestAreaOptions,
  meetingStyleOptions,
  personalityTagOptions,
  skillTagOptions,
  workStyleOptions
} from "../lib/matchingForm.js";

const createInitialForm = () => ({
  contestTitle: "",
  contestLink: "",
  contestPeriod: "",
  contestDescription: "",
  introduction: "",
  requiredMembers: 4,
  neededRoles: defaultNeededRoles.map((role) => ({ ...role })),
  workStyle: "빠르게 출품까지",
  meetingStyle: "온오프라인 병행",
  interestAreas: [],
  personalityTags: [],
  skillTags: [],
});

export function TeamCreateModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(createInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateRole = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      neededRoles: prev.neededRoles.map((role, roleIndex) =>
        roleIndex === index ? { ...role, [key]: value } : role
      )
    }));
  };

  const handleClose = () => {
    if (submitting) return;
    setForm(createInitialForm());
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
        neededRoles: form.neededRoles.filter((role) => role.title.trim() || role.description.trim()),
      });
      setForm(createInitialForm());
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
            placeholder="프로젝트 어필, 모집 방향, 같이 만들고 싶은 분위기"
            required
          />
        </Field>
        <div className="structured-section">
          <h3 className="form-section-title">필요한 사람</h3>
          <div className="needed-role-list">
            {form.neededRoles.map((role, index) => (
              <div key={role.label} className="needed-role-card">
                <span className="needed-role-label">{role.label}</span>
                <input
                  value={role.title}
                  onChange={(e) => updateRole(index, "title", e.target.value)}
                  placeholder="예: 기획/리서치"
                  required={index === 0}
                />
                <textarea
                  value={role.description}
                  onChange={(e) => updateRole(index, "description", e.target.value)}
                  placeholder="맡을 일, 기대 역량, 같이 할 작업"
                  required={index === 0}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="field">
          <span>진행 방식</span>
          <ChoiceChips options={workStyleOptions} value={form.workStyle} onChange={(value) => update("workStyle", value)} multiple={false} />
        </div>
        <div className="field">
          <span>회의 방식</span>
          <ChoiceChips options={meetingStyleOptions} value={form.meetingStyle} onChange={(value) => update("meetingStyle", value)} multiple={false} />
        </div>
        <div className="field">
          <span>관심 분야</span>
          <ChoiceChips options={interestAreaOptions} value={form.interestAreas} onChange={(value) => update("interestAreas", value)} />
        </div>
        <div className="field">
          <span>선호 성향</span>
          <ChoiceChips options={personalityTagOptions} value={form.personalityTags} onChange={(value) => update("personalityTags", value)} />
        </div>
        <div className="field">
          <span>필요 역량</span>
          <ChoiceChips options={skillTagOptions} value={form.skillTags} onChange={(value) => update("skillTags", value)} />
        </div>
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
