const staffAccounts = {
  staff: { email: "staff@vendora.local", password: "staff123" },
  admin: { email: "admin@vendora.local", password: "admin123" },
};

const staffNames = {
  staff: "Vendora Staff",
  admin: "Vendora Admin",
};

// Shared validation keeps client-side feedback consistent before a future API call.
function validateCredentials(email, password) {
  if (!/^\S+@\S+\.\S+$/.test(email))
    return { error: "Enter a valid email address." };
  if (password.length < 6)
    return { error: "Password must be at least 6 characters." };
  return null;
}

// Registration is isolated so it can later become a POST /users request.
export function registerAccount({ name, email, phone, password }) {
  if (name.trim().length < 2) return { error: "Enter your full name." };
  const validationError = validateCredentials(email, password);
  if (validationError) return validationError;

  const accounts = JSON.parse(localStorage.getItem("vendora-accounts") || "[]");
  const normalizedEmail = email.trim().toLowerCase();
  if (accounts.some((account) => account.email === normalizedEmail))
    return { error: "An account with this email already exists." };

  const account = {
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password,
  };
  localStorage.setItem("vendora-accounts", JSON.stringify([...accounts, account]));
  return { account };
}

// Login is isolated so it can later become a POST /sessions request.
export function loginAccount({ loginRole, email, password }) {
  const validationError = validateCredentials(email, password);
  if (validationError) return validationError;

  const normalizedEmail = email.trim().toLowerCase();
  if (localStorage.getItem(`vendora-restricted-user-${normalizedEmail}`) === "true")
    return { error: "This account has been restricted. Contact Vendora support." };
  if (loginRole !== "buyer") {
    const staffAccount = staffAccounts[loginRole];
    if (
      !staffAccount ||
      normalizedEmail !== staffAccount.email ||
      password !== staffAccount.password
    )
      return { error: "Staff credentials are incorrect." };
    return {
      account: {
        name: staffNames[loginRole],
        email: staffAccount.email,
        password,
        role: loginRole,
      },
    };
  }

  const accounts = JSON.parse(localStorage.getItem("vendora-accounts") || "[]");
  const account = accounts.find(
    (item) => item.email === normalizedEmail && item.password === password,
  );
  if (account) return { account };

  if (accounts.some((item) => item.email === normalizedEmail))
    return { error: "Email or password is incorrect." };

  return {
    error: "No account found for this email. Use Create an account below to register it.",
  };
}

export function loadStoredUser() {
  try {
    return (
      JSON.parse(
        localStorage.getItem("vendora-user") ||
          sessionStorage.getItem("vendora-user"),
      ) || null
    );
  } catch {
    return null;
  }
}

export function persistLogin(nextUser, remember) {
  const publicUser = {
    ...nextUser,
    name: nextUser.name,
    email: nextUser.email,
    phone: nextUser.phone || "",
  };
  (remember ? localStorage : sessionStorage).setItem(
    "vendora-user",
    JSON.stringify(publicUser),
  );
  return publicUser;
}

export function persistUserUpdate(user, nextUser) {
  const publicUser = { ...user, ...nextUser };
  localStorage.setItem("vendora-user", JSON.stringify(publicUser));
  const accounts = JSON.parse(localStorage.getItem("vendora-accounts") || "[]");
  localStorage.setItem(
    "vendora-accounts",
    JSON.stringify(
      accounts.map((account) =>
        account.email === user.email ? { ...account, ...publicUser } : account,
      ),
    ),
  );
  return publicUser;
}

export function clearStoredUser() {
  localStorage.removeItem("vendora-user");
  sessionStorage.removeItem("vendora-user");
}
