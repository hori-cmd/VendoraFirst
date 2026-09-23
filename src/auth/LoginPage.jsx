import { useState } from "react";
import { BadgeCheck, ShieldCheck, ShoppingBag } from "lucide-react";
import { loginAccount } from "../logic/auth";
import "./LoginPage.css";

const loginProfiles = [
  { role: "buyer", label: "Customer", title: "Welcome back", description: "Sign in to shop, save favourites, and manage your orders.", note: "Use the account you created on Vendora.", Icon: ShoppingBag },
  { role: "staff", label: "Staff", title: "Staff workspace", description: "Sign in to review customer reports and prepare cases for approval.", note: "Demo access: staff@vendora.local", Icon: BadgeCheck },
  { role: "admin", label: "Admin", title: "Administrator access", description: "Sign in to oversee shops, reports, and marketplace operations.", note: "Demo access: admin@vendora.local", Icon: ShieldCheck },
];

export default function LoginPage({ onLogin, onGoToRegister }) {
  const [loginRole, setLoginRole] = useState("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const activeProfile = loginProfiles.find((profile) => profile.role === loginRole);

  // Changing account type updates the interface before the same login API handoff runs.
  const selectLoginRole = (role) => {
    setLoginRole(role);
    setError("");
  };

  const submit = (event) => {
    event.preventDefault();
    // This function is the single handoff point for a future login API call.
    const result = loginAccount({ loginRole, email, password });
    if (result.error) return setError(result.error);
    onLogin(result.account, remember);
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand"><span className="login-brand-mark">V</span><span>Vendora</span></div>
        <h1 key={`title-${loginRole}`} className="login-dynamic-heading">{activeProfile.title}</h1>
        <p key={`description-${loginRole}`} className="login-description">{activeProfile.description}</p>
        <div className="login-role-tabs" aria-label="Choose account type">
          {loginProfiles.map(({ role, label, Icon }) => (
            <button type="button" key={role} className={loginRole === role ? "selected" : ""} aria-pressed={loginRole === role} onClick={() => selectLoginRole(role)}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
        <p key={loginRole} className="login-role-note">{activeProfile.note}</p>
        <form className="login-form" onSubmit={submit}>
          <LoginField label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
          <LoginField label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter your password" autoComplete="current-password" />
          <LoginRemember checked={remember} onChange={setRemember} />
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="login-submit" type="submit">Sign In as {activeProfile.label}</button>
        </form>
        <button className="login-switch-link" type="button" onClick={onGoToRegister}>New to Vendora? Create an account</button>
      </section>
    </main>
  );
}

function LoginField({ label, type = "text", value, onChange, placeholder, autoComplete }) {
  return <label className="login-field">{label}<input className="login-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} /></label>;
}

function LoginRemember({ checked, onChange }) {
  return <label className="login-remember"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /> Remember me</label>;
}
