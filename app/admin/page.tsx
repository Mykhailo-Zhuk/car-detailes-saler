"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Part, Category, Order, Schema } from "@/lib/types";
import { LogIn, Plus, X, Pencil, Trash2, ImageIcon, Download } from "lucide-react";

type Tab = "parts" | "categories" | "analogs" | "schemas" | "orders";

const INPUT = "w-full px-3 py-2.5 rounded-lg text-sm outline-none";
const INPUT_STYLE = { background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" };
const BTN_PRIMARY = { background: "var(--primary)", color: "#fff" };
const BTN_GHOST = { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" };

export default function AdminPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<Tab>("parts");

  const [parts, setParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analogs, setAnalogs] = useState<any[]>([]);
  const [schemas, setSchemas] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);

  const [partModal, setPartModal] = useState<Partial<Part> | null>(null);
  const [catModal, setCatModal] = useState<Partial<Category> | null>(null);
  const [analogModal, setAnalogModal] = useState(false);
  const [schemaModal, setSchemaModal] = useState(false);
  const [viewSchema, setViewSchema] = useState<Schema | null>(null);

  const emptyPart = { code: "", name: "", description: "", category_id: "", car_id: "", price: 0, stock: 0, delivery_days: 0, image_url: "" };
  const emptyCat = { name: "", description: "", parent_id: "" };
  const emptyAnalog = { part_id: "", analog_part_id: "", type: "direct", note: "" };
  const emptySchema = { part_id: "", title: "", image_url: "" };

  const [np, setNp] = useState(emptyPart);
  const [nc, setNc] = useState(emptyCat);
  const [na, setNa] = useState(emptyAnalog);
  const [ns, setNs] = useState(emptySchema);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setIsAuth(true); loadData(); }
    });
  }, []);

  async function loadData() {
    const [p, c, o, an, sc, ca] = await Promise.all([
      supabase.from("parts").select("*,categories(name)").order("created_at", { ascending: false }).limit(100),
      supabase.from("categories").select("*").order("name"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("analogs").select("*, part:parts!part_id(name,code), analog_part:parts!analog_part_id(name,code)").limit(100),
      supabase.from("schemas").select("*,parts(name)").order("created_at", { ascending: false }).limit(100),
      supabase.from("cars").select("id,brand,model,year").order("brand").limit(200),
    ]);
    if (p.data) setParts(p.data as Part[]);
    if (c.data) setCategories(c.data as Category[]);
    if (o.data) setOrders(o.data as Order[]);
    if (an.data) setAnalogs(an.data);
    if (sc.data) setSchemas(sc.data);
    if (ca.data) setCars(ca.data);
  }

  async function savePart(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      code: np.code, name: np.name, description: np.description,
      category_id: np.category_id || null, car_id: np.car_id || null,
      price: np.price, stock: np.stock,
      delivery_days: np.delivery_days || null, image_url: np.image_url || null,
    };
    if (partModal?.id) await supabase.from("parts").update(payload).eq("id", partModal.id);
    else await supabase.from("parts").insert(payload);
    setPartModal(null); setNp(emptyPart); loadData();
  }

  async function deletePart(id: string) {
    if (!confirm("Видалити запчастину?")) return;
    await supabase.from("parts").delete().eq("id", id); loadData();
  }

  async function saveCat(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name: nc.name, description: nc.description, parent_id: nc.parent_id || null };
    if (catModal?.id) await supabase.from("categories").update(payload).eq("id", catModal.id);
    else await supabase.from("categories").insert(payload);
    setCatModal(null); setNc(emptyCat); loadData();
  }

  async function deleteCat(id: string) {
    if (!confirm("Видалити категорію?")) return;
    await supabase.from("categories").delete().eq("id", id); loadData();
  }

  async function saveAnalog(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("analogs").insert({ part_id: na.part_id, analog_part_id: na.analog_part_id, type: na.type, note: na.note });
    setAnalogModal(false); setNa(emptyAnalog); loadData();
  }

  async function deleteAnalog(id: string) {
    if (!confirm("Видалити аналог?")) return;
    await supabase.from("analogs").delete().eq("id", id); loadData();
  }

  async function saveSchema(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("schemas").insert({ part_id: ns.part_id || null, title: ns.title, image_url: ns.image_url });
    setSchemaModal(false); setNs(emptySchema); loadData();
  }

  async function deleteSchema(id: string) {
    if (!confirm("Видалити схему?")) return;
    await supabase.from("schemas").delete().eq("id", id); loadData();
  }

  async function updateOrder(id: string, status: string) {
    await supabase.from("orders").update({ status }).eq("id", id); loadData();
  }

  function openEditPart(p: Part) {
    setNp({ code: p.code, name: p.name, description: p.description || "", category_id: p.category_id || "", car_id: p.car_id || "", price: p.price, stock: p.stock, delivery_days: (p.delivery_days as any) || 0, image_url: p.image_url || "" });
    setPartModal(p);
  }

  function openEditCat(c: Category) {
    setNc({ name: c.name, description: c.description || "", parent_id: c.parent_id || "" });
    setCatModal(c);
  }

  if (!isAuth) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm p-6 rounded-2xl" style={{ background: "var(--bg-card)" }}>
        <h1 className="text-xl font-bold mb-4">Адмін-панель</h1>
        {authError && <p className="text-sm mb-3" style={{ color: "var(--error)" }}>{authError}</p>}
        <form onSubmit={async e => { e.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setAuthError(error.message); else { setIsAuth(true); loadData(); } }} className="space-y-3">
          <input value={email} onChange={e => setEmail(e.target.value)} className={INPUT} style={INPUT_STYLE} placeholder="Email" type="email" required />
          <input value={password} onChange={e => setPassword(e.target.value)} className={INPUT} style={INPUT_STYLE} placeholder="Пароль" type="password" required />
          <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={BTN_PRIMARY}><LogIn className="w-4 h-4" /> Увійти</button>
        </form>
      </div>
    </div>
  );

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "parts", label: "Запчастини", count: parts.length },
    { key: "categories", label: "Категорії", count: categories.length },
    { key: "analogs", label: "Аналоги", count: analogs.length },
    { key: "schemas", label: "Схеми", count: schemas.length },
    { key: "orders", label: "Замовлення", count: orders.length },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-50 px-4 py-3" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <h1 className="font-semibold">Адмін-панель</h1>
          <a href="/" className="text-xs px-3 py-1.5 rounded-lg" style={BTN_GHOST}>← Чат</a>
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-0.5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
              style={{ background: tab === t.key ? "var(--primary)" : "var(--bg)", color: tab === t.key ? "#fff" : "var(--text)" }}>
              {t.label}
              <span className="opacity-60 text-[10px]">({t.count})</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">

        {/* PARTS */}
        {tab === "parts" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Запчастини ({parts.length})</h2>
              <button onClick={() => { setNp(emptyPart); setPartModal({}); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={BTN_PRIMARY}><Plus className="w-3 h-3" /> Додати</button>
            </div>
            {parts.map(p => (
              <div key={p.id} className="p-3 rounded-xl text-sm flex items-start justify-between gap-2" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Код: {p.code} · {p.price}₴ · {p.stock} шт
                    {p.delivery_days ? ` · ${p.delivery_days} дн.` : ""}
                  </p>
                  {(p as any).categories?.name && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{(p as any).categories.name}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditPart(p)} className="p-1.5 rounded" style={{ background: "var(--bg)" }}><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deletePart(p.id)} className="p-1.5 rounded" style={{ background: "var(--bg)", color: "var(--error)" }}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CATEGORIES */}
        {tab === "categories" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Категорії ({categories.length})</h2>
              <button onClick={() => { setNc(emptyCat); setCatModal({}); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={BTN_PRIMARY}><Plus className="w-3 h-3" /> Додати</button>
            </div>
            {categories.map(c => (
              <div key={c.id} className="p-3 rounded-xl text-sm flex items-center justify-between" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div>
                  <p className="font-medium">{c.name}</p>
                  {c.description && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{c.description}</p>}
                  {c.parent_id && <p className="text-xs" style={{ color: "var(--text-muted)" }}>↳ {categories.find(x => x.id === c.parent_id)?.name || "підкатегорія"}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditCat(c)} className="p-1.5 rounded" style={{ background: "var(--bg)" }}><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteCat(c.id)} className="p-1.5 rounded" style={{ background: "var(--bg)", color: "var(--error)" }}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ANALOGS */}
        {tab === "analogs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Аналоги ({analogs.length})</h2>
              <button onClick={() => setAnalogModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={BTN_PRIMARY}><Plus className="w-3 h-3" /> Додати</button>
            </div>
            {analogs.length === 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Аналогів ще немає</p>}
            {analogs.map((a: any) => (
              <div key={a.id} className="p-3 rounded-xl text-xs flex items-center justify-between gap-2" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium">{a.part?.name}</span>
                    <span style={{ color: "var(--text-muted)" }}>({a.part?.code})</span>
                    <span style={{ color: "var(--text-muted)" }}>→</span>
                    <span className="font-medium">{a.analog_part?.name}</span>
                    <span style={{ color: "var(--text-muted)" }}>({a.analog_part?.code})</span>
                  </div>
                  <div className="flex gap-2 mt-0.5" style={{ color: "var(--text-muted)" }}>
                    <span>{a.type}</span>
                    {a.note && <span>· {a.note}</span>}
                  </div>
                </div>
                <button onClick={() => deleteAnalog(a.id)} className="p-1.5 rounded shrink-0" style={{ background: "var(--bg)", color: "var(--error)" }}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}

        {/* SCHEMAS */}
        {tab === "schemas" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Схеми ({schemas.length})</h2>
              <button onClick={() => setSchemaModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={BTN_PRIMARY}><Plus className="w-3 h-3" /> Додати</button>
            </div>
            {schemas.length === 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Схем ще немає</p>}
            <div className="grid grid-cols-2 gap-3">
              {schemas.map((s: any) => (
                <div key={s.id} className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <div className="relative bg-white" style={{ paddingTop: "56%" }}>
                    <img src={s.image_url} alt={s.title} className="absolute inset-0 w-full h-full object-contain p-2" />
                  </div>
                  <div className="p-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{s.title}</p>
                      {s.parts?.name && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{s.parts.name}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setViewSchema(s)} className="p-1.5 rounded" style={{ background: "var(--bg)" }}><ImageIcon className="w-3 h-3" /></button>
                      <a href={s.image_url} download target="_blank" rel="noopener noreferrer" className="p-1.5 rounded" style={{ background: "var(--bg)" }}><Download className="w-3 h-3" /></a>
                      <button onClick={() => deleteSchema(s.id)} className="p-1.5 rounded" style={{ background: "var(--bg)", color: "var(--error)" }}><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Замовлення ({orders.length})</h2>
            {orders.map(o => (
              <div key={o.id} className="p-4 rounded-xl text-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium">{o.customer_name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {o.customer_phone}{o.customer_email ? ` · ${o.customer_email}` : ""}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(o.created_at).toLocaleString("uk-UA")}
                    </p>
                  </div>
                  <select value={o.status} onChange={e => updateOrder(o.id, e.target.value)} className="px-2 py-1 rounded text-xs outline-none shrink-0" style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}>
                    <option value="new">Нове</option>
                    <option value="processing">В роботі</option>
                    <option value="completed">Виконано</option>
                    <option value="cancelled">Скасовано</option>
                  </select>
                </div>
                {Array.isArray(o.items) && o.items.length > 0 && (
                  <div className="space-y-1 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                    {o.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                        <span>{item.part_name} <span style={{ opacity: 0.6 }}>({item.part_code})</span></span>
                        <span>{item.quantity} × {item.price}₴</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="font-semibold mt-2" style={{ color: "var(--success)" }}>Разом: {o.total}₴</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Part Modal */}
      {partModal !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{partModal.id ? "Редагувати запчастину" : "Нова запчастина"}</h2>
              <button onClick={() => setPartModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={savePart} className="space-y-3">
              <input value={np.code} onChange={e => setNp({ ...np, code: e.target.value })} className={INPUT} style={INPUT_STYLE} placeholder="Код" required />
              <input value={np.name} onChange={e => setNp({ ...np, name: e.target.value })} className={INPUT} style={INPUT_STYLE} placeholder="Назва" required />
              <textarea value={np.description} onChange={e => setNp({ ...np, description: e.target.value })} className={INPUT + " resize-none"} style={INPUT_STYLE} placeholder="Опис" rows={2} />
              <select value={np.category_id} onChange={e => setNp({ ...np, category_id: e.target.value })} className={INPUT} style={INPUT_STYLE}>
                <option value="">— Категорія —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={np.car_id} onChange={e => setNp({ ...np, car_id: e.target.value })} className={INPUT} style={INPUT_STYLE}>
                <option value="">— Автомобіль (опц.) —</option>
                {cars.map(c => <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.year})</option>)}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Ціна (₴)</label>
                  <input type="number" value={np.price} onChange={e => setNp({ ...np, price: parseInt(e.target.value) || 0 })} className={INPUT} style={INPUT_STYLE} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Наявність</label>
                  <input type="number" value={np.stock} onChange={e => setNp({ ...np, stock: parseInt(e.target.value) || 0 })} className={INPUT} style={INPUT_STYLE} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Доставка (дн.)</label>
                  <input type="number" value={np.delivery_days} onChange={e => setNp({ ...np, delivery_days: parseInt(e.target.value) || 0 })} className={INPUT} style={INPUT_STYLE} />
                </div>
              </div>
              <input value={np.image_url} onChange={e => setNp({ ...np, image_url: e.target.value })} className={INPUT} style={INPUT_STYLE} placeholder="URL зображення (опц.)" />
              <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={BTN_PRIMARY}>{partModal.id ? "Зберегти" : "Створити"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModal !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{catModal.id ? "Редагувати категорію" : "Нова категорія"}</h2>
              <button onClick={() => setCatModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveCat} className="space-y-3">
              <input value={nc.name} onChange={e => setNc({ ...nc, name: e.target.value })} className={INPUT} style={INPUT_STYLE} placeholder="Назва" required />
              <textarea value={nc.description} onChange={e => setNc({ ...nc, description: e.target.value })} className={INPUT + " resize-none"} style={INPUT_STYLE} placeholder="Опис" rows={2} />
              <select value={nc.parent_id} onChange={e => setNc({ ...nc, parent_id: e.target.value })} className={INPUT} style={INPUT_STYLE}>
                <option value="">— Батьківська категорія (опц.) —</option>
                {categories.filter(c => c.id !== catModal.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={BTN_PRIMARY}>{catModal.id ? "Зберегти" : "Створити"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Analog Modal */}
      {analogModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Новий аналог</h2>
              <button onClick={() => setAnalogModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveAnalog} className="space-y-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Оригінальна деталь</label>
                <select value={na.part_id} onChange={e => setNa({ ...na, part_id: e.target.value })} required className={INPUT} style={INPUT_STYLE}>
                  <option value="">— Оберіть деталь —</option>
                  {parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Аналог</label>
                <select value={na.analog_part_id} onChange={e => setNa({ ...na, analog_part_id: e.target.value })} required className={INPUT} style={INPUT_STYLE}>
                  <option value="">— Оберіть аналог —</option>
                  {parts.filter(p => p.id !== na.part_id).map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <select value={na.type} onChange={e => setNa({ ...na, type: e.target.value })} className={INPUT} style={INPUT_STYLE}>
                <option value="direct">Прямий аналог</option>
                <option value="compatible">Сумісний</option>
                <option value="oem">OEM</option>
              </select>
              <input value={na.note} onChange={e => setNa({ ...na, note: e.target.value })} className={INPUT} style={INPUT_STYLE} placeholder="Примітка (опц.)" />
              <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={BTN_PRIMARY}>Створити</button>
            </form>
          </div>
        </div>
      )}

      {/* Schema Create Modal */}
      {schemaModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Нова схема</h2>
              <button onClick={() => setSchemaModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveSchema} className="space-y-3">
              <input value={ns.title} onChange={e => setNs({ ...ns, title: e.target.value })} className={INPUT} style={INPUT_STYLE} placeholder="Назва схеми" required />
              <input value={ns.image_url} onChange={e => setNs({ ...ns, image_url: e.target.value })} className={INPUT} style={INPUT_STYLE} placeholder="URL зображення (.png)" required />
              <select value={ns.part_id} onChange={e => setNs({ ...ns, part_id: e.target.value })} className={INPUT} style={INPUT_STYLE}>
                <option value="">— Прив'язати до деталі (опц.) —</option>
                {parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </select>
              {ns.image_url && (
                <div className="rounded-lg overflow-hidden bg-white">
                  <img src={ns.image_url} alt="Preview" className="w-full h-32 object-contain p-2" />
                </div>
              )}
              <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={BTN_PRIMARY}>Додати схему</button>
            </form>
          </div>
        </div>
      )}

      {/* Schema Viewer */}
      {viewSchema && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={() => setViewSchema(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">{viewSchema.title}</h3>
              <div className="flex gap-2">
                <a href={viewSchema.image_url} download target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg" style={{ background: "var(--bg-card)" }}><Download className="w-4 h-4" /></a>
                <button onClick={() => setViewSchema(null)} className="p-2 rounded-lg" style={{ background: "var(--bg-card)" }}><X className="w-4 h-4" /></button>
              </div>
            </div>
            <img src={viewSchema.image_url} alt={viewSchema.title} className="w-full rounded-xl" style={{ maxHeight: "70vh", objectFit: "contain", background: "#fff" }} />
          </div>
        </div>
      )}
    </div>
  );
}
