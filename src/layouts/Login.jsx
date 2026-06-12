import { useState } from "react";
import { post } from "../api.js";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { Field } from "../components/Field.jsx";
import { SchoolCombobox } from "../components/SchoolCombobox.jsx";
import { go } from "../lib/navigation.js";

const GENERATION_OPTIONS = [
  { value: "1", label: "1기" },
  { value: "2", label: "2기" },
];

export function Login({ onLogin, memberMode = false }) {
  const [mode, setMode] = useState(memberMode ? "member" : "admin");
  const [password, setPassword] = useState("");
  const [member, setMember] = useState({ name: "", school: "", generation: "1" });
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      let res;
      if (mode === "admin") {
        res = await post("/auth/admin/login", { password });
      } else if (mode === "advisor") {
        res = await post("/auth/advisor/login", { password });
      } else {
        res = await post("/auth/login", member);
      }
      onLogin(res.member);
      if (res.member.role === "admin") go("/admin");
      else if (res.member.role === "professor") go("/admin");
      else go("/dashboard");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const titles = {
    admin: "관리자 로그인",
    advisor: "지도교수 로그인",
    member: "일반 회원 로그인",
  };

  return (
    <main className="login-page">
      <header className="login-brand">
        <BrandLogo variant="wordmark" />
        <p>MAST 공모전</p>
      </header>
      <form className="login-card" onSubmit={submit}>
        <h2>{titles[mode]}</h2>
        {mode === "admin" || mode === "advisor" ? (
          <Field label={mode === "admin" ? "관리자 비밀번호" : "지도교수 비밀번호"}>
            <input
              autoFocus
              type="password"
              value={password}
              placeholder="비밀번호 입력"
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
        ) : (
          <div className="login-member-fields">
            <Field label="이름">
              <input
                autoFocus
                value={member.name}
                onChange={(event) => setMember({ ...member, name: event.target.value })}
                placeholder="이름 입력"
                required
              />
            </Field>
            <Field label="학교">
              <SchoolCombobox
                value={member.school}
                onChange={(school) => setMember({ ...member, school })}
                required
              />
            </Field>
            <Field label="기수">
              <select
                value={member.generation}
                onChange={(event) => setMember({ ...member, generation: event.target.value })}
                required
              >
                {GENERATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
        {message && <p className="form-error">{message}</p>}
        <button className="btn btn-primary btn-block login-submit-btn" type="submit">
          {titles[mode]}
        </button>
        <div className="login-switch">
          {mode !== "member" && (
            <button type="button" className="text-btn" onClick={() => setMode("member")}>
              일반 회원 로그인
            </button>
          )}
          {mode !== "admin" && (
            <button type="button" className="text-btn" onClick={() => setMode("admin")}>
              관리자 로그인
            </button>
          )}
          {mode !== "advisor" && (
            <button type="button" className="text-btn" onClick={() => setMode("advisor")}>
              지도교수 로그인
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
