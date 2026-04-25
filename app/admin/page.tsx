"use client";
import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabaseClient";
import {Part,Category,Order} from "@/lib/types";
import {LogIn,Plus,X} from "lucide-react";

export default function AdminPage(){
  const [isAuth,setIsAuth]=useState(false);
  const [email,setEmail]=useState("");const [password,setPassword]=useState("");
  const [authError,setAuthError]=useState("");
  const [tab,setTab]=useState<"parts"|"categories"|"orders">("parts");
  const [parts,setParts]=useState<Part[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [showPartForm,setShowPartForm]=useState(false);
  const [showCatForm,setShowCatForm]=useState(false);
  const [np,setNp]=useState({code:"",name:"",description:"",category_id:"",price:0,stock:0,image_url:""});
  const [nc,setNc]=useState({name:"",description:"",parent_id:""});

  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{if(session){setIsAuth(true);loadData();}});},[]);

  async function login(e:React.FormEvent){e.preventDefault();const{error}=await supabase.auth.signInWithPassword({email,password});if(error)setAuthError(error.message);else{setIsAuth(true);loadData();}}
  async function loadData(){const[p,c,o]=await Promise.all([supabase.from("parts").select("*").order("created_at",{ascending:false}).limit(50),supabase.from("categories").select("*").order("name"),supabase.from("orders").select("*").order("created_at",{ascending:false}).limit(20)]);if(p.data)setParts(p.data as Part[]);if(c.data)setCategories(c.data as Category[]);if(o.data)setOrders(o.data as Order[]);}
  async function createPart(e:React.FormEvent){e.preventDefault();await supabase.from("parts").insert(np);setShowPartForm(false);setNp({code:"",name:"",description:"",category_id:"",price:0,stock:0,image_url:""});loadData();}
  async function createCat(e:React.FormEvent){e.preventDefault();await supabase.from("categories").insert({name:nc.name,description:nc.description,parent_id:nc.parent_id||null});setShowCatForm(false);setNc({name:"",description:"",parent_id:""});loadData();}
  async function updateOrder(id:string,s:string){await supabase.from("orders").update({status:s}).eq("id",id);loadData();}

  if(!isAuth)return(<div className="min-h-screen flex items-center justify-center p-4" style={{background:"var(--bg)"}}>
    <div className="w-full max-w-sm p-6 rounded-2xl" style={{background:"var(--bg-card)"}}>
      <h1 className="text-xl font-bold mb-4">Адмін</h1>
      {authError&&<p className="text-sm mb-3" style={{color:"var(--error)"}}>{authError}</p>}
      <form onSubmit={login} className="space-y-3">
        <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}} placeholder="Email" type="email" required/>
        <input value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}} placeholder="Пароль" type="password" required/>
        <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={{background:"var(--primary)",color:"#fff"}}><LogIn className="w-4 h-4"/> Увійти</button>
      </form>
    </div>
  </div>);

  return(<div className="min-h-screen" style={{background:"var(--bg)"}}>
    <header className="sticky top-0 z-50 px-4 py-3" style={{background:"var(--bg-card)",borderBottom:"1px solid var(--border)"}}>
      <h1 className="font-semibold">Адмін-панель</h1>
      <div className="flex gap-2 mt-2">
        {(["parts","categories","orders"]as const).map(t=>(<button key={t} onClick={()=>setTab(t)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{background:tab===t?"var(--primary)":"var(--bg)",color:tab===t?"#fff":"var(--text)"}}>{t==="parts"?"Запчастини":t==="categories"?"Категорії":"Замовлення"}</button>))}
      </div>
    </header>
    <main className="max-w-3xl mx-auto px-4 py-6">
      {tab==="parts"&&<div className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-sm font-medium" style={{color:"var(--text-secondary)"}}>Запчастини ({parts.length})</h2>
          <button onClick={()=>setShowPartForm(true)} className="p-2 rounded-lg" style={{background:"var(--bg-card)",border:"1px solid var(--border)"}}><Plus className="w-4 h-4"/></button></div>
        {parts.slice(0,10).map(p=>(<div key={p.id} className="p-3 rounded-xl text-sm" style={{background:"var(--bg-card)",border:"1px solid var(--border)"}}>
          <p className="font-medium">{p.name}</p><p style={{color:"var(--text-muted)"}}>Код: {p.code} · {p.price}₴</p></div>))}
      </div>}
      {tab==="categories"&&<div className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-sm font-medium" style={{color:"var(--text-secondary)"}}>Категорії ({categories.length})</h2>
          <button onClick={()=>setShowCatForm(true)} className="p-2 rounded-lg" style={{background:"var(--bg-card)",border:"1px solid var(--border)"}}><Plus className="w-4 h-4"/></button></div>
        <div className="grid grid-cols-2 gap-2">{categories.map(c=>(<div key={c.id} className="p-3 rounded-xl text-sm" style={{background:"var(--bg-card)",border:"1px solid var(--border)"}}>
          <p className="font-medium">{c.name}</p>{c.description&&<p className="text-xs mt-1" style={{color:"var(--text-muted)"}}>{c.description}</p>}</div>))}</div>
      </div>}
      {tab==="orders"&&<div className="space-y-3">
        <h2 className="text-sm font-medium" style={{color:"var(--text-secondary)"}}>Замовлення ({orders.length})</h2>
        {orders.map(o=>(<div key={o.id} className="p-3 rounded-xl text-sm" style={{background:"var(--bg-card)",border:"1px solid var(--border)"}}>
          <div className="flex items-center justify-between mb-2"><div><p className="font-medium">{o.customer_name}</p><p style={{color:"var(--text-muted)"}}>{o.customer_phone}</p></div>
            <select value={o.status} onChange={e=>updateOrder(o.id,e.target.value)} className="px-2 py-1 rounded text-xs outline-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}}>
              <option value="new">Нове</option><option value="processing">В роботі</option><option value="completed">Виконано</option><option value="cancelled">Скасовано</option></select></div>
          <p className="font-semibold" style={{color:"var(--success)"}}>{o.total}₴</p></div>))}
      </div>}
    </main>

    {showPartForm&&<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:"rgba(0,0,0,0.6)"}}>
      <div className="w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl" style={{background:"var(--bg-card)"}}>
        <div className="flex items-center justify-between mb-4"><h2 className="font-semibold">Нова запчастина</h2><button onClick={()=>setShowPartForm(false)}><X className="w-5 h-5"/></button></div>
        <form onSubmit={createPart} className="space-y-3">
          <input value={np.code} onChange={e=>setNp({...np,code:e.target.value})} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}} placeholder="Код" required/>
          <input value={np.name} onChange={e=>setNp({...np,name:e.target.value})} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}} placeholder="Назва" required/>
          <textarea value={np.description} onChange={e=>setNp({...np,description:e.target.value})} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}} placeholder="Опис" rows={2}/>
          <div className="flex gap-2"><div className="flex-1"><input type="number" value={np.price} onChange={e=>setNp({...np,price:parseInt(e.target.value)||0})} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}} placeholder="Ціна"/></div>
            <div className="flex-1"><input type="number" value={np.stock} onChange={e=>setNp({...np,stock:parseInt(e.target.value)||0})} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}} placeholder="К-сть"/></div></div>
          <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={{background:"var(--primary)",color:"#fff"}}>Створити</button>
        </form>
      </div>
    </div>}

    {showCatForm&&<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:"rgba(0,0,0,0.6)"}}>
      <div className="w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl" style={{background:"var(--bg-card)"}}>
        <div className="flex items-center justify-between mb-4"><h2 className="font-semibold">Нова категорія</h2><button onClick={()=>setShowCatForm(false)}><X className="w-5 h-5"/></button></div>
        <form onSubmit={createCat} className="space-y-3">
          <input value={nc.name} onChange={e=>setNc({...nc,name:e.target.value})} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}} placeholder="Назва" required/>
          <textarea value={nc.description} onChange={e=>setNc({...nc,description:e.target.value})} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={{background:"var(--bg)",color:"var(--text)",border:"1px solid var(--border)"}} placeholder="Опис" rows={2}/>
          <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={{background:"var(--primary)",color:"#fff"}}>Створити</button>
        </form>
      </div>
    </div>}
  </div>);
}
