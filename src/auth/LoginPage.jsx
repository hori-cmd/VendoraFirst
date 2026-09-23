import { useState } from "react";
import { BadgeCheck, ShieldCheck, ShoppingBag } from "lucide-react";
import { loginAccount } from "../logic/auth";
import { AuthLayout, Field, Remember, SwitchLink } from "./RegisterPage";
import "./LoginPage.css";

const loginProfiles = [
  {
    role: "buyer",
    label: "Customer",
    title: "Welcome back",
    description: "Sign in to shop, save favourites, and manage your orders.",
    note: "Use the account you created on Vendora.",
    Icon: ShoppingBag,
  },
  {
    role: "staff",
    label: "Staff",
    title: "Staff workspace",
    description: "Sign in to review customer reports and prepare cases for approval.",
    note: "Demo access: staff@vendora.local",
    Icon: BadgeCheck,
  },
  {
    role: "admin",
    label: "Admin",
    title: "Administrator access",
    description: "Sign in to oversee shops, reports, and marketplace operations.",
    note: "Demo access: admin@vendora.local",
    Icon: ShieldCheck,
  },
];

export default function LoginPage({ onLogin, onGoToRegister }) {
  const [loginRole, setLoginRole] = useState("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const activeProfile = loginProfiles.find(
    (profile) => profile.role === loginRole,
  );

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
    <AuthLayout
      variant="login"
      title={activeProfile.title}
      description={activeProfile.description}
      contentKey={loginRole}
    >
      <div className="tabs login-role-tabs" aria-label="Choose account type">
        {loginProfiles.map(({ role, label, Icon }) => (
          <button
            type="button"
            key={role}
            className={loginRole === role ? "selected" : ""}
            aria-pressed={loginRole === role}
            onClick={() => selectLoginRole(role)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
      <p key={loginRole} className="login-role-note">
        {activeProfile.note}
      </p>
      <form className="auth-form" onSubmit={submit}>
        <Field
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        <Remember checked={remember} onChange={setRemember} />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary full login-submit" type="submit">
          Sign In as {activeProfile.label}
        </button>
      </form>
      <SwitchLink onClick={onGoToRegister}>
        New to Vendora? Create an account
      </SwitchLink>
    </AuthLayout>
  );
}
