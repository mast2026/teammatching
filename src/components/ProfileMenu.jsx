import { useEffect, useRef, useState } from "react";
import { patch } from "../api.js";
import { Field } from "./Field.jsx";

export function ProfileMenu({ user, onUserUpdate, onLogout }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ school: "", major: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    setForm({
      school: user?.school ?? "",
      major: user?.major ?? "",
    });
  }, [user]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
        setEditing(false);
        setMessage("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await patch("/members/me", form);
      onUserUpdate?.(res.member);
      setEditing(false);
      setMessage("저장되었습니다.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="header-popover-wrap" ref={wrapRef}>
      <button
        type="button"
        className="user-avatar-btn"
        aria-label="내 프로필"
        onClick={() => setOpen((prev) => !prev)}
      >
        {user?.name?.[0] ?? "M"}
      </button>
      {open && (
        <div className="header-popover profile-popover">
          <div className="profile-popover-head">
            <div className="profile-popover-avatar">{user?.name?.[0] ?? "M"}</div>
            <div>
              <strong>{user?.name}</strong>
              <p>
                {user?.school}
                {user?.generation ? ` · ${user.generation}기` : ""}
              </p>
            </div>
          </div>

          {!editing ? (
            <>
              <dl className="profile-popover-meta">
                <div>
                  <dt>학교</dt>
                  <dd>{user?.school || "-"}</dd>
                </div>
                <div>
                  <dt>기수</dt>
                  <dd>{user?.generation ? `${user.generation}기` : "-"}</dd>
                </div>
                <div>
                  <dt>전공</dt>
                  <dd>{user?.major || "미입력"}</dd>
                </div>
              </dl>
              <button type="button" className="btn btn-soft btn-sm btn-block" onClick={() => setEditing(true)}>
                개인정보 수정
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm btn-block profile-logout-btn"
                onClick={() => {
                  setOpen(false);
                  onLogout?.();
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <form className="profile-popover-form" onSubmit={save}>
              <Field label="학교">
                <input
                  value={form.school}
                  onChange={(event) => setForm({ ...form, school: event.target.value })}
                  required
                />
              </Field>
              <Field label="전공">
                <input
                  value={form.major}
                  onChange={(event) => setForm({ ...form, major: event.target.value })}
                  placeholder="전공 입력"
                />
              </Field>
              {message && <p className="form-hint">{message}</p>}
              <div className="profile-popover-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEditing(false);
                    setMessage("");
                    setForm({ school: user?.school ?? "", major: user?.major ?? "" });
                  }}
                >
                  취소
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
