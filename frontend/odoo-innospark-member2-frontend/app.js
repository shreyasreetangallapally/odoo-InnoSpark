const API_BASE = "http://localhost:8000";
const DEMO_PRODUCTS = [
  {id:1,name:"Wireless Keyboard",sku:"KB001",unit:"piece",reorder_level:20},
  {id:2,name:"USB-C Hub",sku:"HB002",unit:"piece",reorder_level:25},
  {id:3,name:"Ethernet Cable",sku:"EC003",unit:"piece",reorder_level:15},
  {id:4,name:"Barcode Scanner",sku:"BS004",unit:"piece",reorder_level:10},
  {id:5,name:"Label Roll",sku:"LR005",unit:"roll",reorder_level:8}
];
const DEMO_STOCK = [100,18,64,7,0].map((quantity,index)=>({
  product_id:index+1,product_name:DEMO_PRODUCTS[index].name,sku:DEMO_PRODUCTS[index].sku,
  room_id:index<3?1:2,room_name:index<3?"Electronics":"Storage",quantity
}));
const DEMO_MOVEMENTS = [
  {reference_id:"REC-1025",product_name:"Wireless Keyboard",room_name:"Electronics",transaction_type:"RECEIPT",quantity_change:100,performed_by_name:"Admin",created_at:"Today 09:42"},
  {reference_id:"TRF-0831",product_name:"Wireless Keyboard",room_name:"Electronics",transaction_type:"TRANSFER",quantity_change:-20,performed_by_name:"Admin",created_at:"Today 10:05"},
  {reference_id:"DEL-0448",product_name:"USB-C Hub",room_name:"Storage",transaction_type:"DELIVERY",quantity_change:-5,performed_by_name:"Admin",created_at:"Today 10:18"},
  {reference_id:"ADJ-0193",product_name:"Barcode Scanner",room_name:"Storage",transaction_type:"ADJUSTMENT",quantity_change:-3,performed_by_name:"Manager",created_at:"Today 10:31"}
];
const state = {
  view:"dashboard",mock:true,products:[],stockRows:[],rooms:[],warehouses:[],ledger:[],
  latestApprovalId:null
};

