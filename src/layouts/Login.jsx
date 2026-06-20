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
  const [setup, setSetup] = useState(null);
  const [passwordStep, setPasswordStep] = useState(null);
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      let res;
      if (setup) {
        res = await post("/auth/setup-password", {
          setupToken: setup.setupToken,
          password: setup.password,
          passwordConfirm: setup.passwordConfirm,
        });
      } else if (passwordStep) {
        res = await post("/auth/login", {
          ...member,
          password: passwordStep.password,
        });
      } else if (mode === "admin") {
        res = await post("/auth/admin/login", { password });
      } else if (mode === "advisor") {
        res = await post("/auth/advisor/login", { password });
      } else {
        res = await post("/auth/login", member);
      }
      if (res.setupRequired) {
        setSetup({
          setupToken: res.setupToken,
          member: res.member,
          password: "",
          passwordConfirm: "",
        });
        return;
      }
      if (res.passwordRequired) {
        setPasswordStep({ member: res.member, password: "" });
        return;
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

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setPassword("");
    setSetup(null);
    setPasswordStep(null);
    setMessage("");
  };

  const backToMemberLookup = () => {
    setSetup(null);
    setPasswordStep(null);
    setMessage("");
  };

  const title = setup ? "비밀번호 설정" : passwordStep ? "비밀번호 입력" : titles[mode];

  return (
    <main className="login-page">
      <header className="login-brand">
        <BrandLogo variant="wordmark" />
        <p>MAST 공모전</p>
      </header>
      <form className="login-card" onSubmit={submit}>
        <h2>{title}</h2>
        {setup ? (
          <div className="login-member-fields">
            <p className="form-hint">
              비밀번호가 설정되지 않았습니다. 최초 접속을 위해 비밀번호를 설정해 주세요.
            </p>
            <Field label="새 비밀번호">
              <input
                autoFocus
                type="password"
                value={setup.password}
                onChange={(event) => setSetup({ ...setup, password: event.target.value })}
                placeholder="6자 이상"
                required
              />
            </Field>
            <Field label="비밀번호 확인">
              <input
                type="password"
                value={setup.passwordConfirm}
                onChange={(event) => setSetup({ ...setup, passwordConfirm: event.target.value })}
                placeholder="비밀번호 재입력"
                required
              />
            </Field>
          </div>
        ) : passwordStep ? (
          <div className="login-member-fields">
            <Field label="비밀번호">
              <input
                autoFocus
                type="password"
                value={passwordStep.password}
                onChange={(event) => setPasswordStep({ ...passwordStep, password: event.target.value })}
                placeholder="비밀번호 입력"
                required
              />
            </Field>
          </div>
        ) : mode === "admin" || mode === "advisor" ? (
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
          {setup ? "비밀번호 설정 후 로그인" : passwordStep ? "로그인" : titles[mode]}
        </button>
        <div className="login-switch">
          {(setup || passwordStep) && (
            <button type="button" className="text-btn" onClick={backToMemberLookup}>
              회원 정보 다시 입력
            </button>
          )}
          {!setup && !passwordStep && mode !== "member" && (
            <button type="button" className="text-btn" onClick={() => switchMode("member")}>
              일반 회원 로그인
            </button>
          )}
          {!setup && !passwordStep && mode !== "admin" && (
            <button type="button" className="text-btn" onClick={() => switchMode("admin")}>
              관리자 로그인
            </button>
          )}
          {!setup && !passwordStep && mode !== "advisor" && (
            <button type="button" className="text-btn" onClick={() => switchMode("advisor")}>
              지도교수 로그인
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
