import { useRef, useState } from "react";
import {
  BadgeCheck,
  ChevronLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { loginAccount, resetAccountPassword } from "../logic/auth";
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
    description:
      "Sign in to review customer reports and prepare cases for approval.",
    note: "Demo access: staff@vendora.local",
    Icon: BadgeCheck,
  },
  {
    role: "admin",
    label: "Admin",
    title: "Administrator access",
    description:
      "Sign in to oversee shops, reports, and marketplace operations.",
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
  const [resetStep, setResetStep] = useState("login");
  const [resetEmail, setResetEmail] = useState("");
  const [pin, setPin] = useState(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const pinRefs = useRef([]);
  const profile = loginProfiles.find((item) => item.role === loginRole);
  const selectRole = (role) => {
    setLoginRole(role);
    setError("");
  };
  const submit = (event) => {
    event.preventDefault();
    const result = loginAccount({ loginRole, email, password });
    if (result.error) return setError(result.error);
    onLogin(result.account, remember);
  };
  // Step 1 only confirms the demo request; no email is actually sent by this frontend prototype.
  const sendCode = (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(resetEmail))
      return setError("Enter a valid email address.");
    setError("");
    setResetStep("code");
  };
  // Six inputs make the verification stage easy to scan; any six digits unlock the demo reset form.
  const updatePin = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    if (digit && index < 5) pinRefs.current[index + 1]?.focus();
    if (next.every(Boolean)) setResetStep("password");
  };
  const resetPassword = (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword)
      return setError("Passwords do not match.");
    const result = resetAccountPassword({
      email: resetEmail,
      password: newPassword,
    });
    if (result.error) return setError(result.error);
    setError("");
    setResetStep("success");
  };
  const back = () => {
    setError("");
    setResetStep(
      resetStep === "password"
        ? "code"
        : resetStep === "code"
          ? "email"
          : "login",
    );
  };
  const loginScreen = (
    <>
      <div className="login-brand">
        <span className="login-brand-mark">V</span>
        <span>Vendora</span>
      </div>
      <h1 key={`title-${loginRole}`} className="login-dynamic-heading">
        {profile.title}
      </h1>
      <p key={`description-${loginRole}`} className="login-description">
        {profile.description}
      </p>
      <div className="login-role-tabs" aria-label="Choose account type">
        {loginProfiles.map(({ role, label, Icon }) => (
          <button
            type="button"
            key={role}
            className={loginRole === role ? "selected" : ""}
            aria-pressed={loginRole === role}
            onClick={() => selectRole(role)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
      <p className="login-role-note">{profile.note}</p>
      <form className="login-form" onSubmit={submit}>
        <LoginField
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <LoginField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        <button
          className="login-forgot-link"
          type="button"
          onClick={() => {
            setResetEmail(email);
            setError("");
            setResetStep("email");
          }}
        >
          Forgot password?
        </button>
        <LoginRemember checked={remember} onChange={setRemember} />
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <button className="login-submit" type="submit">
          Sign In as {profile.label}
        </button>
      </form>
      <button
        className="login-switch-link"
        type="button"
        onClick={onGoToRegister}
      >
        New to Vendora? Create an account
      </button>
    </>
  );
  const resetScreen = (
    <div className="login-reset" key={resetStep}>
      <button className="login-back" type="button" onClick={back}>
        <ChevronLeft size={16} /> Back to{" "}
        {resetStep === "email" ? "sign in" : "previous step"}
      </button>
      {resetStep === "email" && (
        <>
          <h1>Reset your password</h1>
          <p className="login-description">
            Enter your email and we’ll send a verification code.
          </p>
          <form className="login-form" onSubmit={sendCode}>
            <LoginField
              label="Email Address"
              type="email"
              value={resetEmail}
              onChange={setResetEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {error && <p className="login-error">{error}</p>}
            <button className="login-submit">Send verification code</button>
          </form>
        </>
      )}
      {resetStep === "code" && (
        <>
          <h1>Check your email</h1>
          <p className="login-description">
            A verification code has been sent to <b>{resetEmail}</b>.
          </p>
          <div className="login-pin" aria-label="Six digit verification code">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  pinRefs.current[index] = element;
                }}
                value={digit}
                onChange={(event) => updatePin(index, event.target.value)}
                onKeyDown={(event) =>
                  event.key === "Backspace" &&
                  !digit &&
                  index > 0 &&
                  pinRefs.current[index - 1]?.focus()
                }
                inputMode="numeric"
                maxLength="1"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>
          <p className="login-helper">
            Enter any six digits to continue in this demo.
          </p>
        </>
      )}
      {resetStep === "password" && (
        <>
          <h1>Create a new password</h1>
          <p className="login-description">
            Use at least six characters and keep it somewhere safe.
          </p>
          <form className="login-form" onSubmit={resetPassword}>
            <PasswordField
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
            {error && <p className="login-error">{error}</p>}
            <button className="login-submit">Save new password</button>
          </form>
        </>
      )}
      {resetStep === "success" && (
        <div className="login-success">
          <BadgeCheck size={36} />
          <h1>Password updated</h1>
          <p>Your password has been updated. You can now sign in with it.</p>
          <button
            className="login-submit"
            onClick={() => {
              setPassword("");
              setError("");
              setResetStep("login");
            }}
          >
            Return to sign in
          </button>
        </div>
      )}
    </div>
  );
  return (
    <main className="login-page">
      <section className="login-card">
        {resetStep === "login" ? loginScreen : resetScreen}
      </section>
    </main>
  );
}

function LoginField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}) {
  return (
    <label className="login-field">
      {label}
      <input
        className="login-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </label>
  );
}
function PasswordField({ label, value, onChange, show, onToggle }) {
  return (
    <label className="login-field">
      {label}
      <span className="login-password-wrap">
        <input
          className="login-input"
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  );
}
function LoginRemember({ checked, onChange }) {
  return (
    <label className="login-remember">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />{" "}
      Remember me
    </label>
  );
}
