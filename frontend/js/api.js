const API_BASE_URL = "http://localhost:8000";

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("stocksense_token");
  const headers = {"Content-Type":"application/json", ...(options.headers || {})};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, {...options, headers});
  if (!response.ok) throw new Error((await response.text()) || `API ${response.status}`);
  return response.status === 204 ? null : response.json();
}

const API = {
  getProducts: () => apiRequest("/products/"),
  getProduct: id => apiRequest(`/products/${id}`),
  getRooms: () => apiRequest("/rooms"),
  getStock: () => apiRequest("/stock"),
  getProductLocations: id => apiRequest(`/stock/${id}/locations`),
  getReceipts: () => apiRequest("/receipts"),
  createReceipt: body => apiRequest("/receipts",{method:"POST",body:JSON.stringify(body)}),
  getDeliveries: () => apiRequest("/deliveries"),
  createDelivery: body => apiRequest("/deliveries",{method:"POST",body:JSON.stringify(body)}),
  getTransfers: () => apiRequest("/transfers"),
  createTransfer: body => apiRequest("/transfers",{method:"POST",body:JSON.stringify(body)}),
  getAdjustments: () => apiRequest("/adjustments"),
  createAdjustment: body => apiRequest("/adjustments",{method:"POST",body:JSON.stringify(body)}),
  getLedger: () => apiRequest("/ledger"),
  getProductLedger: id => apiRequest(`/ledger/${id}`)
};
