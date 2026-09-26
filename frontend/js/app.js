const demoProducts=[
 {id:1,name:"Ergonomic Mechanical Keyboard",sku:"KB-ERG-01",unit:"units",stock:100,reorder:30,status:"In Stock"},
 {id:2,name:"Studio Display 27\" 4K HDR",sku:"DSP-4K-27",unit:"units",stock:42,reorder:25,status:"In Stock"},
 {id:3,name:"Braided Thunderbolt 4 Cable",sku:"CAB-TB4-2M",unit:"units",stock:18,reorder:30,status:"Low Stock"},
 {id:4,name:"Wireless Studio Reference Monitor",sku:"AUD-PRO-9",unit:"units",stock:115,reorder:40,status:"In Stock"}
];
const rooms=[{id:1,name:"Electronics Room",qty:80},{id:2,name:"High-Density Storage",qty:120},{id:3,name:"Raw Materials Vault",qty:30},{id:4,name:"Clean Room Assembly",qty:64}];
const activities=[
 ["100 Keyboards received","Electronics Room","2 min ago","sage"],
 ["20 Keyboards transferred","Electronics → Storage","18 min ago","lav"],
 ["5 Keyboards delivered","Storage Room","42 min ago","peach"],
 ["Physical count adjusted","Assembly Floor","1 hr ago","yellow"]
];

function go(page){
 document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.page===page));
 const names={dashboard:"Overview",products:"Products",where:"Where is my product?",receipts:"Receipts",deliveries:"Deliveries",transfers:"Transfers",adjustments:"Adjustments",ledger:"Stock Ledger",notifications:"Notifications"};
 document.getElementById("crumb").textContent=names[page]||"Overview";
 render(page);
 window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".nav-link").forEach(a=>a.addEventListener("click",()=>go(a.dataset.page)));

