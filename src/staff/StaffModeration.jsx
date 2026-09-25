import { useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Download,
  Eye,
  Pencil,
  Plus,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import "./StaffModeration.css";
import Status from "../components/Status";
import {
  getReports,
  saveReports,
  getSellers,
  banSeller,
} from "../logic/moderation";
import {
  getAdminOrders,
  getAdminProducts,
  getAdminStats,
  getAdminAnalytics,
  getAdminSettings,
  getAdminUsers,
  saveAdminSettings,
  saveAdminUser,
  setUserRestriction,
} from "../logic/admin";
import { updateSellerProduct } from "../logic/products";
import { initials } from "../utils/helpers";

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="staff-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
function StatCard({ label, value, detail, attention = false }) {
  return (
    <article className={`staff-stat ${attention ? "attention" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
function Dialog({ title, children, onClose }) {
  return (
    <div className="staff-dialog-backdrop" onMouseDown={onClose}>
      <section
        className="staff-dialog"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Dashboard({ stats, reports, sellers, orders, go }) {
  const activities = [
    ...reports.map((r) => [
      "Product report",
      r.seller,
      r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Current",
      r.status,
    ]),
    ...orders.map((o) => [
      `Order ${o.id}`,
      o.customer || "Customer",
      o.date,
      o.status,
    ]),
    ...sellers.map((s) => [
      "Seller account",
      s.name,
      "Current",
      s.verified ? "Verified" : "Pending",
    ]),
  ].slice(0, 5);
  const actions = [
    ["Manage Users", "View and restrict marketplace accounts", "users", Users],
    [
      "Review Orders",
      "Monitor marketplace order activity",
      "orders",
      ClipboardList,
    ],
    ["Review Shops", "Manage sellers and products", "shops-products", Store],
    [
      "Open Reports",
      "Review pending marketplace concerns",
      "reports-analytics",
      BarChart3,
    ],
  ];
  return (
    <div className="staff-dashboard">
      <section className="staff-welcome">
        <div>
          <h1>Welcome, Staff</h1>
          <p>Monitor users, shops, orders, and platform activity.</p>
        </div>
        <span>V</span>
      </section>
      <section className="staff-stat-grid">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          detail="Registered accounts"
        />
        <StatCard
          label="Active Sellers"
          value={stats.activeSellers}
          detail="Shops not restricted"
        />
        <StatCard
          label="Orders Today"
          value={stats.ordersToday}
          detail="Placed today"
        />
        <StatCard
          label="Pending Reviews"
          value={stats.pendingReviews}
          detail="Needs attention"
          attention
        />
      </section>
      <section className="staff-dashboard-grid">
        <div className="staff-table-card">
          <div className="staff-card-heading">
            <h2>Recent Platform Activity</h2>
            <button
              className="staff-text-btn"
              onClick={() => go("reports-analytics")}
            >
              View reports
            </button>
          </div>
          {activities.length ? (
            <table>
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>User / Shop</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(([label, subject, date, status], index) => (
                  <tr key={`${label}-${index}`}>
                    <td>{label}</td>
                    <td>{subject}</td>
                    <td>{date}</td>
                    <td>
                      <Status>{status}</Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No platform activity yet"
              description="Orders, reports, and seller activity will appear here."
            />
          )}
        </div>
        <div className="staff-table-card staff-quick-actions">
          <h2>Quick Actions</h2>
          {actions.map(([title, description, page, Icon]) => (
            <button key={page} onClick={() => go(page)}>
              <Icon size={17} />
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function UsersPage({ users, onSave, onRestrict }) {
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    accountType: "Buyer",
    password: "",
  });
  const [error, setError] = useState("");
  const open = (mode, user) => {
    setError("");
    setEditor({ mode, user });
    setDraft(
      user
        ? {
            name: user.name,
            email: user.email,
            accountType: user.type,
            password: "",
          }
        : { name: "", email: "", accountType: "Buyer", password: "" },
    );
  };
  const submit = (event) => {
    event.preventDefault();
    const result = onSave({
      ...draft,
      existingEmail: editor.mode === "edit" ? editor.user.email : "",
    });
    if (result.error) return setError(result.error);
    setEditor(null);
  };
  return (
    <div className="staff-page">
      <div className="staff-page-title">
        <div>
          <h1>User Management</h1>
          <p>Manage buyer and seller accounts registered in Vendora.</p>
        </div>
        <button className="staff-primary" onClick={() => open("create")}>
          <Plus size={16} /> Add User
        </button>
      </div>
      <div className="staff-table-card">
        {users.length ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.type}</td>
                  <td>
                    <Status>{user.restricted ? "Restricted" : "Active"}</Status>
                  </td>
                  <td className="staff-actions">
                    <button
                      className="staff-text-btn"
                      onClick={() => open("view", user)}
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      className="staff-text-btn"
                      onClick={() => open("edit", user)}
                    >
                      Edit
                    </button>
                    <button
                      className={`staff-text-btn ${user.restricted ? "restore" : "danger"}`}
                      onClick={() => onRestrict(user)}
                    >
                      {user.restricted ? "Restore" : "Restrict"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon={Users}
            title="No registered users"
            description="New buyer registrations will appear here."
          />
        )}
      </div>
      {editor && (
        <Dialog
          title={
            editor.mode === "create"
              ? "Add user"
              : editor.mode === "edit"
                ? "Edit user"
                : "Account details"
          }
          onClose={() => setEditor(null)}
        >
          {editor.mode === "view" ? (
            <div className="staff-details">
              <p>
                <b>Name</b>
                {draft.name}
              </p>
              <p>
                <b>Email</b>
                {draft.email}
              </p>
              <p>
                <b>Role</b>
                {draft.accountType}
              </p>
              <button className="staff-primary" onClick={() => setEditor(null)}>
                Close
              </button>
            </div>
          ) : (
            <form className="staff-form" onSubmit={submit}>
              <label>
                Full name
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Email address
                <input
                  type="email"
                  value={draft.email}
                  disabled={editor.mode === "edit"}
                  onChange={(e) =>
                    setDraft({ ...draft, email: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Role
                <select
                  value={draft.accountType}
                  onChange={(e) =>
                    setDraft({ ...draft, accountType: e.target.value })
                  }
                >
                  <option>Buyer</option>
                  <option>Seller</option>
                </select>
              </label>
              {editor.mode === "create" && (
                <label>
                  Temporary password
                  <input
                    type="password"
                    value={draft.password}
                    onChange={(e) =>
                      setDraft({ ...draft, password: e.target.value })
                    }
                    minLength="6"
                    required
                  />
                </label>
              )}
              {error && <p className="staff-error">{error}</p>}
              <div className="staff-form-actions">
                <button type="button" onClick={() => setEditor(null)}>
                  Cancel
                </button>
                <button className="staff-primary">
                  {editor.mode === "create" ? "Add user" : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </Dialog>
      )}
    </div>
  );
}

function OrdersPage({ orders }) {
  const [selected, setSelected] = useState(null);
  const money = (n) => `₱${Number(n || 0).toLocaleString()}`;
  const exportReport = () => {
    const csv = [
      "Order ID,Customer,Date,Total,Status",
      ...orders.map((o) =>
        [o.id, o.customer || "Customer", o.date, o.total, o.status].join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "vendora-orders-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="staff-page">
      <div className="staff-page-title">
        <div>
          <h1>Orders</h1>
          <p>Monitor orders placed across the marketplace.</p>
        </div>
        <button className="staff-outline" onClick={exportReport}>
          <Download size={15} /> Export Report
        </button>
      </div>
      <div className="staff-table-card">
        {orders.length ? (
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customer || "Customer"}</td>
                  <td>{o.date}</td>
                  <td>{money(o.total)}</td>
                  <td>
                    <Status>{o.status}</Status>
                  </td>
                  <td>
                    <button
                      className="staff-text-btn"
                      onClick={() => setSelected(o)}
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No orders yet"
            description="Orders placed by buyers will appear here."
          />
        )}
      </div>
      {selected && (
        <Dialog
          title={`Order ${selected.id}`}
          onClose={() => setSelected(null)}
        >
          <div className="staff-details">
            <p>
              <b>Customer</b>
              {selected.customer || "Customer"}
            </p>
            <p>
              <b>Order date</b>
              {selected.date}
            </p>
            <p>
              <b>Total</b>
              {money(selected.total)}
            </p>
            <p>
              <b>Status</b>
              <Status>{selected.status}</Status>
            </p>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function ProductsPage({ products, onSave }) {
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [notice, setNotice] = useState("");
  const edit = (product) => {
    setEditing(product);
    setDraft({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category || "Electronics",
    });
  };
  const save = (event) => {
    event.preventDefault();
    const result = onSave(editing, draft);
    if (result.error) return setNotice(result.error);
    setEditing(null);
    setNotice("Listing changes saved.");
  };
  return (
    <div className="staff-page">
      <div className="staff-page-title">
        <div>
          <h1>Shops & Products</h1>
          <p>Review seller shops and marketplace listings.</p>
        </div>
        <button
          className="staff-outline"
          onClick={() => setNotice("Choose a pencil icon to edit a listing.")}
        >
          <Eye size={15} /> Review Listings
        </button>
      </div>
      {products.length ? (
        <section className="staff-product-grid">
          {products.map((p) => (
            <article
              className="staff-product-card"
              key={`${p.sellerEmail}-${p.id}`}
            >
              <div className="staff-product-art" style={{ background: p.bg }}>
                <span>{p.icon || "📦"}</span>
              </div>
              <div>
                <h2>{p.name}</h2>
                <strong>₱{Number(p.price).toLocaleString()}</strong>
                <p>
                  Seller: {p.seller} · {p.stock} in stock
                </p>
              </div>
              <footer>
                <Status>Active</Status>
                <span>
                  <button
                    aria-label={`View ${p.name}`}
                    onClick={() => setSelected(p)}
                  >
                    <Eye size={15} />
                  </button>
                  <button aria-label={`Edit ${p.name}`} onClick={() => edit(p)}>
                    <Pencil size={15} />
                  </button>
                </span>
              </footer>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={Store}
          title="No marketplace listings"
          description="Seller products will appear here once created."
        />
      )}
      {notice && <div className="staff-toast">{notice}</div>}
      {selected && (
        <Dialog title="Listing details" onClose={() => setSelected(null)}>
          <div className="staff-details">
            <p>
              <b>Product</b>
              {selected.name}
            </p>
            <p>
              <b>Seller</b>
              {selected.seller}
            </p>
            <p>
              <b>Price</b>₱{selected.price}
            </p>
            <p>
              <b>Category</b>
              {selected.category}
            </p>
            <p>
              <b>Stock</b>
              {selected.stock}
            </p>
          </div>
        </Dialog>
      )}
      {editing && (
        <Dialog title="Edit listing" onClose={() => setEditing(null)}>
          <form className="staff-form" onSubmit={save}>
            <label>
              Product name
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                required
              />
            </label>
            <label>
              Category
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value })
                }
              >
                {[
                  "Electronics",
                  "Fashion",
                  "Home & Living",
                  "Beauty & Health",
                  "Sports & Outdoors",
                  "Toys & Games",
                  "Groceries",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Price
              <input
                type="number"
                min="0"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                required
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                min="0"
                value={draft.stock}
                onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                required
              />
            </label>
            <div className="staff-form-actions">
              <button type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="staff-primary">Save changes</button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}

function AnalyticsPage({ analytics, reports, onReport }) {
  const max = Math.max(...analytics.monthlyOrders.map((m) => m.value), 1);
  return (
    <div className="staff-page">
      <section className="staff-welcome">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Marketplace performance calculated from current saved data.</p>
        </div>
        <span>V</span>
      </section>
      <section className="staff-stat-grid">
        <StatCard
          label="Gross Sales"
          value={`₱${analytics.grossSales.toLocaleString()}`}
          detail="Non-cancelled orders"
        />
        <StatCard
          label="Orders"
          value={analytics.orderCount}
          detail="Marketplace orders"
        />
        <StatCard
          label="Conversion"
          value={`${analytics.conversion.toFixed(1)}%`}
          detail="Orders per registered buyer"
        />
        <StatCard
          label="Support Tickets"
          value={analytics.supportTickets}
          detail="Open customer reports"
          attention
        />
      </section>
      <section className="staff-table-card staff-chart">
        <h2>Monthly Order Volume</h2>
        <div>
          {analytics.monthlyOrders.map((m) => (
            <span key={m.label}>
              <i style={{ height: `${Math.max(2, (m.value / max) * 100)}%` }} />
              <b>{m.label}</b>
              <small>{m.value}</small>
            </span>
          ))}
        </div>
      </section>
      <section className="staff-table-card">
        {" "}
        <h2>Support Tickets</h2>
        {reports.length ? (
          <table>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Product</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.seller}</td>
                  <td>{r.product}</td>
                  <td>{r.reason}</td>
                  <td>
                    <Status>{r.status}</Status>
                  </td>
                  <td>
                    <button
                      className="staff-text-btn"
                      onClick={() => onReport(r, "Approved")}
                    >
                      Approve & Restrict
                    </button>
                    <button
                      className="staff-text-btn"
                      onClick={() => onReport(r, "Rejected")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No support tickets"
            description="New customer reports will appear here."
          />
        )}
      </section>
    </div>
  );
}

function SecurityPage({ orders, reports }) {
  const count = orders.length + reports.length;
  return (
    <div className="staff-page">
      <div className="staff-page-title">
        <div>
          <h1>System & Security</h1>
          <p>Staff access controls for the marketplace.</p>
        </div>
      </div>
      <div className="staff-security">
        <section className="staff-table-card">
          {[
            [
              ShieldCheck,
              "Role-based access",
              "Staff can manage marketplace operations.",
              "Enabled",
            ],
            [
              Users,
              "Session protection",
              localStorage.getItem("vendora-user")
                ? "This staff session is remembered on this device."
                : "This session ends when the browser closes.",
              "Active",
            ],
            [
              ClipboardList,
              "Audit activity",
              `${count} saved marketplace records are available for review.`,
              "Available",
            ],
          ].map(([Icon, title, copy, status]) => (
            <article key={title}>
              <Icon size={18} />
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
              <Status>{status}</Status>
            </article>
          ))}
        </section>
        <aside className="staff-table-card">
          <ShieldCheck size={25} />
          <h2>Access policy</h2>
          <p>
            Staff can manage marketplace users, listings, orders, and reports.
          </p>
        </aside>
      </div>
    </div>
  );
}

function SettingsPage({ user, onSave }) {
  const [saved, setSaved] = useState(() => getAdminSettings());
  const [draft, setDraft] = useState(() => getAdminSettings());
  const [feedback, setFeedback] = useState("");
  const submit = (event) => {
    event.preventDefault();
    const result = onSave(draft);
    if (result.error) return setFeedback(result.error);
    setSaved(result.settings);
    setFeedback("Staff settings saved.");
  };
  return (
    <div className="staff-page">
      <div className="staff-page-title">
        <div>
          <h1>Staff Settings</h1>
          <p>Configure platform-level marketplace settings.</p>
        </div>
      </div>
      <form className="staff-settings" onSubmit={submit}>
        <div className="staff-profile">
          <b>{initials(user?.name)}</b>
          <span>
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
            <em>Staff</em>
          </span>
        </div>
        <div className="staff-form">
          <label>
            Platform name
            <input
              value={draft.platformName}
              onChange={(e) =>
                setDraft({ ...draft, platformName: e.target.value })
              }
              required
            />
          </label>
          <label>
            Support email
            <input
              type="email"
              value={draft.supportEmail}
              onChange={(e) =>
                setDraft({ ...draft, supportEmail: e.target.value })
              }
              required
            />
          </label>
          <label className="wide">
            Marketplace notice
            <textarea
              value={draft.marketplaceNotice}
              onChange={(e) =>
                setDraft({ ...draft, marketplaceNotice: e.target.value })
              }
              required
            />
          </label>
        </div>
        {feedback && <p className="staff-feedback">{feedback}</p>}
        <div className="staff-form-actions">
          <button
            type="button"
            onClick={() => {
              setDraft(saved);
              setFeedback("");
            }}
          >
            Cancel
          </button>
          <button className="staff-primary">Save Changes</button>
        </div>
      </form>
    </div>
  );
}

export default function StaffModeration({ page, go, user }) {
  const [reports, setReports] = useState(() => getReports());
  const [, refresh] = useState(0);
  const sellers = getSellers();
  const products = getAdminProducts();
  const users = getAdminUsers();
  const orders = getAdminOrders();
  const stats = getAdminStats(reports);
  const analytics = getAdminAnalytics(reports);
  const updateReport = (report, status) => {
    const next = reports.map((item) =>
      item.id === report.id ? { ...item, status } : item,
    );
    setReports(next);
    saveReports(next);
    if (status === "Approved" && report.sellerEmail)
      banSeller(report.sellerEmail);
    refresh((n) => n + 1);
  };
  const saveUser = (value) => {
    const result = saveAdminUser(value);
    if (!result.error) refresh((n) => n + 1);
    return result;
  };
  const restrict = (value) => {
    setUserRestriction(value.email, !value.restricted);
    refresh((n) => n + 1);
  };
  const saveProduct = (product, changes) => {
    const result = updateSellerProduct({
      sellerEmail: product.sellerEmail,
      productId: product.id,
      changes,
    });
    if (!result.error) refresh((n) => n + 1);
    return result;
  };
  if (page === "staff-dashboard")
    return (
      <Dashboard
        stats={stats}
        reports={reports}
        sellers={sellers}
        orders={orders}
        go={go}
      />
    );
  if (page === "users")
    return <UsersPage users={users} onSave={saveUser} onRestrict={restrict} />;
  if (page === "orders") return <OrdersPage orders={orders} />;
  if (page === "shops-products")
    return <ProductsPage products={products} onSave={saveProduct} />;
  if (page === "reports-analytics")
    return (
      <AnalyticsPage
        analytics={analytics}
        reports={reports}
        onReport={updateReport}
      />
    );
  if (page === "system-security")
    return <SecurityPage orders={orders} reports={reports} />;
  if (page === "settings")
    return <SettingsPage user={user} onSave={saveAdminSettings} />;
  return (
    <div className="staff-page">
      <EmptyState
        icon={ShieldCheck}
        title="No configuration available"
        description="Connect the backend to manage this area."
      />
    </div>
  );
}