const $ = (selector) => document.querySelector(selector);
const content = $("#content");

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function statusClass(status){ return status === "In Stock" ? "good" : status === "Low Stock" ? "low" : "out"; }
function toast(message){ const node=$("#toast"); node.textContent=message; node.classList.add("show"); setTimeout(()=>node.classList.remove("show"),3200); }
function setApiStatus(connected){
  const node=$("#api-status");
  node.innerHTML=connected?'<i style="background:#16a34a"></i> API connected':'<i></i> API unavailable · Demo data';
}
function getProductStock(productId){
  return state.stockRows.filter(row=>Number(row.product_id)===Number(productId)).reduce((total,row)=>total+Number(row.quantity||0),0);
}
function refreshProductTotals(){
  state.products=state.products.map(product=>{
    const stock=getProductStock(product.id);
    return {...product,stock,status:stock===0?"Out of Stock":stock<=Number(product.reorder_level||0)?"Low Stock":"In Stock"};
  });
}
function formatDate(value){
  if(!value) return "";
  const date=new Date(value);
  return Number.isNaN(date.getTime())?String(value):date.toLocaleString();
}
function ledgerRow(entry){
  const reference=entry.reference_id==null?entry.id:`${entry.transaction_type}-${entry.reference_id}`;
  const cells=[reference,entry.product_name,entry.room_name,entry.transaction_type,
    Number(entry.quantity_change)>0?`+${entry.quantity_change}`:entry.quantity_change,
    entry.performed_by_name||entry.performed_by||"",formatDate(entry.created_at)];
  const attributes=`data-type="${escapeHtml(entry.transaction_type)}" data-search="${escapeHtml(`${entry.product_name} ${entry.room_name}`.toLowerCase())}"`;
  return `<tr ${attributes}>${cells.map((value,index)=>`<td>${index===3?`<span class="status good">${escapeHtml(value)}</span>`:escapeHtml(value)}</td>`).join("")}</tr>`;
}
function demoLedger(){ return DEMO_MOVEMENTS.map((row,index)=>({...row,id:index+1})); }
async function apiRequest(path,options={}){
  let response;
  try{
    response=await fetch(`${API_BASE}${path}`,{
      ...options,
      headers:{Accept:"application/json","X-User-ID":"1",...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers||{})}
    });
  }catch(error){
    throw new Error("Cannot reach the backend at http://localhost:8000. Check that the API is running and CORS allows this page.");
  }
  const text=await response.text();
  let data=null;
  try{ data=text?JSON.parse(text):null; }catch{ data=text; }
  if(!response.ok){
    const detail=data?.detail||data?.message||text||`HTTP ${response.status}`;
    throw new Error(typeof detail==="string"?detail:JSON.stringify(detail));
  }
  return data;
}
async function refreshInventory({refreshLedger=true}={}){
  const [products,stock]=await Promise.all([apiRequest("/products/"),apiRequest("/stock/")]);
  state.products=Array.isArray(products)?products:[];
  state.stockRows=Array.isArray(stock)?stock:[];
  refreshProductTotals();
  const extras=await Promise.allSettled([
    apiRequest("/rooms/"),apiRequest("/warehouses/"),...(refreshLedger?[apiRequest("/ledger/")]:[])
  ]);
  if(extras[0].status==="fulfilled") state.rooms=extras[0].value||[];
  if(extras[1].status==="fulfilled") state.warehouses=extras[1].value||[];
  if(refreshLedger&&extras[2]?.status==="fulfilled") state.ledger=extras[2].value||[];
}
async function loadData(){
  try{
    await refreshInventory();
    state.mock=false;
    setApiStatus(true);
  }catch(error){
    state.mock=true;
    state.products=DEMO_PRODUCTS.map(product=>({...product}));
    state.stockRows=DEMO_STOCK.map(row=>({...row}));
    state.rooms=[{id:1,warehouse_id:1,name:"Electronics"},{id:2,warehouse_id:1,name:"Storage"}];
    state.warehouses=[{id:1,name:"Warehouse A"}];
    state.ledger=demoLedger();
    refreshProductTotals();
    setApiStatus(false);
    toast(`Backend unavailable. Showing fallback data. ${error.message}`);
  }
  setView(state.view);
}

function dashboard(){
  const total=state.products.reduce((sum,product)=>sum+product.stock,0);
  const low=state.products.filter(product=>product.stock>0&&product.stock<=product.reorder_level).length;
  const out=state.products.filter(product=>product.stock===0).length;
  const maxStock=Math.max(1,...state.products.map(product=>product.stock));
  const attention=state.products.filter(product=>product.stock<=product.reorder_level);
  return `
    <div class="grid kpis">
      <div class="card kpi"><div class="kpi-head"><span>Total Stock Units</span><span class="kpi-icon">▦</span></div><div class="kpi-value">${total}</div><div class="kpi-foot">Across all rooms</div></div>
      <div class="card kpi"><div class="kpi-head"><span>Products</span><span class="kpi-icon">□</span></div><div class="kpi-value">${state.products.length}</div><div class="kpi-foot">Active inventory items</div></div>
      <div class="card kpi"><div class="kpi-head"><span>Low Stock</span><span class="kpi-icon">!</span></div><div class="kpi-value">${low}</div><div class="kpi-foot">At or below reorder level</div></div>
      <div class="card kpi"><div class="kpi-head"><span>Out of Stock</span><span class="kpi-icon">×</span></div><div class="kpi-value">${out}</div><div class="kpi-foot">Requires attention</div></div>
    </div>
    <div class="grid two-col">
      <div class="card"><div class="card-head"><h2>Stock by Product</h2><small>Current quantity</small></div><div class="card-body">
        ${state.products.slice(0,5).map(product=>`<div class="bar-row"><div class="bar-label"><span>${escapeHtml(product.name)}</span><strong>${product.stock}</strong></div><div class="bar"><i style="width:${Math.min(100,Math.max(4,product.stock/maxStock*100))}%"></i></div></div>`).join("")||'<div class="empty">No products found.</div>'}
      </div></div>
      <div class="card"><div class="card-head"><h2>Needs Attention</h2><small>${attention.length} items</small></div><div class="card-body">
        ${attention.map(product=>`<div class="alert ${product.stock===0?'red':''}"><div>${product.stock===0?'⛔':'⚠️'}</div><div><strong>${escapeHtml(product.name)}</strong><span>${product.stock===0?'Out of stock':`Only ${product.stock} left — reorder level ${product.reorder_level}`}</span></div></div>`).join("")||'<div class="empty">All stock levels look healthy.</div>'}
      </div></div>
    </div>
    <div class="card table-card"><div class="card-head"><h2>Recent Inventory Activity</h2><button class="btn secondary" onclick="setView('ledger')">View ledger</button></div><div class="table-wrap"><table><thead><tr><th>Reference</th><th>Product</th><th>Location</th><th>Type</th><th>Change</th><th>User</th><th>Time</th></tr></thead><tbody>${state.ledger.slice(0,8).map(ledgerRow).join("")||'<tr><td colspan="7" class="empty">No inventory activity yet.</td></tr>'}</tbody></table></div></div>`;
}