function header(eyebrow,title,desc,action=""){
 return `<div class="page-head"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${desc}</p></div>${action?`<div class="actions">${action}</div>`:""}</div>`;
}
function render(page){
 const app=document.getElementById("app");
 if(page==="dashboard") app.innerHTML=dashboard();
 else if(page==="products") app.innerHTML=products();
 else if(page==="where") app.innerHTML=wherePage();
 else if(page==="receipts") app.innerHTML=formPage("RECEIVING","Inbound stock","Add received inventory to a warehouse room.","Receive Stock","move_to_inbox");
 else if(page==="deliveries") app.innerHTML=formPage("OUTBOUND","Delivery","Dispatch stock from a room while respecting available quantity.","Create Delivery","local_shipping");
 else if(page==="transfers") app.innerHTML=transferPage();
 else if(page==="adjustments") app.innerHTML=formPage("RECONCILIATION","Stock Adjustments","Record physical-count corrections with a clear audit reason.","Save Adjustment","tune");
 else if(page==="ledger") app.innerHTML=ledger();
 else if(page==="notifications") app.innerHTML=notifications();
}
function dashboard(){
 return header("INVENTORY CONTROL","Good morning 👋","Here’s what’s happening with your inventory today.",
 `<button class="secondary-btn">Export Report</button><button class="primary-btn" onclick="openQuick()">+ Quick Movement</button>`) +
 `<section class="hero">
   <div class="hero-main"><span class="eyebrow">STOCKSENSE • LIVE WORKSPACE</span><h2>Know your stock.<br>Move smarter.</h2><p>Monitor inventory, warehouse capacity and stock movement from one intelligent workspace.</p>
    <div class="hero-illustration"><div class="cube one"></div><div class="cube two"></div><div class="cube three"></div></div>
   </div>
   <div class="card health"><div class="health-ring"></div><div class="health-text"><b>92%</b><small>Inventory health</small></div></div>
 </section>
 <section class="kpis">
 ${kpi("Total Stock","1,248","↑ 8.4% this week","inventory_2","--lav:#e7e0ff;--accent:#e7e0ff;--icon:#5c50a2")}
 ${kpi("Low Stock Items","12","3 need attention","warning","--accent:#ffe0d5;--icon:#a64f35")}
 ${kpi("Pending Receipts","08","2 arriving today","move_to_inbox","--accent:#c9efd2;--icon:#2e6945")}
 ${kpi("Pending Deliveries","05","Fulfilment 99.1%","local_shipping","--accent:#fff0b9;--icon:#79630c")}
 </section>
 <section class="grid-main">
  <div class="card panel"><div class="panel-head"><div><h3>Stock Dynamics & Flux</h3><span>Combined movement across physical inventory</span></div><div class="badge lav">7 Days</div></div>
   <div class="chart"><div class="gridlines"></div><svg viewBox="0 0 700 190" preserveAspectRatio="none">
    <path d="M0 150 C80 115 90 160 155 130 S250 70 330 105 S430 140 500 90 S610 35 700 58" fill="none" stroke="#7569bc" stroke-width="4"/>
    <path d="M0 165 C70 140 110 145 165 150 S270 105 340 125 S450 155 520 110 S620 90 700 95" fill="none" stroke="#4e9d6c" stroke-width="3"/>
    <path d="M0 177 C100 168 150 170 220 160 S350 148 430 157 S550 150 700 138" fill="none" stroke="#c87357" stroke-width="2" stroke-dasharray="7 6"/>
   </svg></div><div class="legend"><span class="purple">Receipts</span><span class="green">Deliveries</span><span class="peach">Transfers</span></div>
  </div>
  <div class="card panel"><div class="panel-head"><div><h3>Fast Execution</h3><span>Frequently used actions</span></div></div><div class="quick-panel">
   ${quick("move_to_inbox","Receive Stock","receipts")} ${quick("local_shipping","Create Delivery","deliveries")} ${quick("swap_horiz","Transfer Stock","transfers")} ${quick("tune","Stock Adjust","adjustments")} ${quick("add_box","Add Product","products")} ${quick("location_searching","Find Product","where")}
  </div></div>
 </section>
 <section class="bottom-grid">
  <div class="card panel"><div class="panel-head"><div><h3>Main Warehouse</h3><span>Physical room capacity</span></div><span class="badge sage">68% used</span></div><div class="room-grid">${rooms.map((r,i)=>`<div class="room"><b>Bay 0${i+1} · ${r.name}</b><small>${r.qty} units stored</small><div class="meter"><i style="width:${Math.min(95,r.qty/1.5)}%"></i></div></div>`).join("")}</div></div>
  <div class="card panel"><div class="panel-head"><div><h3>Replenishment Priority</h3><span>Items approaching reorder level</span></div><span class="badge peach">3 urgent</span></div><div class="alerts">${demoProducts.filter(p=>p.stock<=p.reorder+10).slice(0,3).map(p=>`<div class="alert"><div><b>${p.name}</b><small>${p.stock} available · reorder ${p.reorder}</small></div><span class="badge peach">Reorder</span></div>`).join("")}</div></div>
  <div class="card panel"><div class="panel-head"><div><h3>Live Ledger Flow</h3><span>Recent stock movements</span></div><span class="badge sage">REALTIME</span></div><div class="activity">${activities.map(a=>`<div class="activity-item"><div><b>${a[0]}</b><small>${a[1]} · ${a[2]}</small></div><span class="badge ${a[3]}">View</span></div>`).join("")}</div></div>
 </section>`;
}
function kpi(label,num,meta,icon,style){return `<div class="card kpi" style="${style}"><div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-icon material-symbols-outlined">${icon}</span></div><div class="kpi-num">${num}</div><div class="kpi-meta ${meta.includes("↑")?"trend":""}">${meta}</div></div>`}
function quick(icon,label,page){return `<button class="quick-card" onclick="go('${page}')"><span class="material-symbols-outlined">${icon}</span>${label}</button>`}

