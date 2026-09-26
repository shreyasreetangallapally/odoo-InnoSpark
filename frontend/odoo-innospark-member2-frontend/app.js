const API_BASE = "http://localhost:8000";
const state = {
  view: "dashboard",
  mock: true,
  products: [
    {id:1,name:"Wireless Keyboard",sku:"KB001",unit:"piece",stock:100,reorder_level:20,status:"In Stock"},
    {id:2,name:"USB-C Hub",sku:"HB002",unit:"piece",stock:18,reorder_level:25,status:"Low Stock"},
    {id:3,name:"Ethernet Cable",sku:"EC003",unit:"piece",stock:64,reorder_level:15,status:"In Stock"},
    {id:4,name:"Barcode Scanner",sku:"BS004",unit:"piece",stock:7,reorder_level:10,status:"Low Stock"},
    {id:5,name:"Label Roll",sku:"LR005",unit:"roll",stock:0,reorder_level:8,status:"Out of Stock"}
  ],
  movements: [
    ["REC-1025","Wireless Keyboard","Electronics","RECEIPT","+100","Admin","Today 09:42"],
    ["TRF-0831","Wireless Keyboard","Electronics → Storage","TRANSFER","-20 / +20","Admin","Today 10:05"],
    ["DEL-0448","USB-C Hub","Storage","DELIVERY","-5","Admin","Today 10:18"],
    ["ADJ-0193","Barcode Scanner","Storage","ADJUSTMENT","-3","Manager","Today 10:31"]
  ]
};

const $ = (s) => document.querySelector(s);
const content = $("#content");

function statusClass(s){ return s === "In Stock" ? "good" : s === "Low Stock" ? "low" : "out"; }
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2200); }

