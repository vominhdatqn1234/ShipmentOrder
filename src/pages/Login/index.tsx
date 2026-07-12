import React, { useState } from "react";
import { Dropdown } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

export type Lang = "vi" | "en";

function Logo() {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
        <circle cx="17" cy="17" r="17" fill="#0B2447" />
        <circle cx="17" cy="17" r="13" fill="#F7A400" />
        <path
          d="M19.5 8.5L11.5 18.5h5l-2 7 8-10h-5l2-7z"
          fill="#0B2447"
        />
      </svg>
      <span className="text-xl font-extrabold tracking-wide italic">
        <span className="text-[#0B2447]">TEEMENT</span>
        <span className="text-[#F7A400]">.POD</span>
      </span>
    </div>
  );
}

function LanguageSelect({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <Dropdown
      menu={{
        items: [
          { key: "vi", label: "🇻🇳 Tiếng Việt" },
          { key: "en", label: "🇺🇸 English" },
        ],
        selectedKeys: [lang],
        onClick: ({ key }) => onChange(key as Lang),
      }}
      trigger={["click"]}
    >
      <button
        type="button"
        className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white cursor-pointer hover:border-gray-300"
      >
        <span className="text-lg leading-none">
          {lang === "vi" ? "🇻🇳" : "🇺🇸"}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 9l6 6 6-6"
            stroke="#111827"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </Dropdown>
  );
}

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode: "login" | "signup" = location.pathname.includes("register")
    ? "signup"
    : "login";
  const setMode = (m: "login" | "signup") =>
    navigate(m === "signup" ? "/auth/register" : "/auth/login");
  const [lang, setLang] = useState<Lang>("vi");

  const t =
    lang === "vi"
      ? { login: "Đăng nhập", signup: "Đăng ký", have: "Đã có tài khoản?" }
      : { login: "Login", signup: "Register", have: "Already have account?" };

  return (
    <section className="min-h-screen bg-cover bg-center bg-[rgb(15_23_42_/_0.35)] bg-blend-multiply bg-[url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2000&q=80')]">
      <div className="flex items-center justify-center px-4 py-10 min-h-screen">
        <div className="w-full max-w-[560px] bg-white rounded-2xl shadow-2xl px-8 py-8 sm:px-12">
          <div className="flex items-center justify-between mb-6">
            <Logo />
            <LanguageSelect lang={lang} onChange={setLang} />
          </div>

          {/* Tab Đăng nhập / Đăng ký */}
          <div className="bg-gray-100 rounded-xl p-1 flex mb-7">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 rounded-lg text-sm cursor-pointer border-0 transition-colors ${
                mode === "login"
                  ? "bg-white font-bold text-[#0B2447] shadow-sm"
                  : "bg-transparent text-gray-500"
              }`}
            >
              {t.login}
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2.5 rounded-lg text-sm cursor-pointer border-0 transition-colors ${
                mode === "signup"
                  ? "bg-white font-bold text-[#F7A400] shadow-sm"
                  : "bg-transparent text-gray-500"
              }`}
            >
              {t.signup}
            </button>
          </div>

          {mode === "login" ? (
            <LoginForm
              key={lang}
              lang={lang}
              onSignUp={() => setMode("signup")}
            />
          ) : (
            <>
              <SignupForm lang={lang} />
              <p className="text-center text-gray-700 mt-6 mb-0">
                {t.have}{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode("login");
                  }}
                  className="text-[#2563EB] font-semibold hover:underline"
                >
                  {t.login}
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