function products(){
  return `<div class="page-tools"><input id="product-filter" placeholder="Search product or SKU..." oninput="filterProducts()"><button class="btn" onclick="openCreateProduct()">+ Add Product</button></div>
  <div class="card table-card"><div class="card-head"><h2>Products</h2><small>${state.products.length} items</small></div><div class="table-wrap"><table id="products-table"><thead><tr><th>Product</th><th>SKU</th><th>Unit</th><th>Current Stock</th><th>Reorder Level</th><th>Status</th></tr></thead><tbody>${state.products.map(product=>`<tr data-search="${escapeHtml(`${product.name} ${product.sku}`.toLowerCase())}"><td><strong>${escapeHtml(product.name)}</strong></td><td>${escapeHtml(product.sku)}</td><td>${escapeHtml(product.unit)}</td><td>${product.stock}</td><td>${product.reorder_level}</td><td><span class="status ${statusClass(product.status)}">${escapeHtml(product.status)}</span></td></tr>`).join("")||'<tr><td colspan="6" class="empty">No products found.</td></tr>'}</tbody></table></div></div>`;
}
function productOptions(selectedId){
  return state.products.map(product=>`<option value="${product.id}" ${Number(product.id)===Number(selectedId)?"selected":""}>${escapeHtml(product.name)} — ${escapeHtml(product.sku)}</option>`).join("");
}
function roomOptions(selectedId){
  return state.rooms.map(room=>`<option value="${room.id}" ${Number(room.id)===Number(selectedId)?"selected":""}>${escapeHtml(room.name)}</option>`).join("");
}
function transaction(view){
  const labels={receipts:["Receipts","Receipt"],deliveries:["Deliveries","Delivery"],transfers:["Transfers","Transfer"],adjustments:["Adjustments","Adjustment"]};
  const [title,type]=labels[view];
  const history=state.ledger.filter(entry=>entry.transaction_type===type.toUpperCase());
  const roomLabel=view==="transfers"?"Source Room":"Room";
  return `<div class="card search-hero"><div class="card-head" style="padding:0 0 18px;border:0"><div><h2>New ${type}</h2><small>All inventory changes are processed by the backend Stock Engine.</small></div></div>
    <div class="form-grid">
      <label>Product<select id="tx-product">${productOptions()}</select></label>
      <label>${roomLabel}<select id="tx-room">${roomOptions()}</select></label>
      ${view==="adjustments"?'<label>New Quantity<input id="tx-quantity" type="number" min="0" placeholder="Enter counted quantity"></label>':'<label>Quantity<input id="tx-quantity" type="number" min="1" placeholder="Enter quantity"></label>'}
      ${view==="transfers"?`<label>Destination Room<select id="tx-destination">${roomOptions(state.rooms.find(room=>Number(room.id)!==Number(state.rooms[0]?.id))?.id)}</select></label>`:""}
      ${view==="adjustments"?'<label>Reason<input id="tx-reason" placeholder="Physical count mismatch"></label>':""}
    </div>
    <div class="form-actions"><button class="btn secondary" onclick="clearTransactionForm()">Clear</button><button class="btn" onclick="submitTransaction('${view}')">Create ${type}</button></div>
  </div>
  <div class="card table-card"><div class="card-head"><h2>${title} History</h2></div><div class="table-wrap"><table><thead><tr><th>Reference</th><th>Product</th><th>Location</th><th>Type</th><th>Change</th><th>User</th><th>Time</th></tr></thead><tbody>${history.map(ledgerRow).join("")||'<tr><td colspan="7" class="empty">No transactions yet.</td></tr>'}</tbody></table></div></div>`;
}
function clearTransactionForm(){
  const quantity=$("#tx-quantity");
  if(quantity) quantity.value="";
  const reason=$("#tx-reason");
  if(reason) reason.value="";
  toast("Form cleared");
}
async function submitTransaction(view){
  const productId=Number($("#tx-product")?.value);
  const roomId=Number($("#tx-room")?.value);
  const quantityInput=$("#tx-quantity")?.value.trim()||"";
  const quantity=Number(quantityInput);
  const body={product_id:productId,room_id:roomId};
  const endpoints={receipts:"/receipts/",deliveries:"/deliveries/",transfers:"/transfers/",adjustments:"/adjustments/"};
  if(!productId||!roomId||!quantityInput||!Number.isFinite(quantity)||(view==="adjustments"?quantity<0:quantity<=0)){
    toast(view==="adjustments"?"Choose a product and room, then enter a valid quantity.":"Choose a product and room, then enter a quantity greater than zero.");
    return;
  }
  if(view==="adjustments"){
    body.new_quantity=quantity;
    body.reason=$("#tx-reason")?.value.trim();
    if(!body.reason){toast("Enter a reason for this adjustment.");return;}
  }else body.quantity=quantity;
  if(view==="transfers"){
    body.from_room_id=roomId;
    body.to_room_id=Number($("#tx-destination")?.value);
    delete body.room_id;
    if(!body.to_room_id||body.to_room_id===body.from_room_id){toast("Choose a different destination room.");return;}
  }
  try{
    await apiRequest(endpoints[view],{method:"POST",body:JSON.stringify(body)});
    await refreshInventory();
    toast(`${view[0].toUpperCase()+view.slice(1)} completed successfully.`);
    setView(view);
  }catch(error){toast(`Could not submit ${view}: ${error.message}`);}
}

