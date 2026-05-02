"use client";
import { useState, useRef, useEffect } from "react";
import { ChatMessage, ChatContent, Part, Schema, ConversationContext } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { Send, Loader2, Car, ShoppingCart, X, Plus, Minus, Download, ImageIcon } from "lucide-react";

function safeUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? url : "";
  } catch { return ""; }
}

function escapeIlike(s: string): string {
  return s.replace(/[%_\\]/g, c => `\\${c}`);
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "welcome",
    role: "assistant",
    content: "Привіт! Я AI-помічник з підбору автозапчастин.\n\nЯ можу допомогти знайти потрібну деталь:\n• 🔍 За **VIN**-номером автомобіля\n• 🚗 За **маркою та моделлю** авто\n• 🔢 За **кодом** запчастини\n\nВідповідаю виключно на основі даних каталогу.",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState("");
  const [cart, setCart] = useState<{ part: Part; quantity: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [schemaView, setSchemaView] = useState<Schema | null>(null);
  const [context, setContext] = useState<ConversationContext>({});
  const [brands, setBrands] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSearchRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    supabase.from("cars").select("brand").then(({ data }) => {
      if (data) setBrands([...new Set(data.map((r: any) => r.brand.toLowerCase()))]);
    });
  }, []);

  const addMsg = (m: ChatMessage) => setMessages(p => [...p, m]);

  const fetchAnalogs = async (partId: string): Promise<Part[]> => {
    const { data } = await supabase
      .from("analogs")
      .select("analog_parts:parts!analog_part_id(*)")
      .eq("part_id", partId)
      .limit(5);
    return (data || []).map((r: any) => r.analog_parts).filter(Boolean);
  };

  const fetchSchemas = async (partId: string): Promise<Schema[]> => {
    const { data } = await supabase.from("schemas").select("*").eq("part_id", partId).limit(3);
    return data || [];
  };

  const search = async (text: string) => {
    const now = Date.now();
    if (now - lastSearchRef.current < 500) return;
    lastSearchRef.current = now;
    const lower = text.toLowerCase();

    // VIN — 17-char alphanumeric
    const vinMatch = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i);
    if (vinMatch) {
      setThinking("Шукаю авто за VIN...");
      const vin = vinMatch[0].toUpperCase();
      const { data: cars } = await supabase.from("cars").select("*").eq("vin", vin).limit(1);
      if (cars?.length) {
        const car = cars[0];
        setThinking("Переглядаю каталог запчастин...");
        const { data: parts } = await supabase
          .from("parts").select("*,categories(name)").eq("car_id", car.id).limit(20);
        setContext(prev => ({
          ...prev,
          carId: car.id,
          carLabel: `${car.brand} ${car.model} (${car.year})`,
          brand: car.brand.toLowerCase(),
          lastPartIds: parts?.map(p => p.id),
        }));
        addMsg({
          id: `r-${Date.now()}`, role: "assistant",
          content: { type: "part_list", data: { title: `🚗 ${car.brand} ${car.model} (${car.year})`, parts: parts || [] } },
          timestamp: new Date(),
        });
      } else {
        addMsg({
          id: `nf-${Date.now()}`, role: "assistant",
          content: `❌ Авто з VIN **${vin}** не знайдено в базі.\n\nСпробуйте пошук за маркою/моделлю або кодом запчастини.`,
          timestamp: new Date(),
        });
      }
      return;
    }

    // Comparison — detect "порівняти/порівняй" with parts in context
    if (lower.includes("порівня") || lower.includes("порівнян")) {
      if (context.lastPartIds?.length && context.lastPartIds.length >= 2) {
        setThinking("Формую таблицю порівняння...");
        const { data: parts } = await supabase
          .from("parts").select("*,categories(name),cars(brand,model,year)")
          .in("id", context.lastPartIds.slice(0, 4));
        if ((parts?.length ?? 0) >= 2) {
          addMsg({
            id: `cmp-${Date.now()}`, role: "assistant",
            content: { type: "comparison", data: { parts } },
            timestamp: new Date(),
          });
          return;
        }
      }
      addMsg({
        id: `cmp-nf-${Date.now()}`, role: "assistant",
        content: "Для порівняння спочатку знайдіть декілька запчастин (наприклад, за кодом або маркою авто).",
        timestamp: new Date(),
      });
      return;
    }

    // Part code — explicit keyword or long alphanumeric token
    const codeMatch = text.match(/\b([A-Z0-9]{5,20})\b/i);
    if (codeMatch && (lower.includes("код") || lower.includes("детал") || lower.includes("артикул") || codeMatch[0].length >= 7)) {
      const code = codeMatch[1].toUpperCase();
      setThinking("Шукаю запчастину за кодом...");
      const { data: parts } = await supabase
        .from("parts").select("*,categories(name),cars(brand,model,year)").ilike("code", `%${escapeIlike(code)}%`).limit(10);
      if (parts?.length) {
        setThinking("Шукаю аналоги та схеми...");
        const analogs = parts.length === 1 ? await fetchAnalogs(parts[0].id) : [];
        const schemas = parts.length === 1 ? await fetchSchemas(parts[0].id) : [];
        setContext(prev => ({ ...prev, lastPartIds: parts.map(p => p.id) }));
        addMsg({
          id: `r-${Date.now()}`, role: "assistant",
          content: { type: "part_list", data: { title: `🔢 За кодом: ${code}`, parts, analogs, schemas } },
          timestamp: new Date(),
        });
      } else {
        addMsg({
          id: `nf-${Date.now()}`, role: "assistant",
          content: `❌ Код **${code}** не знайдено в каталозі.\n\nСпробуйте VIN або марку/модель авто.`,
          timestamp: new Date(),
        });
      }
      return;
    }

    // Brand — from DB list with hardcoded fallback
    const brandList = brands.length
      ? brands
      : ["bmw", "audi", "mercedes", "volkswagen", "toyota", "honda", "nissan", "ford", "opel", "renault", "peugeot", "hyundai", "kia", "skoda", "mazda"];
    const brand = brandList.find(b => lower.includes(b));
    if (brand) {
      setThinking("Шукаю авто в каталозі...");
      const { data: cars } = await supabase.from("cars").select("*").ilike("brand", escapeIlike(brand)).limit(50);
      if (cars?.length) {
        const matchedCar = cars.find(c => lower.includes(c.model.toLowerCase()));
        if (matchedCar) {
          setThinking("Завантажую запчастини...");
          const { data: parts } = await supabase
            .from("parts").select("*,categories(name)").eq("car_id", matchedCar.id).limit(20);
          setContext(prev => ({
            ...prev,
            carId: matchedCar.id,
            carLabel: `${matchedCar.brand} ${matchedCar.model} (${matchedCar.year})`,
            brand,
          }));
          addMsg({
            id: `r-${Date.now()}`, role: "assistant",
            content: { type: "part_list", data: { title: `🚗 ${matchedCar.brand} ${matchedCar.model} (${matchedCar.year})`, parts: parts || [] } },
            timestamp: new Date(),
          });
        } else {
          const models = [...new Set(cars.map(c => c.model))].sort();
          setContext(prev => ({ ...prev, brand }));
          addMsg({
            id: `r-${Date.now()}`, role: "assistant",
            content: `🚗 **${brand.toUpperCase()}** — моделі в каталозі:\n${models.map(m => `• ${m}`).join("\n")}\n\nВкажіть модель для пошуку запчастин.`,
            timestamp: new Date(),
          });
        }
      } else {
        addMsg({
          id: `nf-${Date.now()}`, role: "assistant",
          content: `❌ Авто марки **${brand.toUpperCase()}** не знайдено в каталозі.\n\nСпробуйте інший спосіб пошуку або введіть VIN.`,
          timestamp: new Date(),
        });
      }
      return;
    }

    // Context follow-up: model search when brand is already known
    if (context.brand) {
      setThinking("Шукаю в поточному контексті...");
      const { data: cars } = await supabase
        .from("cars").select("*").ilike("brand", escapeIlike(context.brand)).ilike("model", `%${escapeIlike(text)}%`).limit(5);
      if (cars?.length) {
        const car = cars[0];
        const { data: parts } = await supabase
          .from("parts").select("*,categories(name)").eq("car_id", car.id).limit(20);
        setContext(prev => ({ ...prev, carId: car.id, carLabel: `${car.brand} ${car.model} (${car.year})` }));
        addMsg({
          id: `r-${Date.now()}`, role: "assistant",
          content: { type: "part_list", data: { title: `🚗 ${car.brand} ${car.model} (${car.year})`, parts: parts || [] } },
          timestamp: new Date(),
        });
        return;
      }
    }

    // Context follow-up: part name search within current car
    if (context.carId) {
      setThinking("Шукаю деталі для вашого авто...");
      const { data: parts } = await supabase
        .from("parts").select("*,categories(name)")
        .eq("car_id", context.carId).ilike("name", `%${escapeIlike(text)}%`).limit(10);
      if (parts?.length) {
        setContext(prev => ({ ...prev, lastPartIds: parts.map(p => p.id) }));
        addMsg({
          id: `r-${Date.now()}`, role: "assistant",
          content: { type: "part_list", data: { title: `🔍 "${text}" для ${context.carLabel}`, parts } },
          timestamp: new Date(),
        });
        return;
      }
    }

    // Category listing
    if (lower.includes("категор") || lower.includes("розділ") || lower.includes("список")) {
      setThinking("Переглядаю категорії...");
      const { data: cats } = await supabase.from("categories").select("*").order("name").limit(30);
      if (cats?.length) {
        const root = cats.filter(c => !c.parent_id);
        addMsg({
          id: `r-${Date.now()}`, role: "assistant",
          content: `📂 **Категорії запчастин:**\n${root.map(c => `• ${c.name}`).join("\n")}`,
          timestamp: new Date(),
        });
        return;
      }
    }

    addMsg({
      id: `fb-${Date.now()}`, role: "assistant",
      content: `Не вдалося знайти відповідь за запитом "${text}".\n\nСпробуйте:\n• **VIN** номер автомобіля\n• **Марку та модель** авто (напр.: Toyota Camry)\n• **Код** запчастини`,
      timestamp: new Date(),
    });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    addMsg({ id: `u-${Date.now()}`, role: "user", content: text, timestamp: new Date() });
    setInput("");
    setLoading(true);
    setThinking("Аналізую запит...");
    await search(text);
    setThinking("");
    setLoading(false);
  };

  const addToCart = (part: Part) => {
    setCart(p => {
      const existing = p.find(i => i.part.id === part.id);
      return existing
        ? p.map(i => i.part.id === part.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...p, { part, quantity: 1 }];
    });
    addMsg({ id: `ct-${Date.now()}`, role: "assistant", content: `✅ **${part.name}** додано до кошика`, timestamp: new Date() });
  };

  const cartTotal = cart.reduce((s, i) => s + i.part.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <Car className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-sm block">Автозапчастини</span>
            {context.carLabel && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{context.carLabel}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <a href="/admin" className="p-2 rounded-lg text-xs" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>Адмін</a>
          <button onClick={() => setShowCart(true)} className="relative p-2 rounded-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center" style={{ background: "var(--primary)", color: "#fff" }}>{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-3xl mx-auto w-full pb-32">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl p-4 ${msg.role === "user" ? "rounded-br-lg" : "rounded-bl-lg"}`}
              style={{ background: msg.role === "user" ? "var(--primary)" : "var(--bg-card)", color: msg.role === "user" ? "#fff" : "var(--text)" }}
            >
              {typeof msg.content === "string"
                ? <div className="text-sm whitespace-pre-wrap leading-relaxed">{renderMarkdown(msg.content)}</div>
                : renderContent(msg.content, addToCart, setSchemaView)}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-lg p-4" style={{ background: "var(--bg-card)" }}>
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <Loader2 className="w-4 h-4 animate-spin" />{thinking}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: "linear-gradient(transparent, var(--bg) 20%)" }}>
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)" }}
            placeholder={context.carLabel ? `Пошук для ${context.carLabel}...` : "VIN, марка/модель, код деталі..."}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 rounded-xl flex items-center justify-center disabled:opacity-40"
            style={{ background: "var(--primary)" }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl max-h-[75vh] overflow-y-auto" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Кошик</h2>
              <button onClick={() => setShowCart(false)}><X className="w-5 h-5" /></button>
            </div>
            {cart.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Кошик порожній</p>
            ) : (
              <div className="space-y-3">
                {cart.map(ci => (
                  <div key={ci.part.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ci.part.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{ci.part.code}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setCart(p => p.map(i => i.part.id === ci.part.id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i).filter(i => i.quantity > 0))}
                        className="p-1 rounded" style={{ background: "var(--bg-card)" }}
                      ><Minus className="w-3 h-3" /></button>
                      <span className="text-sm w-6 text-center">{ci.quantity}</span>
                      <button
                        onClick={() => setCart(p => p.map(i => i.part.id === ci.part.id ? { ...i, quantity: i.quantity + 1 } : i))}
                        className="p-1 rounded" style={{ background: "var(--bg-card)" }}
                      ><Plus className="w-3 h-3" /></button>
                      <span className="text-sm font-medium w-16 text-right">{ci.part.price * ci.quantity}₴</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-lg font-semibold" style={{ background: "rgba(124,92,252,0.1)" }}>
                  <span>Разом</span><span>{cartTotal}₴</span>
                </div>
                <button
                  onClick={() => { setShowCart(false); setShowOrderForm(true); }}
                  className="w-full py-3 rounded-xl text-sm font-medium"
                  style={{ background: "var(--primary)", color: "#fff" }}
                >Оформити замовлення</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Form */}
      {showOrderForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Оформлення замовлення</h2>
              <button onClick={() => setShowOrderForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault();
              const f = e.target as HTMLFormElement;
              const d = new FormData(f);
              await supabase.from("orders").insert({
                customer_name: d.get("name"),
                customer_phone: d.get("phone"),
                customer_email: d.get("email") || null,
                items: cart.map(ci => ({
                  part_id: ci.part.id,
                  part_name: ci.part.name,
                  part_code: ci.part.code,
                  quantity: ci.quantity,
                  price: ci.part.price,
                })),
                total: cartTotal,
                status: "new",
              });
              setShowOrderForm(false);
              setCart([]);
              addMsg({
                id: "ord-ok",
                role: "assistant",
                content: "✅ **Замовлення прийнято!**\n\nМенеджер зв'яжеться з вами найближчим часом для підтвердження деталей.",
                timestamp: new Date(),
              });
            }} className="space-y-3">
              <input name="name" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }} placeholder="Ім'я" required />
              <input name="phone" type="tel" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }} placeholder="Телефон" required />
              <input name="email" type="email" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }} placeholder="Email (необов'язково)" />
              <button type="submit" className="w-full py-3 rounded-xl text-sm font-medium" style={{ background: "var(--primary)", color: "#fff" }}>Підтвердити</button>
            </form>
          </div>
        </div>
      )}

      {/* Schema Viewer */}
      {schemaView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={() => setSchemaView(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">{schemaView.title}</h3>
              <div className="flex gap-2">
                {safeUrl(schemaView.image_url) && (
                  <a href={safeUrl(schemaView.image_url)} download target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg" style={{ background: "var(--bg-card)" }}>
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => setSchemaView(null)} className="p-2 rounded-lg" style={{ background: "var(--bg-card)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {safeUrl(schemaView.image_url) && <img src={safeUrl(schemaView.image_url)} alt={schemaView.title} className="w-full rounded-xl" style={{ maxHeight: "70vh", objectFit: "contain", background: "#fff" }} />}
          </div>
        </div>
      )}
    </div>
  );
}

function renderMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function renderContent(
  content: ChatContent,
  addToCart: (p: Part) => void,
  setSchemaView: (s: Schema) => void,
) {
  if (content.type === "part_list" && content.data?.parts) {
    const { title, parts, analogs, schemas } = content.data;
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold mb-3">{title}</p>
        {parts.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Запчастин не знайдено</p>
        )}
        {parts.map((p: any) => (
          <div key={p.id} className="p-3 rounded-lg text-sm" style={{ background: "var(--bg)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{p.name}</p>
                {p.code && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Код: {p.code}</p>}
                {p.categories?.name && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Категорія: {p.categories.name}</p>}
                {p.cars?.brand && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Авто: {p.cars.brand} {p.cars.model} {p.cars.year ? `(${p.cars.year})` : ""}</p>}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  <span className="text-xs" style={{ color: p.stock > 0 ? "var(--success)" : "var(--error)" }}>
                    {p.stock > 0 ? `✓ В наявності (${p.stock} шт)` : "✗ Немає в наявності"}
                  </span>
                  {p.delivery_days != null && p.delivery_days > 0 && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Доставка: {p.delivery_days} дн.</span>
                  )}
                </div>
              </div>
              {p.price > 0 && (
                <div className="text-right shrink-0">
                  <p className="font-semibold" style={{ color: "var(--success)" }}>{p.price}₴</p>
                  <button
                    className="mt-1 px-2 py-1 rounded text-xs"
                    style={{ background: "var(--primary)", color: "#fff" }}
                    onClick={() => addToCart(p)}
                  >+ В кошик</button>
                </div>
              )}
            </div>
          </div>
        ))}

        {analogs?.length > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>🔄 Аналоги:</p>
            <div className="space-y-1.5">
              {analogs.map((a: any) => (
                <div key={a.id} className="p-2.5 rounded-lg text-xs flex items-center justify-between" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p style={{ color: "var(--text-muted)" }}>Код: {a.code}</p>
                  </div>
                  {a.price > 0 && (
                    <div className="text-right">
                      <p style={{ color: "var(--success)" }}>{a.price}₴</p>
                      <button className="mt-1 px-2 py-0.5 rounded" style={{ background: "var(--primary)", color: "#fff" }} onClick={() => addToCart(a)}>+ В кошик</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {schemas?.length > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>🖼 Схеми:</p>
            <div className="flex flex-wrap gap-2">
              {schemas.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSchemaView(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                >
                  <ImageIcon className="w-3 h-3" />{s.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (content.type === "comparison" && content.data?.parts) {
    const { parts } = content.data;
    return (
      <div>
        <p className="text-sm font-semibold mb-3">📊 Порівняння запчастин</p>
        <div className="overflow-x-auto">
          <table className="text-xs w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left py-2 pr-4 font-normal" style={{ color: "var(--text-muted)" }}>Параметр</th>
                {parts.map((p: any) => <th key={p.id} className="text-left py-2 pr-4 font-semibold">{p.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {([["Код", "code"], ["Ціна", "price"], ["Наявність", "stock"], ["Доставка", "delivery_days"]] as const).map(([label, field]) => (
                <tr key={field} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="py-2 pr-4" style={{ color: "var(--text-muted)" }}>{label}</td>
                  {parts.map((p: any) => (
                    <td key={p.id} className="py-2 pr-4">
                      {field === "price" ? `${p[field]}₴`
                        : field === "stock" ? (p[field] > 0 ? `✓ ${p[field]} шт` : "✗")
                        : field === "delivery_days" ? (p[field] ? `${p[field]} дн.` : "—")
                        : p[field] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