function products(){
 return header("CATALOG","Products & SKUs","Search products, monitor reorder levels and see current stock at a glance.",
 `<button class="secondary-btn">Export</button><button class="primary-btn" onclick="showToast('Product form ready')">+ Add Product</button>`) +
 `<div class="card panel"><div class="search-box"><input placeholder="Search product name, SKU..." oninput="filterProducts(this.value)"><button class="secondary-btn">Filters</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Reorder</th><th>Status</th><th>Action</th></tr></thead><tbody id="product-body">${productRows(demoProducts)}</tbody></table></div></div>`;
}
function productRows(items){return items.map(p=>`<tr><td><div class="product-cell"><div class="product-img"><span class="material-symbols-outlined">inventory_2</span></div><div><b>${p.name}</b><small style="display:block;color:#777;font-size:8px">${p.unit}</small></div></div></td><td><code>${p.sku}</code></td><td><b>${p.stock}</b></td><td>${p.reorder}</td><td><span class="badge ${p.status==="Low Stock"?"peach":"sage"}">${p.status}</span></td><td><button class="secondary-btn" onclick="showToast('Opening '+p.name)">View</button></td></tr>`).join("")}
function filterProducts(q){const items=demoProducts.filter(p=>(p.name+p.sku).toLowerCase().includes(q.toLowerCase()));document.getElementById("product-body").innerHTML=productRows(items)}

function formPage(type,title,desc,button,icon){
 return header(type,title,desc,`<button class="secondary-btn" onclick="go('dashboard')">Cancel</button>`) +
 `<div class="card form-card"><div class="form-grid">
 <div class="field"><label>Product</label><select>${demoProducts.map(p=>`<option>${p.name} — ${p.sku}</option>`).join("")}</select></div>
 <div class="field"><label>Room</label><select>${rooms.map(r=>`<option>${r.name}</option>`).join("")}</select></div>
 <div class="field"><label>Quantity</label><input id="qty" type="number" min="1" value="20"></div>
 <div class="field"><label>Reference</label><input placeholder="Optional reference number"></div>
 <div class="field" style="grid-column:1/-1"><label>Reason / Notes</label><textarea placeholder="Add context for the audit trail..."></textarea></div>
 </div><div class="form-actions"><button class="primary-btn" onclick="submitAction('${button}')"><span class="material-symbols-outlined">${icon}</span> ${button}</button></div></div>`;
}
function submitAction(label){showToast(label+" submitted — API integration ready");}

