/* NovaPOS frontend demo.
   Para conectar una API real, cambia API_BASE_URL y USE_DEMO_DATA.
   Contrato propuesto: /api/v1/productos, clientes, proveedores, ventas, compras y caja.
   Nunca coloques claves privadas de Supabase en este archivo. */
const API_BASE_URL = ""; // Ejemplo: "http://localhost:3000"
const USE_DEMO_DATA = true; // Cambiar a false al tener una API compatible.

const state = {
  view: "dashboard",
  products: [
    {id:1,codigo:"PRD-001",nombre:"Café premium 500 g",categoria:"Abarrotes",precio:48.5,costo:30,stock:24,estado:"Activo"},
    {id:2,codigo:"PRD-002",nombre:"Agua pura 600 ml",categoria:"Bebidas",precio:5,costo:2.5,stock:8,estado:"Activo"},
    {id:3,codigo:"PRD-003",nombre:"Galletas integrales",categoria:"Abarrotes",precio:12.75,costo:7,stock:36,estado:"Activo"},
    {id:4,codigo:"PRD-004",nombre:"Jugo de naranja 1 L",categoria:"Bebidas",precio:18,costo:11,stock:4,estado:"Activo"},
    {id:5,codigo:"PRD-005",nombre:"Detergente 1 kg",categoria:"Limpieza",precio:27.5,costo:19,stock:15,estado:"Activo"},
    {id:6,codigo:"PRD-006",nombre:"Chocolate oscuro",categoria:"Dulces",precio:9.5,costo:5,stock:0,estado:"Inactivo"}
  ],
  customers: [
    {id:1,nombre:"Cliente General",nit:"CF",telefono:"—",correo:"—",direccion:"—"},
    {id:2,nombre:"María López",nit:"1234567-8",telefono:"5555-0101",correo:"maria@email.com",direccion:"Antigua Guatemala"}
  ],
  suppliers: [
    {id:1,nombre:"Distribuidora Central",nit:"5487123-4",contacto:"Carlos Pérez",telefono:"5555-0202",correo:"ventas@central.com"}
  ],
  categories: [
    {id:1,nombre:"Abarrotes",descripcion:"Productos de consumo diario"},
    {id:2,nombre:"Bebidas",descripcion:"Bebidas frías y calientes"},
    {id:3,nombre:"Limpieza",descripcion:"Artículos para el hogar"},
    {id:4,nombre:"Dulces",descripcion:"Confitería y chocolates"}
  ],
  sales: [
    {id:1001,fecha:new Date().toISOString().slice(0,10),cliente:"Cliente General",metodo:"Efectivo",total:142.5,estado:"Completada"},
    {id:1000,fecha:new Date(Date.now()-86400000).toISOString().slice(0,10),cliente:"María López",metodo:"Tarjeta",total:86.25,estado:"Completada"}
  ],
  purchases: [],
  cart: [],
  cash: {open:false,initial:0,final:null},
  nextIds: {products:7,customers:3,suppliers:2,categories:5,sales:1002,purchases:1}
};

