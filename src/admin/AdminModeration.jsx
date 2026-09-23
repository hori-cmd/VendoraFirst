import { useState } from "react";
import "./AdminModeration.css";
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
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function StatCard({ label, value, detail, attention = false }) {
  return (
    <article className={`admin-stat ${attention ? "attention" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Dashboard({ stats, reports, sellers, orders, go, user }) {
  const workspaceRole = user?.role === "staff" ? "Staff" : "Admin";
  const activities = [
    ...reports.map((report) => ({
      label: "Product report",
      subject: report.seller,
      status: report.status,
      date: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Current",
    })),
    ...orders.map((order) => ({
      label: `Order ${order.id}`,
      subject: order.customer || "Customer",
      status: order.status,
      date: order.date,
    })),
    ...sellers.map((seller) => ({
      label: "Seller account",
      subject: seller.name,
      status: seller.verified ? "Verified" : "Pending",
      date: "Current",
    })),
  ].slice(0, 5);

  const quickActions = [
    ["Manage Users", "View and restrict marketplace accounts", "users", Users],
    ["Review Orders", "Monitor marketplace order activity", "orders", ClipboardList],
    ["Review Shops", "Manage sellers and products", "shops-products", Store],
    ["Open Reports", "Review pending marketplace concerns", "reports-analytics", BarChart3],
  ];

  return (
    <div className="admin-dashboard">
      <section className="admin-welcome">
        <div>
          <h1>Welcome, {workspaceRole}</h1>
          <p>Monitor users, shops, orders, and platform activity.</p>
        </div>
        <span aria-hidden="true">V</span>
      </section>
      <section className="admin-stat-grid" aria-label="Marketplace totals">
        <StatCard label="Total Users" value={stats.totalUsers} detail="Registered accounts" />
        <StatCard label="Active Sellers" value={stats.activeSellers} detail="Shops not restricted" />
        <StatCard label="Orders Today" value={stats.ordersToday} detail="Placed today" />
        <StatCard label="Pending Reviews" value={stats.pendingReviews} detail="Needs attention" attention />
      </section>
      <section className="admin-dashboard-grid">
        <div className="admin-activity table-card">
          <div className="admin-card-heading">
            <h2>Recent Platform Activity</h2>
            <button className="text-btn" onClick={() => go("reports-analytics")}>View reports</button>
          </div>
          {activities.length ?
            <table>
              <thead><tr><th>Activity</th><th>User / Shop</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {activities.map((activity, index) => (
                  <tr key={`${activity.label}-${activity.subject}-${index}`}>
                    <td>{activity.label}</td><td>{activity.subject}</td><td>{activity.date}</td>
                    <td><Status>{activity.status}</Status></td>
                  </tr>
                ))}
              </tbody>
            </table>
          : <EmptyState icon={ClipboardList} title="No platform activity yet" description="Orders, reports, and seller activity will appear here." />}
        </div>
        <div className="admin-quick-actions table-card">
          <h2>Quick Actions</h2>
          {quickActions.map(([title, description, target, Icon]) => (
            <button key={target} onClick={() => go(target)}>
              <Icon size={17} />
              <span><strong>{title}</strong><small>{description}</small></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function UsersPage({ users, onSaveUser, onToggleRestriction }) {
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState({ name: "", email: "", accountType: "Buyer", password: "" });
  const [formError, setFormError] = useState("");

  const openEditor = (mode, user) => {
    setFormError("");
    setEditor({ mode, user });
    setDraft(user
      ? { name: user.name, email: user.email, accountType: user.type, password: "" }
      : { name: "", email: "", accountType: "Buyer", password: "" });
  };
  const updateDraft = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };
  const submitUser = (event) => {
    event.preventDefault();
    const result = onSaveUser({
      ...draft,
      existingEmail: editor?.mode === "edit" ? editor.user.email : "",
    });
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setEditor(null);
  };

  return (
    <div className="admin-page">
      <div className="page-title admin-page-title"><div><h1>User Management</h1><p>Manage buyer and seller accounts registered in Vendora.</p></div><button className="primary admin-add-user" onClick={() => openEditor("create")}><Plus size={16} /> Add User</button></div>
      <div className="table-card admin-users-table">
        {users.length ? <table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {users.map((user) => <tr key={user.email}><td>{user.name}</td><td>{user.email}</td><td>{user.type}</td><td><Status>{user.restricted ? "Restricted" : "Active"}</Status></td><td className="admin-user-actions"><div className="admin-user-action-row"><button className="text-btn" onClick={() => openEditor("view", user)}><Eye size={14} /> View</button><button className="text-btn" onClick={() => openEditor("edit", user)}>Edit</button><button className={`text-btn ${user.restricted ? "restore" : "danger"}`} onClick={() => onToggleRestriction(user)}>{user.restricted ? "Restore" : "Restrict"}</button></div></td></tr>)}
        </tbody></table> : <EmptyState icon={Users} title="No registered users" description="New buyer registrations will appear here." />}
      </div>
      {editor && <div className="admin-dialog-backdrop" role="presentation" onMouseDown={() => setEditor(null)}>
        <section className="admin-user-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-user-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="admin-dialog-heading"><div><h2 id="admin-user-dialog-title">{editor.mode === "create" ? "Add user" : editor.mode === "edit" ? "Edit user" : "Account details"}</h2><p>{editor.mode === "create" ? "Create a buyer or seller account for the marketplace." : "Review the account details and access status."}</p></div><button className="admin-dialog-close" aria-label="Close" onClick={() => setEditor(null)}>×</button></div>
          {editor.mode === "view" ? <div className="admin-user-details"><div><span>Name</span><strong>{draft.name}</strong></div><div><span>Email</span><strong>{draft.email}</strong></div><div><span>Role</span><strong>{draft.accountType}</strong></div><div><span>Status</span><Status>{editor.user.restricted ? "Restricted" : "Active"}</Status></div><button className="primary" onClick={() => setEditor(null)}>Close</button></div> : <form className="admin-user-form" onSubmit={submitUser}>
            <label>Full name<input name="name" value={draft.name} onChange={updateDraft} autoComplete="name" required /></label>
            <label>Email address<input name="email" type="email" value={draft.email} onChange={updateDraft} disabled={editor.mode === "edit"} autoComplete="email" required /></label>
            <label>Role<select name="accountType" value={draft.accountType} onChange={updateDraft}><option>Buyer</option><option>Seller</option></select></label>
            {editor.mode === "create" && <label>Temporary password<input name="password" type="password" value={draft.password} onChange={updateDraft} autoComplete="new-password" minLength="6" required /></label>}
            {formError && <p className="admin-form-error" role="alert">{formError}</p>}
            <div className="admin-dialog-actions"><button type="button" onClick={() => setEditor(null)}>Cancel</button><button className="primary" type="submit">{editor.mode === "create" ? "Add user" : "Save changes"}</button></div>
          </form>}
        </section>
      </div>}
    </div>
  );
}

function OrdersPage({ orders }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const formatPrice = (price) => `₱${Number(price || 0).toLocaleString()}`;
  const exportReport = () => {
    const escapeValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = orders.map((order) => [
      order.id,
      order.customer || "Customer",
      order.date,
      Number(order.total || 0).toFixed(2),
      order.status,
      (order.products || []).map((product) => typeof product === "string" ? product : product.name).join(", "),
    ].map(escapeValue).join(","));
    const report = ["Order ID,Customer,Date,Total,Status,Products", ...rows].join("\n");
    const file = new Blob([report], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "vendora-orders-report.csv";
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="admin-page admin-orders-page">
      <div className="page-title admin-page-title"><div><h1>Orders</h1><p>Monitor orders placed across the marketplace.</p></div><button className="outline admin-export-report" onClick={exportReport} disabled={!orders.length}><Download size={15} /> Export Report</button></div>
      <div className="table-card">
        {orders.length ? <table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {orders.map((order) => <tr key={order.id}><td>{order.id}</td><td>{order.customer || "Customer"}</td><td>{order.date}</td><td>{formatPrice(order.total)}</td><td><Status>{order.status}</Status></td><td><button className="text-btn" onClick={() => setSelectedOrder(order)}><Eye size={14} /> View</button></td></tr>)}
        </tbody></table> : <EmptyState icon={ClipboardList} title="No orders yet" description="Orders placed by buyers will appear here." />}
      </div>
      {selectedOrder && <div className="admin-dialog-backdrop" role="presentation" onMouseDown={() => setSelectedOrder(null)}>
        <section className="admin-user-dialog admin-order-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-order-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="admin-dialog-heading"><div><h2 id="admin-order-dialog-title">Order {selectedOrder.id}</h2><p>Review the buyer, order status, and purchased items.</p></div><button className="admin-dialog-close" aria-label="Close" onClick={() => setSelectedOrder(null)}>×</button></div>
          <div className="admin-order-summary"><div><span>Customer</span><strong>{selectedOrder.customer || "Customer"}</strong></div><div><span>Order date</span><strong>{selectedOrder.date}</strong></div><div><span>Total</span><strong>{formatPrice(selectedOrder.total)}</strong></div><div><span>Status</span><Status>{selectedOrder.status}</Status></div></div>
          <div className="admin-order-items"><h3>Items</h3>{selectedOrder.products?.length ? selectedOrder.products.map((product, index) => <div key={`${typeof product === "string" ? product : product.productId}-${index}`}><span>{typeof product === "string" ? product : `${product.name} × ${product.quantity}`}</span>{typeof product !== "string" && <strong>{formatPrice(product.price * product.quantity)}</strong>}</div>) : <p>No item information saved for this order.</p>}</div>
        </section>
      </div>}
    </div>
  );
}

function ProductsPage({ products, onSaveProduct }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [draft, setDraft] = useState({ name: "", price: "", stock: "", category: "" });
  const [formError, setFormError] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const formatPrice = (price) => `₱${Number(price || 0).toLocaleString()}`;
  const showReviewNotice = (message) => {
    setReviewNotice(message);
    window.setTimeout(() => setReviewNotice(""), 3200);
  };
  const openEditor = (product) => {
    setFormError("");
    setEditingProduct(product);
    setDraft({ name: product.name, price: String(product.price), stock: String(product.stock), category: product.category || "" });
  };
  const updateDraft = (event) => setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
  const saveProduct = (event) => {
    event.preventDefault();
    const result = onSaveProduct(editingProduct, draft);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setEditingProduct(null);
    showReviewNotice("Listing changes saved.");
  };

  return (
    <div className="admin-page admin-products-page">
      <div className="page-title admin-page-title"><div><h1>Shops & Products</h1><p>Review seller shops and marketplace listings.</p></div><button className="outline admin-review-listings" onClick={() => showReviewNotice("Choose a pencil icon to edit a listing.")}><Eye size={15} /> Review Listings</button></div>
      {products.length ? <section className="admin-product-grid" aria-label="Marketplace listings">
        {products.map((product) => <article className="admin-product-card" key={`${product.sellerEmail || product.seller}-${product.id}`}>
          <div className="admin-product-art" style={{ background: product.bg }}><span aria-hidden="true">{product.icon || "📦"}</span></div>
          <div className="admin-product-info"><h2>{product.name}</h2><strong>{formatPrice(product.price)}</strong><p>Seller: {product.seller} · {Number(product.stock || 0)} in stock</p></div>
          <div className="admin-product-footer"><Status>Active</Status><div className="admin-product-actions"><button aria-label={`View ${product.name}`} title="View listing" onClick={() => setSelectedProduct(product)}><Eye size={15} /></button><button aria-label={`Edit ${product.name}`} title="Edit listing" onClick={() => openEditor(product)}><Pencil size={15} /></button></div></div>
        </article>)}
      </section> : <EmptyState icon={Store} title="No marketplace listings" description="Seller products will appear here once they are created." />}
      {reviewNotice && <div className="admin-toast" role="status">{reviewNotice}</div>}
      {selectedProduct && <div className="admin-dialog-backdrop" role="presentation" onMouseDown={() => setSelectedProduct(null)}>
        <section className="admin-user-dialog admin-product-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-product-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="admin-dialog-heading"><div><h2 id="admin-product-dialog-title">Listing details</h2><p>Review the product information currently available to buyers.</p></div><button className="admin-dialog-close" aria-label="Close" onClick={() => setSelectedProduct(null)}>×</button></div>
          <div className="admin-product-details"><div className="admin-product-art" style={{ background: selectedProduct.bg }}><span aria-hidden="true">{selectedProduct.icon || "📦"}</span></div><div><h3>{selectedProduct.name}</h3><strong>{formatPrice(selectedProduct.price)}</strong><p>Seller: {selectedProduct.seller}</p><p>Category: {selectedProduct.category || "Uncategorised"}</p><p>Available stock: {Number(selectedProduct.stock || 0)}</p><Status>Active</Status></div></div>
        </section>
      </div>}
      {editingProduct && <div className="admin-dialog-backdrop" role="presentation" onMouseDown={() => setEditingProduct(null)}>
        <section className="admin-user-dialog admin-product-dialog admin-product-editor" role="dialog" aria-modal="true" aria-labelledby="admin-product-edit-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="admin-dialog-heading"><div><h2 id="admin-product-edit-title">Edit listing</h2><p>Changes are saved directly to this seller's marketplace listing.</p></div><button className="admin-dialog-close" aria-label="Close" onClick={() => setEditingProduct(null)}>×</button></div>
          <div className="admin-product-editor-context"><div className="admin-product-art" style={{ background: editingProduct.bg }}><span aria-hidden="true">{editingProduct.icon || "📦"}</span></div><div><strong>{editingProduct.name}</strong><small>{editingProduct.seller}</small></div></div>
          <form className="admin-user-form admin-product-form" onSubmit={saveProduct}>
            <label>Product name<input name="name" value={draft.name} onChange={updateDraft} required /></label>
            <label>Category<select name="category" value={draft.category} onChange={updateDraft}><option>Electronics</option><option>Fashion</option><option>Home & Living</option><option>Beauty & Health</option><option>Sports & Outdoors</option><option>Toys & Games</option><option>Groceries</option></select></label>
            <label>Price<input name="price" type="number" min="0" step="1" value={draft.price} onChange={updateDraft} required /></label>
            <label>Stock<input name="stock" type="number" min="0" step="1" value={draft.stock} onChange={updateDraft} required /></label>
            {formError && <p className="admin-form-error" role="alert">{formError}</p>}
            <div className="admin-dialog-actions"><button type="button" onClick={() => setEditingProduct(null)}>Cancel</button><button className="primary" type="submit">Save changes</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}

function AnalyticsPage({ analytics, reports, onUpdateReport }) {
  const largestMonth = Math.max(...analytics.monthlyOrders.map((month) => month.value), 1);
  return (
    <div className="admin-page admin-analytics-page">
      <section className="admin-welcome admin-analytics-welcome"><div><h1>Reports & Analytics</h1><p>Marketplace performance calculated from the current saved data.</p></div><span aria-hidden="true">V</span></section>
      <section className="admin-stat-grid" aria-label="Marketplace performance">
        <StatCard label="Gross Sales" value={`₱${analytics.grossSales.toLocaleString()}`} detail="Non-cancelled orders" />
        <StatCard label="Orders" value={analytics.orderCount.toLocaleString()} detail="Marketplace orders" />
        <StatCard label="Conversion" value={`${analytics.conversion.toFixed(1)}%`} detail="Orders per registered buyer" />
        <StatCard label="Support Tickets" value={analytics.supportTickets.toLocaleString()} detail="Open customer reports" attention={analytics.supportTickets > 0} />
      </section>
      <section className="admin-monthly-volume table-card" aria-labelledby="monthly-volume-title">
        <div className="admin-card-heading"><div><h2 id="monthly-volume-title">Monthly Order Volume</h2><p>{new Date().getFullYear()} marketplace order count</p></div><strong>{analytics.orderCount} total</strong></div>
        <div className="admin-volume-chart" role="img" aria-label={`Monthly order volume for ${new Date().getFullYear()}`}>
          {analytics.monthlyOrders.map((month) => <div className="admin-volume-month" key={month.label} title={`${month.label}: ${month.value} orders`}><div className="admin-volume-track"><div className="admin-volume-bar" style={{ height: `${Math.max(month.value ? (month.value / largestMonth) * 100 : 2, 2)}%` }} /></div><span>{month.label}</span><small>{month.value}</small></div>)}
        </div>
      </section>
      <section className="admin-report-queue table-card">
        <div className="admin-card-heading"><div><h2>Support Tickets</h2><p>Customer reports that may require marketplace action.</p></div></div>
        {reports.length ? <table><thead><tr><th>Seller</th><th>Product</th><th>Reason</th><th>Status</th><th>Decision</th></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td>{report.seller}</td><td>{report.product}</td><td>{report.reason}</td><td><Status>{report.status}</Status></td><td><button className="text-btn" onClick={() => onUpdateReport(report, "Approved")}>Approve & Restrict</button><button className="text-btn" onClick={() => onUpdateReport(report, "Rejected")}>Reject</button></td></tr>)}</tbody></table> : <EmptyState icon={ShieldCheck} title="No support tickets" description="New customer reports will appear here." />}
      </section>
    </div>
  );
}

function SystemSecurityPage({ orders, reports }) {
  const localSession = Boolean(localStorage.getItem("vendora-user"));
  const sessionSession = Boolean(sessionStorage.getItem("vendora-user"));
  const savedActivity = orders.length + reports.length;
  const controls = [
    [ShieldCheck, "Role-based access", "Admin and staff use the same marketplace management workspace.", "Enabled"],
    [Users, "Session protection", localSession ? "This administrator session is remembered on this device." : sessionSession ? "This administrator session is limited to the current browser session." : "No administrator session is currently stored.", localSession || sessionSession ? "Active" : "Inactive"],
    [ClipboardList, "Audit activity", savedActivity ? `${savedActivity} saved marketplace records are available for review.` : "Marketplace activity will be available once orders or reports are saved.", savedActivity ? "Available" : "Waiting"],
  ];
  return (
    <div className="admin-page admin-security-page">
      <div className="page-title"><div><h1>System & Security</h1><p>Administrator-only controls for this prototype.</p></div></div>
      <div className="admin-security-layout">
        <section className="admin-security-controls table-card" aria-label="Security controls">
          {controls.map(([Icon, title, description, status]) => <article className="admin-security-row" key={title}><div className="admin-security-icon"><Icon size={18} /></div><div><h2>{title}</h2><p>{description}</p></div><span className={`admin-security-status ${status.toLowerCase()}`}>{status}</span></article>)}
        </section>
        <aside className="admin-access-policy table-card"><ShieldCheck size={25} /><h2>Access policy</h2><p>Administrators and staff share access to marketplace management controls.</p><div><strong>Administrator</strong><span>Full marketplace oversight</span></div><div><strong>Staff</strong><span>Full marketplace oversight</span></div><div><strong>Buyer & Seller</strong><span>No marketplace management access</span></div></aside>
      </div>
    </div>
  );
}

function SettingsPage({ user, onSaveSettings }) {
  const workspaceLabel = user?.role === "staff" ? "Staff" : "Administrator";
  const [savedSettings, setSavedSettings] = useState(() => getAdminSettings());
  const [draft, setDraft] = useState(() => getAdminSettings());
  const [feedback, setFeedback] = useState("");
  const updateDraft = (event) => setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
  const saveSettings = (event) => {
    event.preventDefault();
    const result = onSaveSettings(draft);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    setSavedSettings(result.settings);
    setDraft(result.settings);
    setFeedback("Administrator settings saved.");
  };
  return (
    <div className="admin-page admin-settings-page">
      <div className="page-title"><div><h1>{workspaceLabel} Settings</h1><p>Configure platform-level marketplace settings.</p></div></div>
      <form className="admin-settings-card" onSubmit={saveSettings}>
        <div className="admin-settings-profile"><div className="admin-settings-avatar">{initials(user?.name)}</div><div><strong>{user?.name}</strong><span>{user?.email}</span><small>{workspaceLabel}</small></div></div>
        <div className="admin-settings-fields">
          <label>Platform name<input name="platformName" value={draft.platformName} onChange={updateDraft} required /></label>
          <label>Support email<input name="supportEmail" type="email" value={draft.supportEmail} onChange={updateDraft} required /></label>
          <label className="admin-settings-notice">Marketplace notice<textarea name="marketplaceNotice" value={draft.marketplaceNotice} onChange={updateDraft} required /></label>
        </div>
        {feedback && <p className={`admin-settings-feedback ${feedback.includes("saved") ? "success" : "error"}`} role="status">{feedback}</p>}
        <div className="admin-settings-actions"><button type="button" onClick={() => { setDraft(savedSettings); setFeedback(""); }}>Cancel</button><button className="primary" type="submit">Save Changes</button></div>
      </form>
    </div>
  );
}

export default function AdminModeration({ page, go, user }) {
  const [reports, setReports] = useState(() => getReports());
  const [notice, setNotice] = useState("");
  const [, setRefreshKey] = useState(0);
  const sellers = getSellers();
  const adminProducts = getAdminProducts();
  const users = getAdminUsers();
  const orders = getAdminOrders();
  const stats = getAdminStats(reports);
  const analytics = getAdminAnalytics(reports);

  const refreshAdminData = () => setRefreshKey((key) => key + 1);
  const updateReportStatus = (report, status) => {
    const nextReports = reports.map((item) => item.id === report.id ? { ...item, status } : item);
    setReports(nextReports);
    saveReports(nextReports);
    if (status === "Approved" && report.sellerEmail) banSeller(report.sellerEmail);
    setNotice(`${status}: ${report.seller}`);
    refreshAdminData();
  };
  const handleUserRestriction = (user) => {
    setUserRestriction(user.email, !user.restricted);
    setNotice(user.restricted ? `Restored: ${user.name}` : `Restricted: ${user.name}`);
    refreshAdminData();
  };
  const handleSaveUser = (user) => {
    const result = saveAdminUser(user);
    if (!result.error) {
      setNotice(user.existingEmail ? `Updated: ${user.name}` : `Added: ${user.name}`);
      refreshAdminData();
    }
    return result;
  };
  const handleSaveProduct = (product, changes) => {
    const result = updateSellerProduct({ sellerEmail: product.sellerEmail, productId: product.id, changes });
    if (!result.error) refreshAdminData();
    return result;
  };
  const handleSaveSettings = (settings) => saveAdminSettings(settings);

  if (page === "admin-dashboard") return <Dashboard stats={stats} reports={reports} sellers={sellers} orders={orders} go={go} user={user} />;
  if (page === "users") return <UsersPage users={users} onSaveUser={handleSaveUser} onToggleRestriction={handleUserRestriction} />;
  if (page === "orders") return <OrdersPage orders={orders} />;
  if (page === "shops-products") return <ProductsPage products={adminProducts} onSaveProduct={handleSaveProduct} />;
  if (page === "reports-analytics") return <><AnalyticsPage analytics={analytics} reports={reports} onUpdateReport={updateReportStatus} />{notice && <div className="admin-analytics-notice form-card admin-notice">{notice}</div>}</>;
  if (page === "system-security") return <SystemSecurityPage orders={orders} reports={reports} />;
  if (page === "settings") return <SettingsPage user={user} onSaveSettings={handleSaveSettings} />;
  return <div className="admin-page"><div className="page-title"><div><h1>{page === "system-security" ? "System & Security" : "Settings"}</h1><p>This administrator workspace is ready for its backend configuration.</p></div></div><EmptyState icon={ShieldCheck} title="No configuration available" description="Connect the backend to manage this area." /></div>;
}