function dashboard(){
  const total = state.products.reduce((a,p)=>a+p.stock,0);
  const low = state.products.filter(p=>p.stock>0 && p.stock<=p.reorder_level).length;
  const out = state.products.filter(p=>p.stock===0).length;
  return `
    <div class="grid kpis">
      <div class="card kpi"><div class="kpi-head"><span>Total Stock Units</span><span class="kpi-icon">▦</span></div><div class="kpi-value">${total}</div><div class="kpi-foot">Across all rooms</div></div>
      <div class="card kpi"><div class="kpi-head"><span>Products</span><span class="kpi-icon">□</span></div><div class="kpi-value">${state.products.length}</div><div class="kpi-foot">Active inventory items</div></div>
      <div class="card kpi"><div class="kpi-head"><span>Low Stock</span><span class="kpi-icon">!</span></div><div class="kpi-value">${low}</div><div class="kpi-foot">At or below reorder level</div></div>
      <div class="card kpi"><div class="kpi-head"><span>Out of Stock</span><span class="kpi-icon">×</span></div><div class="kpi-value">${out}</div><div class="kpi-foot">Requires attention</div></div>
    </div>
    <div class="grid two-col">
      <div class="card"><div class="card-head"><h2>Stock by Product</h2><small>Current quantity</small></div><div class="card-body">
        ${state.products.slice(0,5).map(p=>`<div class="bar-row"><div class="bar-label"><span>${p.name}</span><strong>${p.stock}</strong></div><div class="bar"><i style="width:${Math.min(100,Math.max(4,p.stock))}%"></i></div></div>`).join("")}
      </div></div>
      <div class="card"><div class="card-head"><h2>Needs Attention</h2><small>${low+out} items</small></div><div class="card-body">
        ${state.products.filter(p=>p.stock<=p.reorder_level).map(p=>`<div class="alert ${p.stock===0?'red':''}"><div>${p.stock===0?'⛔':'⚠️'}</div><div><strong>${p.name}</strong><span>${p.stock===0?'Out of stock':'Only '+p.stock+' left — reorder level '+p.reorder_level}</span></div></div>`).join("") || `<div class="empty">All stock levels look healthy.</div>`}
      </div></div>
    </div>
    <div class="card table-card"><div class="card-head"><h2>Recent Inventory Activity</h2><button class="btn secondary" onclick="setView('ledger')">View ledger</button></div><div class="table-wrap"><table><thead><tr><th>Reference</th><th>Product</th><th>Location</th><th>Type</th><th>Change</th><th>User</th><th>Time</th></tr></thead><tbody>${state.movements.map(m=>`<tr>${m.map((x,i)=>`<td>${i===3?`<span class="status good">${x}</span>`:x}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>
  `;
}

function products(){
  return `<div class="page-tools"><input id="product-filter" placeholder="Search product or SKU..." oninput="filterProducts()"><button class="btn" onclick="openCreateProduct()">+ Add Product</button></div>
  <div class="card table-card"><div class="card-head"><h2>Products</h2><small>${state.products.length} items</small></div><div class="table-wrap"><table id="products-table"><thead><tr><th>Product</th><th>SKU</th><th>Unit</th><th>Current Stock</th><th>Reorder Level</th><th>Status</th></tr></thead><tbody>${state.products.map(p=>`<tr data-search="${(p.name+p.sku).toLowerCase()}"><td><strong>${p.name}</strong></td><td>${p.sku}</td><td>${p.unit}</td><td>${p.stock}</td><td>${p.reorder_level}</td><td><span class="status ${statusClass(p.status)}">${p.status}</span></td></tr>`).join("")}</tbody></table></div></div>`;
}

function transaction(view){
  const labels={receipts:["Receipts","Receipt"],deliveries:["Deliveries","Delivery"],transfers:["Transfers","Transfer"],adjustments:["Adjustments","Adjustment"]};
  const [title,type]=labels[view];
  const rows=state.movements.filter(m=>m[3]===type.toUpperCase());
  return `<div class="card search-hero"><div class="card-head" style="padding:0 0 18px;border:0"><div><h2>New ${type}</h2><small>All inventory changes are processed by the backend Stock Engine.</small></div></div>
    <div class="form-grid">
      <label>Product<select><option>Wireless Keyboard — KB001</option><option>USB-C Hub — HB002</option><option>Ethernet Cable — EC003</option></select></label>
      <label>Room<select><option>Electronics</option><option>Storage</option></select></label>
      <label>Quantity<input type="number" min="1" placeholder="Enter quantity"></label>
      ${view==="transfers"?'<label>Destination Room<select><option>Storage</option><option>Electronics</option></select></label>':""}
      ${view==="adjustments"?'<label>Reason<input placeholder="Physical count mismatch"></label>':""}
    </div>
    <div class="form-actions"><button class="btn secondary" onclick="toast('Form cleared')">Clear</button><button class="btn" onclick="toast('${type} submitted to API')">Create ${type}</button></div>
  </div>
  <div class="card table-card"><div class="card-head"><h2>${title} History</h2></div><div class="table-wrap"><table><thead><tr><th>Reference</th><th>Product</th><th>Location</th><th>Type</th><th>Change</th><th>User</th><th>Time</th></tr></thead><tbody>${rows.length?rows.map(m=>`<tr>${m.map((x,i)=>`<td>${i===3?`<span class="status good">${x}</span>`:x}</td>`).join("")}</tr>`).join(""):'<tr><td colspan="7" class="empty">No transactions yet.</td></tr>'}</tbody></table></div></div>`;
}

function ledger(){
  return `<div class="page-tools"><select><option>All movement types</option><option>RECEIPT</option><option>DELIVERY</option><option>TRANSFER</option><option>ADJUSTMENT</option></select><input placeholder="Filter product / room..."></div>
  <div class="card table-card"><div class="card-head"><h2>Stock Ledger</h2><small>Immutable movement history</small></div><div class="table-wrap"><table><thead><tr><th>Reference</th><th>Product</th><th>Room</th><th>Movement</th><th>Quantity Change</th><th>User</th><th>Created</th></tr></thead><tbody>${state.movements.map(m=>`<tr>${m.map((x,i)=>`<td>${i===3?`<span class="status good">${x}</span>`:x}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`;
}

function searchView(){
  return `<div class="card search-hero"><div><h2 style="margin:0 0 5px">Where is this product?</h2><small>See current stock across every room from the backend stock source of truth.</small></div><div class="search-box" style="margin-top:18px"><input id="location-search" placeholder="Search by product name or SKU..." value="Wireless Keyboard" oninput="renderLocations()"><button class="btn">Search</button></div></div><div id="locations"></div>`;
}
function renderLocations(){
  const q=($("#location-search")?.value||"").toLowerCase();
  const p=state.products.find(x=>(x.name+x.sku).toLowerCase().includes(q)) || state.products[0];
  $("#locations").innerHTML=`<div class="card location-card"><div><strong>${p.name}</strong><span>SKU ${p.sku} · Total available across rooms</span></div><div class="qty">${p.stock}</div></div>
  <div class="card location-card"><div><strong>Electronics Room</strong><span>Warehouse A · Room 1</span></div><div class="qty">${Math.round(p.stock*.8)}</div></div>
  <div class="card location-card"><div><strong>Storage Room</strong><span>Warehouse A · Room 2</span></div><div class="qty">${p.stock-Math.round(p.stock*.8)}</div></div>`;
}
function notifications(){
  return `<div class="card"><div class="card-head"><h2>Notifications</h2><small>3 unread</small></div><div class="card-body">
    <div class="alert red"><div>⛔</div><div><strong>Label Roll is out of stock</strong><span>Current stock is 0. Reorder level is 8.</span></div></div>
    <div class="alert"><div>⚠️</div><div><strong>USB-C Hub is low</strong><span>18 units remaining, below reorder level 25.</span></div></div>
    <div class="alert"><div>✓</div><div><strong>Transfer completed</strong><span>20 Wireless Keyboards moved from Electronics to Storage.</span></div></div>
  </div></div>`;
}

function setView(view){
  state.view=view;
  document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const titles={dashboard:"Dashboard",products:"Products",receipts:"Receipts",deliveries:"Deliveries",transfers:"Transfers",adjustments:"Adjustments",ledger:"Stock Ledger",search:"Where is a product?",notifications:"Notifications"};
  $("#page-title").textContent=titles[view];
  if(view==="dashboard") content.innerHTML=dashboard();
  else if(view==="products") content.innerHTML=products();
  else if(["receipts","deliveries","transfers","adjustments"].includes(view)) content.innerHTML=transaction(view);
  else if(view==="ledger") content.innerHTML=ledger();
  else if(view==="search"){content.innerHTML=searchView(); renderLocations();}
  else content.innerHTML=notifications();
}
window.setView=setView;
window.renderLocations=renderLocations;
window.filterProducts=()=>{const q=($("#product-filter")?.value||"").toLowerCase(); document.querySelectorAll("#products-table tbody tr").forEach(r=>r.style.display=r.dataset.search.includes(q)?"":"none");};
window.openCreateProduct=()=>toast("Product form ready — connect POST /products");
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
setView("dashboard");

// Optional API probe. UI stays usable with demo data when backend isn't running.
fetch(API_BASE + "/stock", {headers:{Accept:"application/json"}}).then(r=>{
  if(!r.ok) throw new Error();
  state.mock=false;
  $("#api-status").innerHTML='<i style="background:#16a34a"></i> API connected';
}).catch(()=>{});