function transferPage(){
 return header("INTERNAL LOGISTICS","Stock Movements & Transfers","Move inventory between rooms while keeping source stock, destination stock and ledger history synchronized.",
 `<button class="secondary-btn">Export Log</button><button class="primary-btn" onclick="document.getElementById('transfer-form').scrollIntoView({behavior:'smooth'})">+ New Transfer</button>`) +
 `<div class="kpis">
 ${kpi("Active Transfers","4","in progress","local_shipping","--accent:#e7e0ff;--icon:#5c50a2")}
 ${kpi("Completed Today","18","+22% vs yesterday","check_circle","--accent:#c9efd2;--icon:#2e6945")}
 ${kpi("Avg Transit Time","12","minutes","timelapse","--accent:#fff0b9;--icon:#79630c")}
 </div>
 <div class="card panel" style="margin-bottom:18px"><div class="panel-head"><div><h3>Active Dispatch Corridor</h3><span>Live movement between warehouse rooms</span></div><span class="badge sage">LIVE</span></div>
 <div class="location-result"><div class="location-card"><span class="eyebrow">SOURCE ORIGIN</span><h3>Electronics Room</h3><p>BAY-04 · Sector A · 80 units available</p></div><div class="location-card" style="background:linear-gradient(145deg,#e7e0ff,#d7cff3);color:#322b58"><span class="eyebrow">DESTINATION HUB</span><h3>Storage Room</h3><p style="color:#5d5575">BAY-11 · Sector B · projected balance 40</p></div></div>
 </div>
 <div class="grid-main" id="transfer-form"><div class="card form-card"><div class="panel-head"><h3>Create Transfer Order</h3><span class="eyebrow">AUTO-SEQ #890</span></div>
 <div class="form-grid"><div class="field"><label>Product</label><select>${demoProducts.map(p=>`<option>${p.name} (${p.stock} available)</option>`).join("")}</select></div><div class="field"><label>Quantity</label><input type="number" value="20" min="1"></div><div class="field"><label>From Room</label><select>${rooms.map(r=>`<option>${r.name}</option>`).join("")}</select></div><div class="field"><label>To Room</label><select>${rooms.map(r=>`<option>${r.name}</option>`).join("")}</select></div></div><div class="form-actions"><button class="primary-btn" onclick="submitAction('Transfer')">Confirm & Dispatch Transfer →</button></div></div>
 <div class="card panel"><div class="panel-head"><div><h3>Movement Log & Audit Trail</h3><span>Recent transfer activity</span></div></div>${activities.map(a=>`<div class="activity-item" style="margin-bottom:8px"><div><b>${a[0]}</b><small>${a[1]} · ${a[2]}</small></div><span class="badge ${a[3]}">View</span></div>`).join("")}</div></div>`;
}
function ledger(){
 return header("AUDIT TRAIL","Stock Ledger","Every successful stock movement becomes a traceable ledger entry.",
 `<button class="secondary-btn">Export CSV</button>`) +
 `<div class="card panel"><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Product</th><th>Room</th><th>Movement</th><th>Change</th><th>User</th></tr></thead><tbody>
 ${demoProducts.map((p,i)=>`<tr><td>Today, 14:${20-i} PM</td><td><b>${p.name}</b><small style="display:block;color:#777;font-size:8px">${p.sku}</small></td><td>${rooms[i%rooms.length].name}</td><td><span class="badge ${i===1?"lav":i===2?"peach":"sage"}">${i===1?"TRANSFER":i===2?"DELIVERY":"RECEIPT"}</span></td><td><b>${i===2?"−5":"+100"}</b></td><td>Stock Manager</td></tr>`).join("")}
 </tbody></table></div></div>`;
}
function wherePage(){
 return header("STOCK LOCATOR","Where is my product?","Search one product and instantly see how its stock is distributed across warehouse rooms.")+
 `<div class="card panel"><div class="search-box"><input id="where-input" value="Keyboard" placeholder="Search product or SKU..."><button class="primary-btn" onclick="findProduct()">Find Product</button></div><div id="where-result"></div></div>`;
}
function findProduct(){
 const q=document.getElementById("where-input").value.toLowerCase();const p=demoProducts.find(x=>(x.name+x.sku).toLowerCase().includes(q))||demoProducts[0];
 document.getElementById("where-result").innerHTML=`<div class="location-card" style="margin-bottom:14px;background:var(--dark)"><span class="eyebrow">PRODUCT FOUND</span><h3>${p.name}</h3><p>${p.sku} · Total stock ${p.stock} units</p></div><div class="location-result">${rooms.slice(0,3).map((r,i)=>`<div class="stock-location"><b>${r.name}</b><small style="display:block;color:#777;font-size:8px;margin-top:3px">Room ${r.id}</small><strong>${i===0?80:i===1?20:0} <small style="font-size:10px;color:#777">units</small></strong><div class="meter"><i style="width:${i===0?80:i===1?20:0}%"></i></div></div>`).join("")}</div>`;
}
function notifications(){
 return header("SYSTEM","Notifications","Stay on top of low stock, pending operations and completed movements.")+
 `<div class="notif-grid">${[
 ["warning","Low stock alert","Braided Thunderbolt 4 Cable is below its reorder level.","8 min ago","peach"],
 ["move_to_inbox","Receipt completed","100 Ergonomic Mechanical Keyboards received into Electronics Room.","18 min ago","sage"],
 ["swap_horiz","Transfer completed","20 units moved from Electronics to Storage Room.","42 min ago","lav"],
 ["schedule","Approval pending","Delivery #DEL-104 is waiting for manager approval.","1 hr ago","yellow"]
 ].map(n=>`<div class="notification"><div class="nicon ${n[4]}"><span class="material-symbols-outlined">${n[0]}</span></div><div><h4>${n[1]}</h4><p>${n[2]}</p><time>${n[3]}</time></div></div>`).join("")}</div>`;
}
function openQuick(){document.getElementById("quick-modal").classList.add("open")}
function closeQuick(){document.getElementById("quick-modal").classList.remove("open")}
function showToast(msg){const r=document.getElementById("toast-root");const t=document.createElement("div");t.className="toast";t.textContent=msg;r.appendChild(t);setTimeout(()=>t.remove(),2800)}
render("dashboard");
