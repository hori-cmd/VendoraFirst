import { getSellers } from "./moderation";
import { getStorefrontProducts } from "./products";

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(value)) return value;
  } catch {
    // A backend version would return a recoverable data error here.
  }
  return [];
}

const defaultAdminSettings = {
  platformName: "Vendora",
  supportEmail: "support@vendora.com",
  marketplaceNotice: "Welcome to Vendora Marketplace.",
};

export function getAdminSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem("vendora-admin-settings") || "null");
    if (stored && typeof stored === "object") return { ...defaultAdminSettings, ...stored };
  } catch {
    // A backend implementation would return a recoverable settings error here.
  }
  return { ...defaultAdminSettings };
}

export function saveAdminSettings(settings) {
  const platformName = settings.platformName.trim();
  const supportEmail = settings.supportEmail.trim().toLowerCase();
  const marketplaceNotice = settings.marketplaceNotice.trim();
  if (!platformName) return { error: "Enter a platform name." };
  if (!/^\S+@\S+\.\S+$/.test(supportEmail)) return { error: "Enter a valid support email." };
  if (!marketplaceNotice) return { error: "Enter a marketplace notice." };
  const nextSettings = { platformName, supportEmail, marketplaceNotice };
  localStorage.setItem("vendora-admin-settings", JSON.stringify(nextSettings));
  return { settings: nextSettings };
}

function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getAdminUsers() {
  const accounts = readList("vendora-accounts");
  const sellerEmails = new Set(getSellers().map((seller) => seller.email));
  const users = accounts.map((account) => ({
    name: account.name,
    email: account.email,
    type: account.accountType || (sellerEmails.has(account.email) ? "Seller" : "Buyer"),
    restricted: localStorage.getItem(`vendora-restricted-user-${account.email}`) === "true",
  }));

  getSellers().forEach((seller) => {
    if (users.some((user) => user.email === seller.email)) return;
    users.push({
      name: seller.name,
      email: seller.email,
      type: "Seller",
      restricted: localStorage.getItem(`vendora-restricted-user-${seller.email}`) === "true",
    });
  });
  return users;
}

export function saveAdminUser({ name, email, accountType, password, existingEmail }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (name.trim().length < 2) return { error: "Enter the user's name." };
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return { error: "Enter a valid email address." };
  if (!existingEmail && password.length < 6) return { error: "Temporary password must be at least 6 characters." };

  const accounts = readList("vendora-accounts");
  if (!existingEmail && accounts.some((account) => account.email === normalizedEmail))
    return { error: "An account with this email already exists." };

  const nextAccount = (account = {}) => ({
    ...account,
    name: name.trim(),
    email: existingEmail || normalizedEmail,
    accountType,
    password: account.password || password,
    phone: account.phone || "",
  });
  const nextAccounts = existingEmail
    ? accounts.map((account) => account.email === existingEmail ? nextAccount(account) : account)
    : [...accounts, nextAccount()];
  localStorage.setItem("vendora-accounts", JSON.stringify(nextAccounts));
  return { account: nextAccount(accounts.find((account) => account.email === existingEmail)) };
}

export function getAdminOrders() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith("vendora-orders-"))
    .flatMap((key) => readList(key))
    .filter((order, index, orders) => orders.findIndex((item) => item.id === order.id) === index);
}

// Admin reviews only listings saved by seller accounts, never the buyer demo catalogue.
export function getAdminProducts() {
  return getStorefrontProducts();
}

// Produces analytics directly from the marketplace records currently saved in local storage.
export function getAdminAnalytics(reports) {
  const orders = getAdminOrders();
  const users = getAdminUsers();
  const currentYear = new Date().getFullYear();
  const monthlyOrders = Array.from({ length: 12 }, (_, month) => ({
    label: new Date(currentYear, month, 1).toLocaleDateString("en-US", { month: "short" }),
    value: 0,
  }));

  orders.forEach((order) => {
    const orderDate = new Date(order.date);
    if (!Number.isNaN(orderDate.valueOf()) && orderDate.getFullYear() === currentYear) {
      monthlyOrders[orderDate.getMonth()].value += 1;
    }
  });

  const buyerCount = users.filter((user) => user.type === "Buyer").length;
  const orderCount = orders.length;
  return {
    grossSales: orders
      .filter((order) => order.status !== "Cancelled")
      .reduce((total, order) => total + Number(order.total || 0), 0),
    orderCount,
    conversion: buyerCount ? (orderCount / buyerCount) * 100 : 0,
    supportTickets: reports.filter((report) => ["Pending", "Submitted to Admin"].includes(report.status)).length,
    monthlyOrders,
  };
}

export function getAdminStats(reports) {
  const users = getAdminUsers();
  const sellers = getSellers();
  const orders = getAdminOrders();
  const pendingReviews = reports.filter((report) =>
    ["Pending", "Submitted to Admin"].includes(report.status),
  );
  return {
    totalUsers: users.length,
    activeSellers: sellers.filter(
      (seller) => localStorage.getItem(`vendora-banned-${seller.email}`) !== "true",
    ).length,
    ordersToday: orders.filter((order) => order.date === getTodayLabel()).length,
    pendingReviews: pendingReviews.length,
  };
}

export function setUserRestriction(email, restricted) {
  const key = `vendora-restricted-user-${email}`;
  if (restricted) localStorage.setItem(key, "true");
  else localStorage.removeItem(key);
}
