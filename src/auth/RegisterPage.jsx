import { useState } from "react";
import { registerAccount } from "../logic/auth";
import "./RegisterPage.css";

function getPasswordStrength(password) {
  if (!password) return { label: "Add a password to continue", level: "unfilled" };

  let score = 0;
  if (password.length >= 6) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

  if (score === 3) return { label: "Strong password", level: "strong" };
  if (score === 2) return { label: "Good password", level: "medium" };
  return { label: "Use at least 6 characters", level: "weak" };
}

export default function RegisterPage({ onRegister, onGoToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const completedFields = [name.trim(), email.trim(), phone.trim(), password]
    .filter(Boolean).length;
  const passwordStrength = getPasswordStrength(password);
  const fieldsRemaining = 4 - completedFields;

  const updateField = (setter) => (value) => {
    setter(value);
    setError("");
  };
  const submit = (event) => {
    event.preventDefault();
    // This function is the single handoff point for a future registration API call.
    const result = registerAccount({ name, email, phone, password });
    if (result.error) return setError(result.error);
    onRegister(result.account, remember);
  };

  return (
    <AuthLayout
      variant="register"
      title="Create your account"
      description="Join Vendora to shop, sell, and manage your account."
    >
      <div className="register-progress" aria-label={`${completedFields} of 4 details completed`}>
        <span>Account details</span>
        <strong>{fieldsRemaining ? `${fieldsRemaining} left` : "Ready to create"}</strong>
        <div className="register-progress-track" aria-hidden="true">
          <span style={{ transform: `scaleX(${completedFields / 4})` }} />
        </div>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <Field label="Full Name" value={name} onChange={updateField(setName)} placeholder="Your full name" autoComplete="name" />
        <Field label="Email Address" type="email" value={email} onChange={updateField(setEmail)} placeholder="you@example.com" autoComplete="email" />
        <Field label="Phone Number" value={phone} onChange={updateField(setPhone)} placeholder="+63 912 345 6789" autoComplete="tel" />
        <Field label="Password" type="password" value={password} onChange={updateField(setPassword)} placeholder="Create a password" autoComplete="new-password" />
        <div className={`password-feedback ${passwordStrength.level}`}>
          <span className="strength-bars" aria-hidden="true"><i /><i /><i /></span>
          <span>{passwordStrength.label}</span>
        </div>
        <Remember checked={remember} onChange={setRemember} />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary full register-submit" type="submit">
          {fieldsRemaining ? `Complete ${fieldsRemaining} more ${fieldsRemaining === 1 ? "field" : "fields"}` : "Create Account"}
        </button>
      </form>
      <SwitchLink onClick={onGoToLogin}>Already have an account? Sign in</SwitchLink>
    </AuthLayout>
  );
}

export function AuthLayout({ variant, title, description, contentKey, children }) {
  return (
    <main className={`auth-page ${variant}-page`}>
      <section className={`auth-card ${variant}-card`}>
        <div className="auth-brand brand">
          <span className="brand-mark">V</span><span>Vendora</span>
        </div>
        <h1 key={`title-${contentKey || variant}`} className={contentKey ? "auth-dynamic-heading" : ""}>{title}</h1>
        <p key={`description-${contentKey || variant}`} className="auth-description">{description}</p>
        {children}
      </section>
    </main>
  );
}

export function Field({ label, type = "text", value, onChange, placeholder, autoComplete }) {
  return (
    <label className="auth-field">
      {label}
      <input className="auth-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} />
    </label>
  );
}

export function Remember({ checked, onChange }) {
  return <label className="auth-remember"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /> Remember me</label>;
}

export function SwitchLink({ children, onClick }) {
  return <button className="auth-switch-link" type="button" onClick={onClick}>{children}</button>;
}
