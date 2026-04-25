"use client";
import { useState, useRef, useEffect } from "react";
import { ChatMessage, ChatContent, Part } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { Send, Loader2, Search, Car, ShoppingCart, X, Plus, Minus } from "lucide-react";

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "welcome", role: "assistant",
    content: "Привіт! Я AI-помічник з підбору автозапчастин.\n\n• 🔍 Знайти за **VIN**-номером\n• 🚗 Знайти за **маркою/моделлю**\n• 🔢 Знайти за **кодом** запчастини",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState("");
  const [cart, setCart] = useState<{part:Part;quantity:number}[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, thinking]);

  const addMsg = (m:ChatMessage) => setMessages(p=>[...p,m]);

  const search = async (text:string) => {
    setThinking("Аналізую...");
    const lower = text.toLowerCase();
    const vinMatch = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i);
    if (vinMatch) {
      setThinking("Шукаю за VIN...");
      const vin = vinMatch[0].toUpperCase();
      const {data:cars} = await supabase.from("cars").select("*").eq("vin",vin).limit(1);
      if (cars?.length) {
        const car=cars[0];
        const {data:parts} = await supabase.from("parts").select("*,categories(name)").eq("car_id",car.id).limit(10);
        addMsg({id:`r-${Date.now()}`,role:"assistant",content:{type:"part_list",data:{title:`🚗 ${car.brand} ${car.model} (${car.year})`,parts:parts||[],car}},timestamp:new Date()});
      } else addMsg({id:`nf-${Date.now()}`,role:"assistant",content:`❌ Авто з VIN **${vin}** не знайдено`,timestamp:new Date()});
      setThinking("");return;
    }
    const codeMatch = text.match(/\b([A-Z0-9]{4,20})\b/i);
    if (codeMatch && (lower.includes("код")||lower.includes("детал")||codeMatch[0].length>=5)) {
      setThinking("Шукаю за кодом...");
      const code=codeMatch[1].toUpperCase();
      const {data:parts}=await supabase.from("parts").select("*,categories(name)").ilike("code",`%${code}%`).limit(10);
      if (parts?.length) addMsg({id:`r-${Date.now()}`,role:"assistant",content:{type:"part_list",data:{title:`🔢 Знайдено за кодом: ${code}`,parts,cars:null}},timestamp:new Date()});
      else addMsg({id:`nf-${Date.now()}`,role:"assistant",content:`❌ Запчастину **${code}** не знайдено`,timestamp:new Date()});
      setThinking("");return;
    }
    const knownBrands=["bmw","audi","mercedes","volkswagen","toyota","honda","nissan","ford","opel","renault","peugeot","citroen","fiat","hyundai","kia","mazda","skoda","seat","volvo","lexus"];
    const brand=knownBrands.find(b=>lower.includes(b));
    if (brand) {
      setThinking("Шукаю за маркою...");
      const {data:cars}=await supabase.from("cars").select("model,year").ilike("brand",brand).order("model").limit(20);
      if (cars?.length) {
        const models=[...new Set(cars.map(m=>m.model))];
        addMsg({id:`r-${Date.now()}`,role:"assistant",content:`🚗 **${brand.toUpperCase()}** — моделі:\n${models.map(m=>`• ${m}`).join("\n")}`,timestamp:new Date()});
      } else {
        const {data:cats}=await supabase.from("categories").select("*").is("parent_id",null).limit(10);
        if (cats?.length) addMsg({id:`r-${Date.now()}`,role:"assistant",content:`📂 Категорії:\n${cats.map(c=>`• ${c.name}`).join("\n")}`,timestamp:new Date()});
        else addMsg({id:`nf-${Date.now()}`,role:"assistant",content:`❌ ${brand} не знайдено`,timestamp:new Date()});
      }
      setThinking("");return;
    }
    addMsg({id:`fb-${Date.now()}`,role:"assistant",content:"Спробуйте:\n• **VIN** номер\n• **Марку** авто (BMW, Audi...)\n• **Код** запчастини",timestamp:new Date()});
    setThinking("");
  };

  const handleSend=async()=>{
    if(!input.trim()||loading)return;
    addMsg({id:`u-${Date.now()}`,role:"user",content:input.trim(),timestamp:new Date()});
    setInput("");setLoading(true);
    await search(input.trim());
    setLoading(false);
  };

  const addToCart=(part:Part)=>{
    setCart(p=>{const e=p.find(i=>i.part.id===part.id);return e?p.map(i=>i.part.id===part.id?{...i,quantity:i.quantity+1}:i):[...p,{part,quantity:1}];});
    addMsg({id:`ct-${Date.now()}`,role:"assistant",content:`✅ **${part.name}** додано в кошик`,timestamp:new Date()});
  };

  const cartTotal=cart.reduce((s,i)=>s+i.part.price*i.quantity,0);

  return (
    <div className="min-h-screen flex flex-col" style={{background:"var(--bg)"}}>
      <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between" style={{background:"var(--bg-card)",borderBottom:"1px solid var(--border)"}}>
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"var(--primary)"}}><Car className="w-4 h-4 text-white"/></div><span className="font-semibold text-sm">Автозапчастини</span></div>
        <div className="flex gap-2">
          <a href="/admin" className="p-2 rounded-lg text-xs" style={{background:"var(--bg)",border:"1px solid var(--border)",color:"var(--text-muted)"}}>Адмін</a>
          <button onClick={()=>setShowCart(true)} className="relative p-2 rounded-lg" style={{background:"var(--bg)",border:"1px solid var(--border)"}}>
            <ShoppingCart className="w-4 h-4"/>
            {cart.length>0&&<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center" style={{background:"var(--primary)",color:"#fff"}}>{cart.reduce((s,i)=>s+i.quantity,0)}</span>}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-3xl mx-auto w-full pb-32">
        {messages.map(msg=>(
          <div key={msg.id} className={`flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role==="user"?"rounded-br-lg":"rounded-bl-lg"}`}
              style={{background:msg.role==="user"?"var(--primary)":"var(--bg-card)",color:msg.role==="user"?"#fff":"var(--text)"}}>
              {typeof msg.content==="string"?<div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>:renderPartList(msg.content,addToCart)}
            </div>
          </div>
        ))}
        {thinking&&<div className="flex justify-start"><div className="rounded-2xl rounded-bl-lg p-4" style={{background:"var(--bg-card)"}}><div className="flex items-center gap-2 text-sm" style={{color:"var(--text-muted)"}}><Loader2 className="w-4 h-4 animate-spin"/>{thinking}</div></div></div>}
        <div ref={messagesEndRef}/>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4" style={{background:"linear-gradient(transparent, var(--bg) 20%)"}}>
        <div className="max-w-3xl mx-auto flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSend()}
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none" style={{background:"var(--bg-card)",color:"var(--text)",border:"1px solid var(--border)"}}
            placeholder="VIN, марка, код деталі..." disabled={loading}/>
          <button onClick={handleSend} disabled={loading||!input.trim()} className="px-4 rounded-xl flex items-center justify-center disabled:opacity-40" style={{background:"var(--primary)"}}><Send className="w-4 h-4 text-white"/></button>
        </div>
      </div>

      {showCart&&<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:"rgba(0,0,0,0.6)"}}>
        <div className="w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl max-h-[70vh] overflow-y-auto" style={{background:"var(--bg-card)"}}>
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold flex items-center gap-2"><ShoppingCart className="w-4 h-4"/> Кошик</h2><button onClick={()=>setShowCart(false)}><X className="w-5 h-5"/></button></div>
          {cart.length===0?<p className="text-sm text-center py-8" style={{color:"var(--text-muted)"}}>Кошик порожній</p>:<div className="space-y-3 mb-4">{cart.map(ci=>(<div key={ci.part.id} className="flex items-center justify-between p-3 rounded-lg" style={{background:"var(--bg)"}}>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium">{ci.part.name}</p><p className="text-xs" style={{color:"var(--text-muted)"}}>{ci.part.code}</p></div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={()=>setCart(p=>p.map(i=>i.part.id===ci.part.id?{...i,quantity:Math.max(0,i.quantity-1)}:i).filter(i=>i.quantity>0))} className="p-1 rounded" style={{background:"var(--bg-card)"}}><Minus className="w-3 h-3"/></button>
              <span className="text-sm w-6 text-center">{ci.quantity}</span>
              <button onClick={()=>setCart(p=>p.map(i=>i.part.id===ci.part.id?{...i,quantity:i.quantity+1}:i))} className="p-1 rounded" style={{background:"var(--bg-card)"}}><Plus className="w-3 h-3"/></button>
              <span className="text-sm font-medium w-16 text-right">{ci.part.price*ci.quantity}₴</span>
            </div>
          </div>))}
          <div className="flex items-center justify-between p-3 rounded-lg font-semibold" style={{background:"rgba(124,92,252,0.1)"}}><span>Разом</span><span>{cartTotal}₴</span></div>
          <button onClick={()=>setShowOrderForm(true)} className="w-full py-3 rounded-xl text-sm font-medium" style={{background:"var(--primary)",color:"#fff"}}>Оформити замовлення</button></div>}
        </div>
      </div>}

      {showOrderForm&&<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:"rgba(0,0,0,0.6)"}}>
        <div className="w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl" style={{background:"var(--bg-card)"}}>
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold">Оформлення замовлення</h2><button onClick={()=>setShowOrderForm(false)}><X className="w-5 h-5"/></button></div>
          <form onSubmit={async(e)=>{e.preventDefault();const f=e.target as HTMLFormElement;const d=new FormData(f);await supabase.from("orders").insert({customer_name:d.get("name"),customer_phone:d.get("phone"),customer_email:d.get("email"),items:cart.map(ci=>({part_id:ci.part.id,part_name:ci.part.name,part_code:ci.part.code,quantity:ci.quantity,price:ci.part.price})),total:cartTotal,status:"new"});setShowOrderForm(false);setShowCart(false);setCart([]);addMsg({id:"ord-ok",role:"assistant",content:"✅ **Замовлення прийнято!** Менеджер зв'яжеться з вами.",timestamp:new Date()});}} className="space-y-3">
            <input name="name" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}} placeholder="Ім'я" required/>
            <input name="phone" type="tel" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}} placeholder="Телефон" required/>
            <input name="email" type="email" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}} placeholder="Email"/>
            <button type="submit" className="w-full py-3 rounded-xl text-sm font-medium" style={{background:"var(--primary)",color:"#fff"}}>Підтвердити</button>
          </form>
        </div>
      </div>}
    </div>
  );
}

function renderPartList(content:ChatContent,addToCart:(p:Part)=>void){
  if(content.type==="part_list"&&content.data?.parts){
    const{title,parts}=content.data;
    return(<div className="space-y-2"><p className="text-sm font-medium mb-2">{title}</p>{parts.map((p:any)=>(
      <div key={p.id} className="p-3 rounded-lg text-sm cursor-pointer" style={{background:"var(--bg)"}} onClick={()=>p.price>0&&addToCart(p)}>
        <div className="flex items-center justify-between">
          <div><p className="font-medium">{p.name}</p>{p.code&&<p className="text-xs" style={{color:"var(--text-muted)"}}>Код: {p.code}</p>}</div>
          {p.price>0&&<div className="text-right shrink-0"><p className="font-semibold" style={{color:"var(--success)"}}>{p.price}₴</p>
            <button className="mt-1 px-2 py-0.5 rounded text-xs" style={{background:"var(--primary)",color:"#fff"}} onClick={(e)=>{e.stopPropagation();addToCart(p);}}>+ В кошик</button></div>}
        </div>
      </div>
    ))}</div>);
  }
  return null;
}