const pageMeta = {
 dashboard:["Panel principal","Este es el resumen de la actividad de tu negocio."],
 pos:["Punto de venta","Agrega productos al carrito y prepara una venta."],
 products:["Productos","Administra el catálogo de productos y sus existencias."],
 categories:["Categorías","Organiza los productos de tu negocio."],
 customers:["Clientes","Consulta y administra la información de tus clientes."],
 suppliers:["Proveedores","Gestiona los proveedores y sus datos de contacto."],
 purchases:["Compras","Registra las compras que ingresan al negocio."],
 sales:["Ventas","Consulta el historial de ventas registradas."],
 inventory:["Inventario","Revisa las existencias y detecta productos por agotarse."],
 cash:["Control de caja","Administra la apertura, los movimientos y el cierre diario."],
 invoices:["Facturas y documentos","Consulta las ventas y prepara documentos de venta."],
 reports:["Reportes","Consulta indicadores generales de la operación."],
 users:["Usuarios y roles","Vista de referencia de los perfiles y permisos del sistema."]
};
const content = document.getElementById("appContent");
const money = value => new Intl.NumberFormat("es-GT",{style:"currency",currency:"GTQ"}).format(Number(value)||0);
const esc = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateLabel = value => value ? new Date(value+"T12:00:00").toLocaleDateString("es-GT",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const nextId = key => state.nextIds[key]++;
const iconFor = name => ({ "Abarrotes":"☕","Bebidas":"🥤","Limpieza":"🧴","Dulces":"🍫" }[name] || "▦");

function toast(message,type="success"){
 const region=document.getElementById("toastRegion"),node=document.createElement("div");
 node.className="toast "+type;node.textContent=message;region.appendChild(node);
 setTimeout(()=>node.remove(),3200);
}
function navTo(view){
 if(!pageMeta[view])return;
 state.view=view;
 document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 document.getElementById("breadcrumbCurrent").textContent=pageMeta[view][0];
 document.getElementById("sidebar").classList.remove("open");
 render();
}
document.querySelectorAll(".nav-link").forEach(btn=>btn.addEventListener("click",()=>navTo(btn.dataset.view)));
document.getElementById("mobileMenu").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
document.getElementById("alertsButton").addEventListener("click",()=>navTo("inventory"));
document.getElementById("closeModal").addEventListener("click",closeModal);
document.getElementById("cancelModal").addEventListener("click",closeModal);
document.getElementById("recordForm").addEventListener("submit",saveModal);

function heading(title,subtitle,actions=""){
 return `<div class="page-heading"><div><div class="eyebrow">NOVAPOS / GESTIÓN</div><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
}
function btn(label,action,kind="primary",extra=""){return `<button class="btn btn-${kind}" data-action="${action}" ${extra}>${label}</button>`}
function stat(label,value,foot,icon,iconClass){return `<div class="stat-card"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon ${iconClass}">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></div>`}
function badge(text){let cls="badge-gray";if(["Activo","Completada","Abierta","Disponible"].includes(text))cls="badge-green";if(["Bajo","Pendiente","Planificada"].includes(text))cls="badge-orange";if(["Agotado","Inactivo","Cerrada","Cancelada"].includes(text))cls="badge-red";if(["En revisión","Administración"].includes(text))cls="badge-purple";return `<span class="badge ${cls}">${esc(text)}</span>`}
function tablePanel(title,columns,rows,toolbar=""){
 return `<div class="table-panel"><div class="table-toolbar"><div class="toolbar-left"><h2>${title}</h2></div><div class="toolbar-right">${toolbar}</div></div><div class="table-wrap"><table><thead><tr>${columns.map(c=>`<th>${c}</th>`).join("")}</tr></thead><tbody>${rows||`<tr><td colspan="${columns.length}"><div class="empty-state"><strong>No hay registros todavía</strong><p>Cuando agregues información, aparecerá aquí.</p></div></td></tr>`}</tbody></table></div></div>`;
}
function productRows(list,withActions=true){
 return list.map(p=>`<tr><td><div class="product-cell"><div class="product-thumb">${iconFor(p.categoria)}</div><div><strong>${esc(p.nombre)}</strong><small>${esc(p.codigo)}</small></div></div></td><td>${esc(p.categoria)}</td><td>${money(p.precio)}</td><td>${p.stock}</td><td>${p.stock===0?badge("Agotado"):p.stock<=5?badge("Bajo"):badge("Activo")}</td><td>${withActions?`<div class="row-actions"><button class="table-action" data-action="edit-product" data-id="${p.id}" title="Editar">✎</button><button class="table-action" data-action="delete-product" data-id="${p.id}" title="Eliminar">×</button></div>`:"—"}</td></tr>`).join("");
}
function renderDashboard(){
 const revenue=state.sales.filter(s=>s.fecha===new Date().toISOString().slice(0,10)).reduce((a,s)=>a+s.total,0);
 const low=state.products.filter(p=>p.stock<=5).length;
 const recent=state.sales.slice(0,4).map(s=>`<div class="activity-item"><div class="activity-icon">↗</div><div class="activity-copy"><strong>Venta #${s.id}</strong><small>${esc(s.cliente)} · ${dateLabel(s.fecha)}</small></div><div class="activity-amount">${money(s.total)}</div></div>`).join("");
 const bars=[42,65,50,77,58,87,64,75,51,92,69,82];
 const chart=bars.map((v,i)=>{let x=15+i*31,y=205-v*1.75;return `${i===0?"M":"L"} ${x} ${y}`}).join(" ");
 return `${heading("Panel principal","Aquí tienes una visión general de la actividad de tu negocio.",btn("+ Nueva venta","go-pos","primary"))}
 <div class="stats-grid">${stat("Ventas registradas",state.sales.length,"Historial de operaciones","↗","icon-purple")}${stat("Ingresos de hoy",money(revenue),`<span class="positive">●</span> Según ventas de hoy`,"＄","icon-green")}${stat("Productos en catálogo",state.products.length,"Productos registrados","▤","icon-blue")}${stat("Alertas de inventario",low,low?"Requieren revisión":"Todo en orden","⚑","icon-orange")}</div>
 <div class="dashboard-grid"><div class="panel"><div class="panel-header"><div><h2>Actividad de ventas</h2><p>Vista ilustrativa de la actividad reciente</p></div><div class="legend"><span><i></i>Ventas</span></div></div><div class="chart-wrap"><svg viewBox="0 0 370 220" preserveAspectRatio="none" role="img" aria-label="Gráfico ilustrativo de ventas"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7778f4" stop-opacity=".22"/><stop offset="100%" stop-color="#7778f4" stop-opacity="0"/></linearGradient></defs>${[35,80,125,170,210].map(y=>`<line x1="0" y1="${y}" x2="370" y2="${y}" stroke="#edf0f5" stroke-dasharray="3 4"/>`).join("")}<path d="${chart} L 356 215 L 15 215 Z" fill="url(#chartFill)" transform="translate(0,-2)"/><path d="${chart}" fill="none" stroke="#6869e9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="chart-labels"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div><p class="page-subtitle" style="margin-top:12px">Gráfico de ejemplo para el diseño; se conectará a datos reales mediante la API.</p></div>
 <div class="panel"><div class="panel-header"><div><h2>Ventas recientes</h2><p>Últimas operaciones de prueba</p></div><button class="btn btn-secondary btn-small" data-action="go-sales">Ver todas</button></div><div class="activity-list">${recent||'<div class="empty-state">Aún no hay ventas.</div>'}</div></div></div>
 <div class="panel-header"><div><h2>Accesos rápidos</h2><p>Entra directamente a los módulos principales</p></div></div><div class="section-grid">
 ${shortcut("icon-purple","▣","Punto de venta","Registra una venta y calcula el total.","go-pos")}${shortcut("icon-blue","▤","Nuevo producto","Agrega un producto al catálogo.","new-product")}${shortcut("icon-green","♙","Registrar cliente","Guarda los datos de un cliente.","new-customer")}</div>`;
}
function shortcut(color,icon,title,desc,action){return `<button class="shortcut-card" data-action="${action}"><span class="stat-icon ${color}">${icon}</span><h3>${title}</h3><p>${desc}</p><span class="shortcut-arrow">Abrir módulo →</span></button>`}
function renderProducts(){
 const rows=productRows(state.products);
 return `${heading("Productos",pageMeta.products[1],btn("+ Nuevo producto","new-product"))}
 <div class="notice">Los registros que ves son datos de demostración. Al conectar la API, esta tabla podrá listar los productos guardados en PostgreSQL.</div>
 ${tablePanel("Catálogo de productos",["Producto","Categoría","Precio de venta","Existencias","Estado","Acciones"],rows,`<div class="search-wrap"><span class="search-symbol">⌕</span><input class="search-input" id="productSearch" placeholder="Buscar producto..." aria-label="Buscar producto"></div>${btn("＋ Agregar","new-product","primary")}`)}`;
}
function renderCategories(){
 const rows=state.categories.map(c=>`<tr><td><div class="product-cell"><div class="product-thumb">◈</div><div><strong>${esc(c.nombre)}</strong><small>ID ${c.id}</small></div></div></td><td>${esc(c.descripcion||"—")}</td><td>${state.products.filter(p=>p.categoria===c.nombre).length}</td><td><div class="row-actions"><button class="table-action" data-action="edit-category" data-id="${c.id}" title="Editar">✎</button><button class="table-action" data-action="delete-category" data-id="${c.id}" title="Eliminar">×</button></div></td></tr>`).join("");
 return `${heading("Categorías",pageMeta.categories[1],btn("+ Nueva categoría","new-category"))}${tablePanel("Categorías registradas",["Categoría","Descripción","Productos asociados","Acciones"],rows)}`;
}
function renderCustomers(){
 const rows=state.customers.map(c=>`<tr><td><div class="product-cell"><div class="avatar">${esc(c.nombre.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase())}</div><div><strong>${esc(c.nombre)}</strong><small>${esc(c.correo||"Sin correo")}</small></div></div></td><td>${esc(c.nit||"—")}</td><td>${esc(c.telefono||"—")}</td><td>${esc(c.direccion||"—")}</td><td><div class="row-actions"><button class="table-action" data-action="edit-customer" data-id="${c.id}" title="Editar">✎</button><button class="table-action" data-action="delete-customer" data-id="${c.id}" title="Eliminar">×</button></div></td></tr>`).join("");
 return `${heading("Clientes",pageMeta.customers[1],btn("+ Nuevo cliente","new-customer"))}${tablePanel("Directorio de clientes",["Cliente","NIT","Teléfono","Dirección","Acciones"],rows,`<div class="search-wrap"><span class="search-symbol">⌕</span><input class="search-input" id="customerSearch" placeholder="Buscar cliente..." aria-label="Buscar cliente"></div>`)}`;
}
function renderSuppliers(){
 const rows=state.suppliers.map(s=>`<tr><td><div class="product-cell"><div class="product-thumb">▧</div><div><strong>${esc(s.nombre)}</strong><small>${esc(s.correo||"Sin correo")}</small></div></div></td><td>${esc(s.nit||"—")}</td><td>${esc(s.contacto||"—")}</td><td>${esc(s.telefono||"—")}</td><td><div class="row-actions"><button class="table-action" data-action="edit-supplier" data-id="${s.id}" title="Editar">✎</button><button class="table-action" data-action="delete-supplier" data-id="${s.id}" title="Eliminar">×</button></div></td></tr>`).join("");
 return `${heading("Proveedores",pageMeta.suppliers[1],btn("+ Nuevo proveedor","new-supplier"))}${tablePanel("Directorio de proveedores",["Proveedor","NIT","Contacto","Teléfono","Acciones"],rows)}`;
}
function renderSales(){
 const rows=state.sales.map(s=>`<tr><td><strong>#${s.id}</strong></td><td>${dateLabel(s.fecha)}</td><td>${esc(s.cliente)}</td><td>${esc(s.metodo)}</td><td><strong>${money(s.total)}</strong></td><td>${badge(s.estado)}</td><td><button class="table-action" data-action="view-sale" data-id="${s.id}" title="Ver detalle">↗</button></td></tr>`).join("");
 return `${heading("Ventas",pageMeta.sales[1],btn("+ Nueva venta","go-pos"))}<div class="stats-grid">${stat("Ventas registradas",state.sales.length,"Operaciones de demostración","↗","icon-purple")}${stat("Total acumulado",money(state.sales.reduce((a,s)=>a+s.total,0)),"Suma del historial cargado","＄","icon-green")}${stat("Ticket promedio",money(state.sales.length?state.sales.reduce((a,s)=>a+s.total,0)/state.sales.length:0),"Promedio por venta","▤","icon-blue")}${stat("Última venta",state.sales.length?"#"+state.sales[0].id:"—","Identificador más reciente","◷","icon-orange")}</div>${tablePanel("Historial de ventas",["No. venta","Fecha","Cliente","Método de pago","Total","Estado","Detalle"],rows)}`;
}
function renderInventory(){
 const rows=state.products.map(p=>`<tr><td><div class="product-cell"><div class="product-thumb">${iconFor(p.categoria)}</div><div><strong>${esc(p.nombre)}</strong><small>${esc(p.codigo)}</small></div></div></td><td>${esc(p.categoria)}</td><td>${p.stock}</td><td>${p.stock<=5?badge(p.stock===0?"Agotado":"Bajo"):badge("Disponible")}</td><td>${money(p.costo*p.stock)}</td><td><button class="table-action" data-action="edit-product" data-id="${p.id}" title="Ajustar existencias">✎</button></td></tr>`).join("");
 return `${heading("Inventario",pageMeta.inventory[1],btn("+ Registrar producto","new-product"))}<div class="stats-grid">${stat("Unidades en stock",state.products.reduce((a,p)=>a+p.stock,0),"Suma de existencias","▦","icon-blue")}${stat("Productos con stock bajo",state.products.filter(p=>p.stock>0&&p.stock<=5).length,"5 unidades o menos","⚑","icon-orange")}${stat("Productos agotados",state.products.filter(p=>p.stock===0).length,"Sin existencias","!","icon-purple")}${stat("Valor estimado",money(state.products.reduce((a,p)=>a+p.costo*p.stock,0)),"Costo por unidades registradas","＄","icon-green")}</div>${tablePanel("Existencias por producto",["Producto","Categoría","Unidades","Estado","Valor al costo","Acciones"],rows)}`;
}
function renderPurchases(){
 const rows=state.purchases.map(p=>`<tr><td>#${p.id}</td><td>${dateLabel(p.fecha)}</td><td>${esc(p.proveedor)}</td><td>${esc(p.detalle)}</td><td>${money(p.total)}</td><td>${badge(p.estado)}</td></tr>`).join("");
 return `${heading("Compras",pageMeta.purchases[1],btn("+ Registrar compra","new-purchase"))}<div class="notice">El registro de compra aquí es una demostración de interfaz. La API deberá validar proveedor, productos, cantidades y actualizar inventario en una transacción.</div>${tablePanel("Historial de compras",["No. compra","Fecha","Proveedor","Detalle","Total","Estado"],rows)}`;
}
function renderCash(){
 const cashContent=state.cash.open?`<div class="cash-state"><span class="status-dot"></span> Caja abierta · lista para operar</div><div class="report-cards" style="margin-top:18px"><div class="report-card"><span>Monto inicial</span><strong>${money(state.cash.initial)}</strong><p>Fondo registrado al abrir</p></div><div class="report-card"><span>Ventas en efectivo de demostración</span><strong>${money(state.sales.filter(s=>s.metodo==="Efectivo").reduce((a,s)=>a+s.total,0))}</strong><p>Debe calcularlo el backend en producción</p></div><div class="report-card"><span>Estado</span><strong>Abierta</strong><p>Recuerda cerrar la caja al finalizar</p></div></div><div class="panel" style="margin-top:18px"><h2>Cierre de caja</h2><p class="page-subtitle" style="margin:8px 0 16px">Ingresa el monto contado al finalizar el turno.</p><div class="form-field" style="max-width:320px"><label for="cashFinal">Monto final contado (Q)</label><input class="field-input" id="cashFinal" type="number" min="0" step=".01" placeholder="0.00"></div><div style="margin-top:15px">${btn("Cerrar caja","close-cash","primary")}</div></div>`:`<div class="panel"><div class="stat-icon icon-purple" style="margin-bottom:16px">▣</div><h2>No hay una caja abierta</h2><p class="page-subtitle" style="margin:8px 0 20px">Para iniciar las operaciones del día, registra el monto inicial disponible.</p><div class="form-field" style="max-width:340px"><label for="cashInitial">Monto inicial (Q) <span style="color:var(--red)">*</span></label><input class="field-input" id="cashInitial" type="number" min="0" step=".01" placeholder="Ej. 500.00"></div><div style="margin-top:16px">${btn("Abrir caja","open-cash","primary")}</div></div>`;
 return `${heading("Control de caja",pageMeta.cash[1])}${cashContent}<div class="notice" style="margin-top:18px">En producción, la API debe impedir ventas si la caja está cerrada y guardar cada apertura, cierre y movimiento en la base de datos.</div>`;
}
function renderInvoices(){
 const rows=state.sales.map(s=>`<tr><td><strong>FAC-${s.id}</strong></td><td>${dateLabel(s.fecha)}</td><td>${esc(s.cliente)}</td><td>${esc(s.metodo)}</td><td>${money(s.total)}</td><td>${badge("Completada")}</td><td><button class="table-action" data-action="print-invoice" data-id="${s.id}" title="Vista de impresión">▤</button></td></tr>`).join("");
 return `${heading("Facturas y documentos",pageMeta.invoices[1])}<div class="notice">Esta pantalla muestra documentos ilustrativos. La validez fiscal y la generación definitiva de facturas deben resolverse según los requisitos del negocio y desde el backend.</div>${tablePanel("Documentos de venta",["Documento","Fecha","Cliente","Forma de pago","Total","Estado","Acción"],rows)}`;
}
function renderReports(){
 const total=state.sales.reduce((a,s)=>a+s.total,0);
 return `${heading("Reportes",pageMeta.reports[1],btn("Exportar CSV","export-sales","secondary"))}<div class="report-cards"><div class="report-card"><span>Ventas acumuladas (demo)</span><strong>${money(total)}</strong><p>De las ventas visibles en este prototipo</p></div><div class="report-card"><span>Productos activos</span><strong>${state.products.filter(p=>p.estado==="Activo").length}</strong><p>Productos marcados como activos</p></div><div class="report-card"><span>Existencias valorizadas</span><strong>${money(state.products.reduce((a,p)=>a+p.costo*p.stock,0))}</strong><p>Estimación al costo registrado</p></div></div><div class="panel" style="margin-top:18px"><div class="panel-header"><div><h2>Resumen de ventas</h2><p>Consulta de ejemplo calculada con datos locales</p></div></div><div class="report-cards"><div class="report-card"><span>Número de ventas</span><strong>${state.sales.length}</strong></div><div class="report-card"><span>Ticket promedio</span><strong>${money(state.sales.length?total/state.sales.length:0)}</strong></div><div class="report-card"><span>Ventas completadas</span><strong>${state.sales.filter(s=>s.estado==="Completada").length}</strong></div></div></div>`;
}
function renderUsers(){
 return `${heading("Usuarios y roles",pageMeta.users[1])}<div class="notice">La administración real de usuarios, permisos, autenticación y RLS debe implementarse en el backend/Supabase. Estos perfiles solo documentan la interfaz prevista.</div><div class="section-grid"><div class="role-card"><div class="stat-icon icon-purple" style="margin-bottom:14px">♙</div><h3>Administrador</h3><p>Acceso de administración a catálogos, compras, ventas, caja y reportes.</p><div class="role-permissions"><span>Productos</span><span>Compras</span><span>Ventas</span><span>Caja</span><span>Reportes</span></div></div><div class="role-card"><div class="stat-icon icon-green" style="margin-bottom:14px">▣</div><h3>Cajero</h3><p>Realiza ventas, registra clientes y opera su caja asignada.</p><div class="role-permissions"><span>Punto de venta</span><span>Clientes</span><span>Facturas</span><span>Su caja</span></div></div><div class="role-card"><div class="stat-icon icon-blue" style="margin-bottom:14px">▦</div><h3>Inventario</h3><p>Administra productos, proveedores, compras e inventario.</p><div class="role-permissions"><span>Productos</span><span>Proveedores</span><span>Compras</span><span>Inventario</span></div></div></div>`;
}
function renderPOS(){
 const products=state.products.filter(p=>p.stock>0&&p.estado==="Activo");
 const catalog=products.map(p=>`<button class="pos-product" data-action="add-cart" data-id="${p.id}"><div class="pos-product-icon">${iconFor(p.categoria)}</div><strong>${esc(p.nombre)}</strong><small>${esc(p.codigo)} · Stock: ${p.stock}</small><div class="pos-product-bottom"><b>${money(p.precio)}</b><span class="add-plus">+</span></div></button>`).join("");
 const cart=state.cart.map(item=>{const p=state.products.find(x=>x.id===item.id);if(!p)return "";return `<div class="cart-item"><div class="activity-icon">${iconFor(p.categoria)}</div><div class="cart-item-copy"><strong>${esc(p.nombre)}</strong><small>${money(p.precio)} c/u</small><div class="qty-control" style="margin-top:7px"><button data-action="qty-minus" data-id="${p.id}">−</button><span>${item.qty}</span><button data-action="qty-plus" data-id="${p.id}">+</button></div></div><div class="cart-item-price">${money(p.precio*item.qty)}</div></div>`}).join("");
 const subtotal=state.cart.reduce((a,item)=>{const p=state.products.find(x=>x.id===item.id);return a+(p?p.precio*item.qty:0)},0);
 return `${heading("Punto de venta",pageMeta.pos[1],`<span class="cash-state">${state.cash.open?"● Caja abierta":"● Caja cerrada"}</span>`)}${!state.cash.open?'<div class="notice">La caja está cerrada. Para completar una venta de demostración, abre la caja desde el módulo Control de caja.</div>':""}<div class="pos-layout"><div><div class="panel-header"><div><h2>Selecciona productos</h2><p>Haz clic en un producto para agregarlo al carrito.</p></div><div class="search-wrap"><span class="search-symbol">⌕</span><input class="search-input" id="posSearch" placeholder="Buscar producto..." aria-label="Buscar producto"></div></div><div class="pos-products" id="posProductGrid">${catalog||'<div class="empty-state">No hay productos disponibles.</div>'}</div></div><div class="panel cart-panel"><div class="panel-header"><div><h2>Venta actual</h2><p>${state.cart.length} tipo(s) de producto</p></div><button class="btn btn-secondary btn-small" data-action="clear-cart">Vaciar</button></div><div class="cart-items">${cart||'<div class="empty-state"><strong>Tu carrito está vacío</strong><p>Selecciona productos para comenzar.</p></div>'}</div><div class="cart-totals"><div class="total-line"><span>Subtotal</span><span>${money(subtotal)}</span></div><div class="total-line"><span>Impuestos</span><span>Incluidos en precios (demo)</span></div><div class="total-line final"><span>Total</span><span>${money(subtotal)}</span></div><label class="payment-label" for="paymentMethod">Método de pago</label><select class="field-select" id="paymentMethod"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select><label class="payment-label" for="saleCustomer">Cliente</label><select class="field-select" id="saleCustomer">${state.customers.map(c=>`<option value="${c.id}">${esc(c.nombre)}</option>`).join("")}</select><button class="btn btn-primary full-width" data-action="checkout" style="margin-top:16px" ${!state.cart.length?"disabled":""}>Cobrar ${money(subtotal)} →</button></div></div>`;
}
function render(){
 const renderers={dashboard:renderDashboard,pos:renderPOS,products:renderProducts,categories:renderCategories,customers:renderCustomers,suppliers:renderSuppliers,purchases:renderPurchases,sales:renderSales,inventory:renderInventory,cash:renderCash,invoices:renderInvoices,reports:renderReports,users:renderUsers};
 content.innerHTML=(renderers[state.view]||renderDashboard)();
 const ps=document.getElementById("productSearch");if(ps)ps.addEventListener("input",e=>{const q=e.target.value.toLowerCase();const filtered=state.products.filter(p=>(p.nombre+" "+p.codigo+" "+p.categoria).toLowerCase().includes(q));document.querySelector("tbody").innerHTML=productRows(filtered)||`<tr><td colspan="6"><div class="empty-state">No se encontraron productos.</div></td></tr>`;});
 const cs=document.getElementById("customerSearch");if(cs)cs.addEventListener("input",e=>{const q=e.target.value.toLowerCase();const rows=state.customers.filter(c=>(c.nombre+" "+c.nit+" "+c.telefono).toLowerCase().includes(q)).map(c=>`<tr><td>${esc(c.nombre)}</td><td>${esc(c.nit||"—")}</td><td>${esc(c.telefono||"—")}</td><td>${esc(c.direccion||"—")}</td><td>—</td></tr>`).join("");document.querySelector("tbody").innerHTML=rows||`<tr><td colspan="5"><div class="empty-state">No se encontraron clientes.</div></td></tr>`;});
 const posSearch=document.getElementById("posSearch");if(posSearch)posSearch.addEventListener("input",e=>{const q=e.target.value.toLowerCase();document.querySelectorAll(".pos-product").forEach(card=>card.hidden=!card.textContent.toLowerCase().includes(q));});
}

const formSchemas={
 product:{key:"products",title:"producto",fields:[["codigo","Código del producto","text",true],["nombre","Nombre del producto","text",true],["categoria","Categoría","select",true],["precio","Precio de venta (Q)","number",true],["costo","Costo (Q)","number",true],["stock","Existencias iniciales","number",true],["estado","Estado","select",true]]},
 customer:{key:"customers",title:"cliente",fields:[["nombre","Nombre completo","text",true],["nit","NIT","text",false],["telefono","Teléfono","tel",false],["correo","Correo electrónico","email",false],["direccion","Dirección","text",false]]},
 supplier:{key:"suppliers",title:"proveedor",fields:[["nombre","Nombre del proveedor","text",true],["nit","NIT","text",false],["contacto","Persona de contacto","text",false],["telefono","Teléfono","tel",false],["correo","Correo electrónico","email",false]]},
 category:{key:"categories",title:"categoría",fields:[["nombre","Nombre de categoría","text",true],["descripcion","Descripción","text",false]]},
 purchase:{key:"purchases",title:"compra",fields:[["proveedor","Proveedor","select",true],["producto","Producto","select",true],["cantidad","Cantidad","number",true],["fecha","Fecha de compra","date",true],["observaciones","Observaciones","text",false]]}
};
let activeModal={type:null,id:null};
function openModal(type,id=null){
 const schema=formSchemas[type];if(!schema)return;
 activeModal={type,id};
 const record=id?state[schema.key].find(x=>x.id===Number(id)):null;
 document.getElementById("modalEyebrow").textContent=id?"EDITAR REGISTRO":"NUEVO REGISTRO";
 document.getElementById("modalTitle").textContent=(id?"Editar ":"Nuevo ")+schema.title;
 const fields=schema.fields.map(([name,label,typeInput,required])=>{
   let inputType=typeInput,opts="";
   if(type==="product"&&name==="categoria"){inputType="select";opts=state.categories.map(c=>`<option ${record?.categoria===c.nombre?"selected":""}>${esc(c.nombre)}</option>`).join("");}
   else if(type==="product"&&name==="estado"){inputType="select";opts=["Activo","Inactivo"].map(v=>`<option ${record?.estado===v?"selected":""}>${v}</option>`).join("");}
   else if(type==="purchase"&&name==="proveedor"){inputType="select";opts=state.suppliers.map(s=>`<option>${esc(s.nombre)}</option>`).join("");}
   else if(type==="purchase"&&name==="producto"){inputType="select";opts=state.products.map(p=>`<option>${esc(p.nombre)}</option>`).join("");}
   let value=record?.[name]??(name==="estado"?"Activo":name==="stock"||name==="costo"||name==="precio"||name==="cantidad"?"0":name==="fecha"?new Date().toISOString().slice(0,10):"");
   const field=`<div class="form-field ${name==="direccion"||name==="observaciones"?"span-2":""}"><label for="field_${name}">${label}${required?' <span>*</span>':""}</label>${inputType==="select"?`<select class="field-select" id="field_${name}" name="${name}" ${required?"required":""}>${opts}</select>`:`<input class="field-input" id="field_${name}" name="${name}" type="${inputType}" value="${esc(value)}" ${required?"required":""} ${inputType==="number"?'min="0" step="0.01"':""}>`}</div>`;
   return field;
 }).join("");
 document.getElementById("modalFields").innerHTML=fields;
 document.getElementById("recordDialog").showModal();
}
function closeModal(){document.getElementById("recordDialog").close();activeModal={type:null,id:null}}
function saveModal(e){
 e.preventDefault();const {type,id}=activeModal,schema=formSchemas[type];if(!schema)return;
 const fd=new FormData(e.target),record={};schema.fields.forEach(([name,label,t])=>record[name]=fd.get(name));
 ["precio","costo","stock","cantidad"].forEach(k=>{if(record[k]!==undefined)record[k]=Number(record[k])});
 if(type==="product"&&record.precio<0){toast("El precio no puede ser negativo.","error");return}
 if(type==="purchase"){
  const product=state.products.find(p=>p.nombre===record.producto);
  if(!product){toast("Selecciona un producto válido.","error");return}
  record.id=nextId("purchases");record.total=product.costo*record.cantidad;record.detalle=`${record.producto} × ${record.cantidad}`;record.estado="Completada";
  product.stock+=record.cantidad;state.purchases.unshift(record);
 }else if(id){Object.assign(state[schema.key].find(x=>x.id===Number(id)),record)}
 else{record.id=nextId(schema.key);if(type==="product"&&!record.codigo)record.codigo="PRD-"+String(record.id).padStart(3,"0");state[schema.key].unshift(record)}
 closeModal();render();toast(type==="purchase"?"Compra de demostración registrada y existencias actualizadas.":"Registro guardado en la vista de demostración.");
}
function deleteRecord(key,id,label){
 const item=state[key].find(x=>x.id===Number(id));if(!item)return;
 if(!confirm(`¿Seguro que deseas eliminar ${label} "${item.nombre||item.codigo}" de los datos locales de demostración?`))return;
 state[key]=state[key].filter(x=>x.id!==Number(id));render();toast("Registro eliminado de la demostración.");
}
function addCart(id){
 const p=state.products.find(x=>x.id===Number(id));if(!p)return;
 const item=state.cart.find(x=>x.id===p.id);
 if(item){if(item.qty>=p.stock){toast("No hay existencias suficientes.","error");return}item.qty++}
 else state.cart.push({id:p.id,qty:1});
 render();
}
function checkout(){
 if(!state.cash.open){toast("Primero debes abrir la caja.","error");return}
 if(!state.cart.length)return;
 const items=state.cart.map(i=>({product:state.products.find(p=>p.id===i.id),qty:i.qty}));
 if(items.some(i=>!i.product||i.qty>i.product.stock)){toast("Revisa las existencias de los productos.","error");return}
 const total=items.reduce((a,i)=>a+i.product.precio*i.qty,0);
 const customer=state.customers.find(c=>c.id===Number(document.getElementById("saleCustomer").value))||state.customers[0];
 const sale={id:nextId("sales"),fecha:new Date().toISOString().slice(0,10),cliente:customer?.nombre||"Cliente General",metodo:document.getElementById("paymentMethod").value,total,estado:"Completada"};
 items.forEach(i=>i.product.stock-=i.qty);state.sales.unshift(sale);state.cart=[];render();toast(`Venta #${sale.id} registrada en demostración por ${money(total)}.`);
}
function exportSales(){
 const rows=[["id","fecha","cliente","metodo_pago","total","estado"],...state.sales.map(s=>[s.id,s.fecha,s.cliente,s.metodo,s.total,s.estado])];
 const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");
 const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="reporte-ventas-demo.csv";a.click();URL.revokeObjectURL(url);toast("Reporte CSV descargado.");
}
function printInvoice(id){
 const s=state.sales.find(x=>x.id===Number(id));if(!s)return;
 const win=window.open("","_blank","width=700,height=700");if(!win){toast("Permite las ventanas emergentes para ver la factura.","error");return}
 win.document.write(`<html lang="es"><head><title>Factura FAC-${s.id}</title><style>body{font:14px Arial;padding:40px;color:#222}h1{color:#555}table{width:100%;margin-top:25px;border-collapse:collapse}td{padding:12px;border-bottom:1px solid #ddd}.total{text-align:right;font-size:20px;font-weight:bold;margin-top:30px}</style></head><body><h1>NovaPOS</h1><h2>Documento de venta de demostración</h2><p><b>Factura:</b> FAC-${s.id}</p><p><b>Fecha:</b> ${dateLabel(s.fecha)}</p><p><b>Cliente:</b> ${esc(s.cliente)}</p><table><tr><td>Venta registrada</td><td>${esc(s.metodo)}</td></tr></table><div class="total">Total: ${money(s.total)}</div><p>Documento ilustrativo sin validez fiscal.</p><script>window.print()<\/script></body></html>`);win.document.close();
}
content.addEventListener("click",e=>{
 const b=e.target.closest("[data-action]");if(!b)return;const a=b.dataset.action,id=b.dataset.id;
 if(a==="go-pos")navTo("pos");else if(a==="go-sales")navTo("sales");
 else if(a==="new-product")openModal("product");else if(a==="edit-product")openModal("product",id);else if(a==="delete-product")deleteRecord("products",id,"el producto");
 else if(a==="new-customer")openModal("customer");else if(a==="edit-customer")openModal("customer",id);else if(a==="delete-customer")deleteRecord("customers",id,"el cliente");
 else if(a==="new-supplier")openModal("supplier");else if(a==="edit-supplier")openModal("supplier",id);else if(a==="delete-supplier")deleteRecord("suppliers",id,"el proveedor");
 else if(a==="new-category")openModal("category");else if(a==="edit-category")openModal("category",id);else if(a==="delete-category")deleteRecord("categories",id,"la categoría");
 else if(a==="new-purchase")openModal("purchase");
 else if(a==="add-cart")addCart(id);
 else if(a==="qty-minus"){const i=state.cart.find(x=>x.id===Number(id));if(i){i.qty--;if(i.qty<=0)state.cart=state.cart.filter(x=>x.id!==Number(id));render()}}
 else if(a==="qty-plus"){const i=state.cart.find(x=>x.id===Number(id)),p=state.products.find(x=>x.id===Number(id));if(i&&p){if(i.qty<p.stock)i.qty++;else toast("No hay existencias suficientes.","error");render()}}
 else if(a==="clear-cart"){state.cart=[];render()}
 else if(a==="checkout")checkout();
 else if(a==="open-cash"){const value=Number(document.getElementById("cashInitial")?.value);if(!Number.isFinite(value)||value<0||document.getElementById("cashInitial").value===""){toast("Ingresa un monto inicial válido.","error");return}state.cash={open:true,initial:value,final:null};render();toast("Caja abierta en modo demostración.")}
 else if(a==="close-cash"){const value=Number(document.getElementById("cashFinal")?.value);if(!Number.isFinite(value)||value<0||document.getElementById("cashFinal").value===""){toast("Ingresa el monto final contado.","error");return}state.cash.final=value;state.cash.open=false;render();toast(`Caja cerrada en demostración. Monto contado: ${money(value)}.`)}
 else if(a==="view-sale"){const s=state.sales.find(x=>x.id===Number(id));if(s)toast(`Venta #${s.id}: ${s.cliente} · ${money(s.total)} · ${s.metodo}`)}
 else if(a==="print-invoice")printInvoice(id);
 else if(a==="export-sales")exportSales();
});
render();

/* Ejemplo de función para integrar con la API del equipo.
   Usar desde las funciones de carga/guardado cuando el backend esté listo. */
async function apiRequest(path, options={}){
 if(!API_BASE_URL)throw new Error("Configura API_BASE_URL antes de llamar a la API.");
 const response=await fetch(`${API_BASE_URL}${path}`,{
  ...options,
  headers:{"Content-Type":"application/json",...(options.headers||{})},
  credentials:"include"
 });
 if(!response.ok){
  let message=`Error HTTP ${response.status}`;
  try{const body=await response.json();message=body.message||body.error||message}catch(_){}
  throw new Error(message);
 }
 if(response.status===204)return null;
 return response.json();
}
// Ejemplo de uso al integrar: apiRequest("/api/v1/productos")