function ledger(){
  return `<div class="page-tools"><select id="ledger-type" onchange="filterLedger()"><option value="">All movement types</option><option>RECEIPT</option><option>DELIVERY</option><option>TRANSFER</option><option>ADJUSTMENT</option></select><input id="ledger-filter" placeholder="Filter product / room..." oninput="filterLedger()"></div>
  <div class="card table-card"><div class="card-head"><h2>Stock Ledger</h2><small>Immutable movement history</small></div><div class="table-wrap"><table id="ledger-table"><thead><tr><th>Reference</th><th>Product</th><th>Room</th><th>Movement</th><th>Quantity Change</th><th>User</th><th>Created</th></tr></thead><tbody>${state.ledger.map(entry=>ledgerRow(entry)).join("")||'<tr><td colspan="7" class="empty">No ledger entries found.</td></tr>'}</tbody></table></div></div>`;
}
function searchView(){
  return `<div class="card search-hero"><div><h2 style="margin:0 0 5px">Where is this product?</h2><small>See current stock across every room from the backend stock source of truth.</small></div><div class="search-box" style="margin-top:18px"><input id="location-search" placeholder="Search by product name or SKU..." value="${escapeHtml(state.products[0]?.name||"")}" oninput="renderLocations()"><button class="btn" onclick="renderLocations()">Search</button></div></div><div id="locations"></div>`;
}
function renderLocations(){
  const host=$("#locations");
  if(!host) return;
  const query=( $("#location-search")?.value||"").trim().toLowerCase();
  const product=state.products.find(item=>`${item.name} ${item.sku}`.toLowerCase().includes(query));
  if(!product){host.innerHTML='<div class="empty">No matching product found.</div>';return;}
  const rows=state.stockRows.filter(row=>Number(row.product_id)===Number(product.id));
  const grouped=new Map();
  rows.forEach(row=>grouped.set(row.room_id,{room_id:row.room_id,room_name:row.room_name,quantity:(grouped.get(row.room_id)?.quantity||0)+Number(row.quantity||0)}));
  const roomCards=[...grouped.values()].map(room=>{
    const roomRecord=state.rooms.find(item=>Number(item.id)===Number(room.room_id));
    const warehouse=state.warehouses.find(item=>Number(item.id)===Number(roomRecord?.warehouse_id));
    return `<div class="card location-card"><div><strong>${escapeHtml(room.room_name)}</strong><span>${escapeHtml(warehouse?.name||"Warehouse")} · Current room stock</span></div><div class="qty">${room.quantity}</div></div>`;
  }).join("");
  host.innerHTML=`<div class="card location-card"><div><strong>${escapeHtml(product.name)}</strong><span>SKU ${escapeHtml(product.sku)} · Total available across rooms</span></div><div class="qty">${product.stock}</div></div>${roomCards||'<div class="empty">No stock is recorded in any room.</div>'}`;
}
function notifications(){
  const attention=state.products.filter(product=>product.stock<=product.reorder_level);
  return `<div class="card"><div class="card-head"><h2>Notifications</h2><small>${attention.length} unread</small></div><div class="card-body">
    ${attention.map(product=>`<div class="alert ${product.stock===0?'red':''}"><div>${product.stock===0?'⛔':'⚠️'}</div><div><strong>${escapeHtml(product.name)} ${product.stock===0?'is out of stock':'is low'}</strong><span>${product.stock===0?`Current stock is 0. Reorder level is ${product.reorder_level}.`:`${product.stock} units remaining, at or below reorder level ${product.reorder_level}.`}</span></div></div>`).join("")||'<div class="empty">No stock alerts right now.</div>'}
  </div></div>`;
}

