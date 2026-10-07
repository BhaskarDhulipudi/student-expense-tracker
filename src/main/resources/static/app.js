const DB_NAME="studentExpenseTracker",DB_VERSION=1,STORE="expenses";
const $=id=>document.getElementById(id),pad=n=>String(n).padStart(2,"0");
const now=new Date(),monthNow=`${now.getFullYear()}-${pad(now.getMonth()+1)}`,today=`${monthNow}-${pad(now.getDate())}`;
$("month").value=monthNow;$("date").value=today;
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:"clientId"})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function all(){const d=await db();return new Promise((res,rej)=>{const r=d.transaction(STORE,"readonly").objectStore(STORE).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function put(x){const d=await db();return new Promise((res,rej)=>{const t=d.transaction(STORE,"readwrite");t.objectStore(STORE).put(x);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
function setSyncText(text){$("syncText").textContent=text}
function network(){const update=()=>{const on=navigator.onLine,b=$("network");b.className="status "+(on?"online":"offline");b.querySelector("span:last-child").textContent=on?"Online":"Offline"};update();addEventListener("online",()=>{update();sync()});addEventListener("offline",()=>{update();setSyncText("Offline — saved on this device")})}
async function render(){
 const m=$("month").value||monthNow,rows=(await all()).filter(x=>!x.deleted&&x.expenseDate.startsWith(m));
 const total=rows.reduce((s,x)=>s+Number(x.amount),0),dates=new Set(rows.map(x=>x.expenseDate));
 $("total").textContent=money(total);$("average").textContent=money(dates.size?total/dates.size:0);$("averageHint").textContent=dates.size?`${dates.size} spending day${dates.size===1?"":"s"}`:"0 days tracked";$("count").textContent=rows.length;
 const cats={};rows.forEach(x=>cats[x.category]=(cats[x.category]||0)+Number(x.amount));const sorted=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
 $("topCategory").textContent=sorted[0]?.[0]||"—";$("topAmount").textContent=sorted[0]?money(sorted[0][1]):"No spending yet";
 $("bars").innerHTML=sorted.length?sorted.map(([c,v])=>`<div class="barrow"><div class="barhead"><span>${esc(c)}</span><b>${money(v)}</b></div><div class="track"><div class="fill" style="width:${Math.min(100,v/total*100)}%"></div></div></div>`).join(""):"<div class='empty'>No expenses recorded for this month.</div>";
 rows.sort((a,b)=>b.expenseDate.localeCompare(a.expenseDate)||b.updatedAt.localeCompare(a.updatedAt));
 $("list").innerHTML=rows.length?rows.slice(0,30).map(x=>`<div class="expense"><div class="expense-main"><div class="expense-amount">${money(x.amount)}</div><div class="expense-meta">${esc(x.category)} · ${esc(x.expenseDate)} · ${esc(x.paymentMethod)}${x.note?" · "+esc(x.note):""}</div></div><button class="delete" data-id="${esc(x.clientId)}">Delete</button></div>`).join(""):"<div class='empty'>No expenses recorded for this month.</div>";
}
async function sync(){
 if(!navigator.onLine){setSyncText("Offline — saved on this device");return}
 setSyncText("Syncing…");
 try{
   const local=await all();
   for(const x of local){const r=await fetch("/api/expenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(x)});if(!r.ok)throw new Error("upload failed")}
   const r=await fetch("/api/expenses");if(!r.ok)throw new Error("download failed");
   const remote=await r.json();
   for(const x of remote){const old=local.find(y=>y.clientId===x.clientId);if(!old||new Date(x.updatedAt)>new Date(old.updatedAt))await put(x)}
   setSyncText("Synced just now");$("message").textContent="✓ Synced successfully.";await render();
 }catch(e){setSyncText("Sync unavailable — changes kept locally")}
}
$("expenseForm").addEventListener("submit",async e=>{e.preventDefault();const amount=Number($("amount").value);if(!amount||amount<=0){$("message").textContent="Enter a valid amount.";return}const x={clientId:uid(),category:$("category").value,amount,expenseDate:$("date").value,note:$("note").value.trim(),paymentMethod:$("payment").value,deleted:false,updatedAt:new Date().toISOString()};await put(x);$("amount").value="";$("note").value="";$("message").textContent=navigator.onLine?"✓ Expense added.":"✓ Expense saved offline.";await render();if(navigator.onLine)await sync()});
$("month").addEventListener("change",()=>{const m=$("month").value;if(m)$("date").value=m===monthNow?today:`${m}-01`;render()});
$("syncBtn").addEventListener("click",sync);
$("list").addEventListener("click",async e=>{const b=e.target.closest(".delete");if(!b)return;const rows=await all(),x=rows.find(r=>r.clientId===b.dataset.id);if(x){x.deleted=true;x.updatedAt=new Date().toISOString();await put(x);$("message").textContent="✓ Expense deleted.";await render();if(navigator.onLine)await sync()}});
network();render();if(navigator.onLine)sync();if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});
