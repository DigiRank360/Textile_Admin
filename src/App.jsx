import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, imgUrl, getToken, setToken, clearToken } from "./api";
import loginBg from "./assets/login-bg.jpg";
import "./App.css";

function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  return [toast, show];
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-bg" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PageHead({ title, subtitle, action, onAction }) {
  return (
    <div className="page-head">
      <div><h2>{title}</h2><p className="muted">{subtitle}</p></div>
      {action && <button className="btn primary" onClick={onAction}>+ {action}</button>}
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div className="empty-state">
      <div className="empty-ico"><svg viewBox="0 0 24 24">{ICONS[icon]}</svg></div>
      <p>{text}</p>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="search">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ImagePicker({ existing, setExisting, files, setFiles, multiple }) {
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const onPick = (e) => {
    const picked = Array.from(e.target.files);
    setFiles(multiple ? [...files, ...picked] : picked.slice(0, 1));
    if (!multiple) setExisting([]);
    e.target.value = "";
  };

  return (
    <div className="thumbs">
      {existing.map((src) => (
        <div className="thumb" key={src}>
          <img src={imgUrl(src)} alt="" />
          <button type="button" onClick={() => setExisting(existing.filter((s) => s !== src))}>✕</button>
        </div>
      ))}
      {previews.map((src, i) => (
        <div className="thumb" key={src}>
          <img src={src} alt="" />
          <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <label className="thumb add">
        + Add
        <input type="file" accept="image/*" multiple={multiple} hidden onChange={onPick} />
      </label>
    </div>
  );
}

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const data = await api("/auth/login", { method: "POST", body: form });
      setToken(data.token);
      onLogin();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-art" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="login-art-inner">
          <span className="login-tag">Hummo Textile</span>
          <h1>Weaving quality,<br />managing it beautifully.</h1>
          <p>Manage your products, categories and homepage banners from one place.</p>
          <ul>
            <li>✓ Products &amp; collections</li>
            <li>✓ Homepage banner slider</li>
            <li>✓ Secure admin access</li>
          </ul>
        </div>
      </div>
      <div className="login-panel">
        <form className="login-form" onSubmit={submit}>
          <div className="login-logo">H</div>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to your admin dashboard</p>

          <label className="field">
            <span>Username</span>
            <div className="field-box">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
              <input placeholder="Enter username" value={form.username} autoFocus autoComplete="username"
                onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="field-box">
              <svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
              <input type={show ? "text" : "password"} placeholder="Enter password" value={form.password} autoComplete="current-password"
                onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <button type="button" className="eye" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
            </div>
          </label>

          {err && <div className="error">{err}</div>}
          <button className="btn primary login-btn" disabled={busy}>{busy ? "Signing in..." : "Sign In →"}</button>
          <p className="login-foot muted">© {new Date().getFullYear()} Hummo Textile. All rights reserved.</p>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ data, go }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const cards = [
    ["Products", data.products.length, "Products", "c1"],
    ["Categories", data.categories.length, "Categories", "c2"],
    ["Banners", data.banners.length, "Banners", "c3"],
    ["Featured", data.products.filter((p) => p.featured).length, "Products", "c4"],
  ];
  const recent = data.products.slice(0, 5);
  return (
    <>
      <div className="welcome">
        <div>
          <h2>{greet}, Admin 👋</h2>
          <p>Here is what is happening with your textile store today.</p>
        </div>
        <button className="btn light" onClick={() => go("Products")}>+ New Product</button>
      </div>
      <div className="cards">
        {cards.map(([label, n, icon, tone]) => (
          <div className={`stat ${tone}`} key={label}>
            <div className="stat-ico"><svg viewBox="0 0 24 24">{ICONS[icon]}</svg></div>
            <div><span>{n}</span>{label}</div>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <section className="panel">
          <h3>Recently added products</h3>
          {recent.map((p) => (
            <div className="recent" key={p._id}>
              {p.images?.[0] ? <img src={imgUrl(p.images[0])} alt="" /> : <div className="ph" />}
              <div><strong>{p.title}</strong><small>{p.category?.name || "Uncategorised"}</small></div>
              <b>₹{p.price}</b>
            </div>
          ))}
          {!recent.length && <Empty icon="Products" text="No products yet" />}
        </section>
        <section className="panel">
          <h3>Quick actions</h3>
          {[["Products", "Add a new product"], ["Categories", "Create a category"], ["Banners", "Upload a homepage banner"]].map(([t, l]) => (
            <button className="quick" key={t} onClick={() => go(t)}>
              <span className="quick-ico"><svg viewBox="0 0 24 24">{ICONS[t]}</svg></span>
              {l}<i>→</i>
            </button>
          ))}
        </section>
      </div>
    </>
  );
}

function Categories({ items, products, reload, notify }) {
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState("");
  const shown = items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const countOf = (c) => products.filter((p) => (p.category?._id || p.category) === c._id).length;

  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = { name: f.get("name"), description: f.get("description"), status: f.get("status") === "on" };
    try {
      if (edit._id) await api(`/categories/${edit._id}`, { method: "PUT", body });
      else await api("/categories", { method: "POST", body });
      notify("Category saved");
      setEdit(null);
      reload();
    } catch (e2) { notify(e2.message, "err"); }
  };

  const del = async (c) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try { await api(`/categories/${c._id}`, { method: "DELETE" }); notify("Deleted"); reload(); }
    catch (e) { notify(e.message, "err"); }
  };

  return (
    <>
      <PageHead title="Categories" subtitle="Organise your fabrics into collections" action="Add Category" onAction={() => setEdit({})} />
      <SearchBox value={q} onChange={setQ} placeholder="Search categories..." />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Description</th><th>Products</th><th>Status</th><th /></tr></thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c._id}>
                <td><strong>{c.name}</strong></td><td className="muted wrap">{c.description}</td><td><span className="pill gold">{countOf(c)}</span></td>
                <td><span className={`pill ${c.status !== false ? "on" : "off"}`}>{c.status !== false ? "Active" : "Inactive"}</span></td>
                <td className="actions"><button className="btn" onClick={() => setEdit(c)}>Edit</button><button className="btn danger" onClick={() => del(c)}>Delete</button></td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan="5"><Empty icon="Categories" text="No categories found" /></td></tr>}
          </tbody>
        </table>
      </div>
      {edit && (
        <Modal title={edit._id ? "Edit Category" : "Add Category"} onClose={() => setEdit(null)}>
          <form onSubmit={save} className="form">
            <label>Name<input name="name" defaultValue={edit.name} required /></label>
            <label>Description<textarea name="description" rows="3" defaultValue={edit.description} /></label>
            <label className="check"><input type="checkbox" name="status" defaultChecked={edit.status !== false} /> Active</label>
            <button className="btn primary">Save</button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Products({ items, categories, reload, notify }) {
  const [edit, setEdit] = useState(null);
  const [existing, setExisting] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const shown = items.filter((p) =>
    p.title.toLowerCase().includes(q.toLowerCase()) &&
    (!cat || (p.category?._id || p.category) === cat));

  const open = (p) => {
    setEdit(p);
    setExisting(p.images || []);
    setFiles([]);
  };

  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const fd = new FormData();
    ["title", "price", "description", "category", "status"].forEach((k) => fd.append(k, f.get(k) || ""));
    fd.append("featured", f.get("featured") === "on");
    fd.append("features", JSON.stringify(String(f.get("features") || "").split("\n").map((s) => s.trim()).filter(Boolean)));
    if (edit._id) fd.append("existingImages", JSON.stringify(existing));
    files.forEach((file) => fd.append("images", file));

    setBusy(true);
    try {
      await api(edit._id ? `/properties/${edit._id}` : "/properties", { method: edit._id ? "PUT" : "POST", body: fd });
      notify("Product saved");
      setEdit(null);
      reload();
    } catch (e2) { notify(e2.message, "err"); }
    finally { setBusy(false); }
  };

  const del = async (p) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    try { await api(`/properties/${p._id}`, { method: "DELETE" }); notify("Deleted"); reload(); }
    catch (e) { notify(e.message, "err"); }
  };

  return (
    <>
      <PageHead title="Products" subtitle="Manage your fabric catalogue" action="Add Product" onAction={() => open({})} />
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Search products..." />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th /><th>Title</th><th>Category</th><th>Price</th><th>Status</th><th /></tr></thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p._id}>
                <td>{p.images?.[0] && <img className="row-img" src={imgUrl(p.images[0])} alt="" />}</td>
                <td><strong>{p.title}</strong> {p.featured && <span className="pill gold">Featured</span>}</td>
                <td className="muted">{p.category?.name || "—"}</td>
                <td>₹{p.price}</td>
                <td><span className={`pill ${p.status === "Inactive" ? "off" : "on"}`}>{p.status || "Active"}</span></td>
                <td className="actions"><button className="btn" onClick={() => open(p)}>Edit</button><button className="btn danger" onClick={() => del(p)}>Delete</button></td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan="6"><Empty icon="Products" text="No products found" /></td></tr>}
          </tbody>
        </table>
      </div>
      {edit && (
        <Modal title={edit._id ? "Edit Product" : "Add Product"} onClose={() => setEdit(null)}>
          <form onSubmit={save} className="form">
            <label>Title<input name="title" defaultValue={edit.title} required /></label>
            <div className="two">
              <label>Price (₹)<input name="price" type="number" min="0" defaultValue={edit.price} required /></label>
              <label>Category
                <select name="category" defaultValue={edit.category?._id || edit.category || ""}>
                  <option value="">— None —</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </label>
            </div>
            <label>Description<textarea name="description" rows="3" defaultValue={edit.description} /></label>
            <label>Features (one per line)<textarea name="features" rows="3" defaultValue={(edit.features || []).join("\n")} /></label>
            <div className="two">
              <label>Status
                <select name="status" defaultValue={edit.status || "Active"}><option>Active</option><option>Inactive</option></select>
              </label>
              <label className="check"><input type="checkbox" name="featured" defaultChecked={!!edit.featured} /> Featured on home</label>
            </div>
            <div>Images<ImagePicker existing={existing} setExisting={setExisting} files={files} setFiles={setFiles} multiple /></div>
            <button className="btn primary" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Banners({ items, reload, notify }) {
  const [edit, setEdit] = useState(null);
  const [existing, setExisting] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const open = (b) => {
    setEdit(b);
    setExisting(b.image ? [b.image] : []);
    setFiles([]);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!existing.length && !files.length) return notify("Please add a banner image", "err");
    const f = new FormData(e.target);
    const fd = new FormData();
    ["title", "badge", "subtitle", "order"].forEach((k) => fd.append(k, f.get(k) || ""));
    fd.append("status", f.get("status") === "on");
    if (files[0]) fd.append("image", files[0]);

    setBusy(true);
    try {
      await api(edit._id ? `/banners/${edit._id}` : "/banners", { method: edit._id ? "PUT" : "POST", body: fd });
      notify("Banner saved");
      setEdit(null);
      reload();
    } catch (e2) { notify(e2.message, "err"); }
    finally { setBusy(false); }
  };

  const del = async (b) => {
    if (!confirm("Delete this banner?")) return;
    try { await api(`/banners/${b._id}`, { method: "DELETE" }); notify("Deleted"); reload(); }
    catch (e) { notify(e.message, "err"); }
  };

  return (
    <>
      <PageHead title="Banners" subtitle="Slides shown in the homepage hero slider" action="Add Banner" onAction={() => open({})} />
      <div className="banner-grid">
        {items.map((b) => (
          <div className="banner-card" key={b._id}>
            <div className="banner-img"><img src={imgUrl(b.image)} alt="" /><span className={`pill ${b.status ? "on" : "off"}`}>{b.status ? "Active" : "Hidden"}</span></div>
            <div className="banner-info">
              <strong>{b.title || "Untitled"}</strong>
              <span className="muted">{b.badge} · order {b.order}</span>
              <div className="actions"><button className="btn" onClick={() => open(b)}>Edit</button><button className="btn danger" onClick={() => del(b)}>Delete</button></div>
            </div>
          </div>
        ))}
        {!items.length && <Empty icon="Banners" text="No banners yet - add your first slide" />}
      </div>
      {edit && (
        <Modal title={edit._id ? "Edit Banner" : "Add Banner"} onClose={() => setEdit(null)}>
          <form onSubmit={save} className="form">
            <div>Banner image (wide, e.g. 1920×900)<ImagePicker existing={existing} setExisting={setExisting} files={files} setFiles={setFiles} /></div>
            <label>Badge<input name="badge" defaultValue={edit.badge} placeholder="Premium Fabrics" /></label>
            <label>Title<input name="title" defaultValue={edit.title} required /></label>
            <label>Subtitle<textarea name="subtitle" rows="2" defaultValue={edit.subtitle} /></label>
            <div className="two">
              <label>Order<input name="order" type="number" defaultValue={edit.order ?? 0} /></label>
              <label className="check"><input type="checkbox" name="status" defaultChecked={edit.status !== false} /> Active</label>
            </div>
            <button className="btn primary" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
          </form>
        </Modal>
      )}
    </>
  );
}

const ICONS = {
  Dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  Products: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
  Categories: <><path d="M3 12l9-9h8a1 1 0 011 1v8l-9 9-9-9z" /><circle cx="15.5" cy="8.5" r="1.3" /></>,
  Banners: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="1.8" /><path d="M21 16l-5-5-8 8" /></>,
  Logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
};
const Icon = ({ name }) => <svg className="nav-ico" viewBox="0 0 24 24">{ICONS[name]}</svg>;
const TABS = ["Dashboard", "Products", "Categories", "Banners"];

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [tab, setTab] = useState("Dashboard");
  const [data, setData] = useState({ products: [], categories: [], banners: [] });
  const [toast, notify] = useToast();
  const [menu, setMenu] = useState(false);
  const loaded = useRef(false);

  const reload = useCallback(async () => {
    try {
      const [p, c, b] = await Promise.all([
        api("/properties"),
        api("/categories"),
        api("/banners?all=true"),
      ]);
      setData({
        products: p.properties || [],
        categories: c.data || [],
        banners: b.banners || [],
      });
    } catch (e) { notify(e.message, "err"); }
  }, [notify]);

  useEffect(() => {
    const out = () => setAuthed(false);
    window.addEventListener("hummo-logout", out);
    return () => window.removeEventListener("hummo-logout", out);
  }, []);

  useEffect(() => {
    if (authed && !loaded.current) { loaded.current = true; reload(); }
    if (!authed) loaded.current = false;
  }, [authed, reload]);

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const logout = () => { clearToken(); setAuthed(false); };
  const props = { reload, notify };
  const counts = { Products: data.products.length, Categories: data.categories.length, Banners: data.banners.length };

  return (
    <div className="shell">
      <aside className={menu ? "side open" : "side"}>
        <div className="side-brand">
          <div className="side-logo">H</div>
          <div><strong>Hummo Textile</strong><small>Admin Panel</small></div>
        </div>
        <div className="side-label">Menu</div>
        {TABS.map((t) => (
          <button key={t} className={t === tab ? "nav active" : "nav"} onClick={() => { setTab(t); setMenu(false); }}>
            <Icon name={t} />
            <span>{t}</span>
            {counts[t] !== undefined && <em className="count">{counts[t]}</em>}
          </button>
        ))}
        <div className="side-user">
          <div className="avatar">A</div>
          <div><strong>Administrator</strong><small>Signed in</small></div>
        </div>
        <button className="nav logout" onClick={logout}><Icon name="Logout" /><span>Logout</span></button>
      </aside>
      <main>
        <button className="burger" onClick={() => setMenu(!menu)}>☰</button>
        {tab === "Dashboard" && <Dashboard data={data} go={setTab} />}
        {tab === "Products" && <Products items={data.products} categories={data.categories} {...props} />}
        {tab === "Categories" && <Categories items={data.categories} products={data.products} {...props} />}
        {tab === "Banners" && <Banners items={data.banners} {...props} />}
      </main>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