function intelligence(){
  const defaultProduct=state.products[0];
  return `<div class="grid two-col">
    <div class="card search-hero"><div class="card-head"><h2>Room Access</h2></div><div class="form-grid"><label>Room<select id="intel-access-room">${roomOptions()}</select></label></div><div class="form-actions"><button class="btn" onclick="checkRoomAccess()">Check access</button></div><div id="intel-access-result" aria-live="polite"></div></div>
    <div class="card search-hero"><div class="card-head"><h2>Manager Approval</h2></div><div class="form-grid"><label>Product<select id="intel-approval-product" onchange="updateApprovalStock()">${productOptions()}</select></label><label>Current Stock<input id="intel-current-stock" type="number" value="${defaultProduct?getProductStock(defaultProduct.id):0}" readonly></label><label>Requested Stock<input id="intel-requested-stock" type="number" min="0" placeholder="Requested quantity"></label><label>Reason<input id="intel-approval-reason" placeholder="Reason for approval"></label></div><div class="form-actions"><button class="btn" onclick="requestApproval()">Request approval</button></div><div id="intel-approval-result" aria-live="polite"></div></div>
    <div class="card search-hero"><div class="card-head"><h2>Stock-Out Risk</h2></div><div class="form-grid"><label>Product<select id="intel-risk-product" onchange="updateRiskStock()">${productOptions()}</select></label><label>Current Stock<input id="intel-risk-stock" type="number" value="${defaultProduct?getProductStock(defaultProduct.id):0}" readonly></label><label>Average Daily Usage<input id="intel-average-usage" type="number" min="0" step="any" placeholder="Units per day"></label><label>Pending Orders<input id="intel-pending-orders" type="number" min="0" value="0"></label></div><div class="form-actions"><button class="btn" onclick="checkStockRisk()">Check risk</button></div><div id="intel-risk-result" aria-live="polite"></div></div>
    <div class="card search-hero"><div class="card-head"><h2>Anomaly Detection</h2></div><div class="form-grid"><label>Product<select id="intel-anomaly-product">${productOptions()}</select></label><label>Stock Change<input id="intel-stock-change" type="number" step="any" placeholder="Change in units"></label><label>Normal Average Change<input id="intel-average-change" type="number" min="0" step="any" placeholder="Typical change"></label></div><div class="form-actions"><button class="btn" onclick="detectStockAnomaly()">Check anomaly</button></div><div id="intel-anomaly-result" aria-live="polite"></div></div>
  </div>`;
}
function showIntelligenceResult(id,value){
  const node=$(id);
  if(node) node.innerHTML=`<div class="alert"><div>✓</div><div><strong>Result</strong><span>${escapeHtml(typeof value==="string"?value:JSON.stringify(value))}</span></div></div>`;
}
async function checkRoomAccess(){
  try{const result=await apiRequest("/intelligence/access",{method:"POST",body:JSON.stringify({employee_id:1,room_id:Number($("#intel-access-room")?.value)})});showIntelligenceResult("#intel-access-result",result);}
  catch(error){toast(`Room access check failed: ${error.message}`);}
}
function updateApprovalStock(){const product=state.products.find(item=>Number(item.id)===Number($("#intel-approval-product")?.value));if($("#intel-current-stock")) $("#intel-current-stock").value=product?getProductStock(product.id):0;}
async function requestApproval(){
  const product=state.products.find(item=>Number(item.id)===Number($("#intel-approval-product")?.value));
  const requestedInput=$("#intel-requested-stock")?.value.trim()||"";
  const requested=Number(requestedInput);
  const reason=$("#intel-approval-reason")?.value.trim();
  if(!product||!requestedInput||!Number.isFinite(requested)||requested<0||!reason){toast("Select a product and enter a requested quantity and reason.");return;}
  try{
    const result=await apiRequest("/intelligence/approval/request",{method:"POST",body:JSON.stringify({employee_id:1,product:product.name,current_stock:getProductStock(product.id),requested_stock:requested,reason})});
    state.latestApprovalId=result?.request_id??result?.id??result;
    const requestId=Number(state.latestApprovalId);
    showIntelligenceResult("#intel-approval-result",result);
    if(Number.isFinite(requestId)) $("#intel-approval-result").insertAdjacentHTML("beforeend",`<div class="form-actions"><button class="btn" onclick="resolveApproval(${requestId},'approve')">Approve</button><button class="btn secondary" onclick="resolveApproval(${requestId},'reject')">Reject</button></div>`);
  }catch(error){toast(`Approval request failed: ${error.message}`);}
}
async function resolveApproval(requestId,action){
  try{const result=await apiRequest(`/intelligence/approval/${requestId}/${action}`,{method:"POST"});showIntelligenceResult("#intel-approval-result",result);}
  catch(error){toast(`Could not ${action} request: ${error.message}`);}
}
function updateRiskStock(){const product=state.products.find(item=>Number(item.id)===Number($("#intel-risk-product")?.value));if($("#intel-risk-stock")) $("#intel-risk-stock").value=product?getProductStock(product.id):0;}
async function checkStockRisk(){
  const product=state.products.find(item=>Number(item.id)===Number($("#intel-risk-product")?.value));
  const averageUsageInput=$("#intel-average-usage")?.value.trim()||"";
  const averageUsage=Number(averageUsageInput);
  if(!product||!averageUsageInput||!Number.isFinite(averageUsage)||averageUsage<=0){toast("Select a product and enter average daily usage greater than zero.");return;}
  try{const result=await apiRequest("/intelligence/risk",{method:"POST",body:JSON.stringify({product:product.name,current_stock:getProductStock(product.id),average_usage:averageUsage,pending_orders:Number($("#intel-pending-orders")?.value||0)})});showIntelligenceResult("#intel-risk-result",result);}
  catch(error){toast(`Risk check failed: ${error.message}`);}
}
async function detectStockAnomaly(){
  const product=state.products.find(item=>Number(item.id)===Number($("#intel-anomaly-product")?.value));
  const stockChangeInput=$("#intel-stock-change")?.value.trim()||"";
  const averageChangeInput=$("#intel-average-change")?.value.trim()||"";
  const stockChange=Number(stockChangeInput);
  const averageChange=Number(averageChangeInput);
  if(!product||!stockChangeInput||!averageChangeInput||!Number.isFinite(stockChange)||!Number.isFinite(averageChange)||averageChange<=0){toast("Select a product and enter a stock change and average change greater than zero.");return;}
  try{const result=await apiRequest("/intelligence/anomaly",{method:"POST",body:JSON.stringify({product:product.name,stock_change:stockChange,average_change:averageChange})});showIntelligenceResult("#intel-anomaly-result",result);}
  catch(error){toast(`Anomaly check failed: ${error.message}`);}
}

function filterLedger(){
  const type=$("#ledger-type")?.value||"";
  const query=( $("#ledger-filter")?.value||"").toLowerCase();
  document.querySelectorAll("#ledger-table tbody tr[data-type]").forEach(row=>{
    row.style.display=(!type||row.dataset.type===type)&&row.dataset.search.includes(query)?"":"none";
  });
}
function setView(view){
  state.view=view;
  document.querySelectorAll(".nav-item[data-view]").forEach(button=>button.classList.toggle("active",button.dataset.view===view));
  const titles={dashboard:"Dashboard",products:"Products",receipts:"Receipts",deliveries:"Deliveries",transfers:"Transfers",adjustments:"Adjustments",ledger:"Stock Ledger",search:"Where is a product?",notifications:"Notifications",intelligence:"Intelligence"};
  if(!titles[view]) return;
  $("#page-title").textContent=titles[view];
  if(view==="dashboard") content.innerHTML=dashboard();
  else if(view==="products") content.innerHTML=products();
  else if(["receipts","deliveries","transfers","adjustments"].includes(view)) content.innerHTML=transaction(view);
  else if(view==="ledger") content.innerHTML=ledger();
  else if(view==="search"){content.innerHTML=searchView();renderLocations();}
  else if(view==="notifications") content.innerHTML=notifications();
  else if(view==="intelligence") content.innerHTML=intelligence();
}
function installIntelligenceNav(){
  if(document.querySelector('[data-view="intelligence"]')) return;
  const ledgerButton=document.querySelector('.nav-item[data-view="ledger"]');
  if(!ledgerButton) return;
  const button=document.createElement("button");
  button.className="nav-item";
  button.dataset.view="intelligence";
  button.innerHTML='✦ <span>Intelligence</span>';
  ledgerButton.insertAdjacentElement("afterend",button);
}
window.setView=setView;
window.renderLocations=renderLocations;
window.filterProducts=()=>{const query=( $("#product-filter")?.value||"").toLowerCase();document.querySelectorAll("#products-table tbody tr[data-search]").forEach(row=>row.style.display=row.dataset.search.includes(query)?"":"none");};
window.openCreateProduct=()=>toast("Product creation is not available in the configured API.");
window.submitTransaction=submitTransaction;
window.clearTransactionForm=clearTransactionForm;
window.filterLedger=filterLedger;
window.checkRoomAccess=checkRoomAccess;
window.requestApproval=requestApproval;
window.resolveApproval=resolveApproval;
window.updateApprovalStock=updateApprovalStock;
window.updateRiskStock=updateRiskStock;
window.checkStockRisk=checkStockRisk;
window.detectStockAnomaly=detectStockAnomaly;
installIntelligenceNav();
document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>setView(button.dataset.view)));
setView("dashboard");
loadData();
