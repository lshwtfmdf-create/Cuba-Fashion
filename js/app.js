import { Store } from "./data.js";

const ADMIN_EMAIL = "admin@cuban-fashioner.com";
const ADMIN_PASSWORD = "Cuba2026!";
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f1'/%3E%3Crect x='130' y='80' width='140' height='140' rx='18' fill='%23d9e9db'/%3E%3Cpath d='M205 101l-30 52h23l-5 45 37-59h-25z' fill='%234e9961'/%3E%3Ctext x='200' y='253' text-anchor='middle' font-family='Arial' font-size='14' fill='%237b887e'%3EBater%C3%ADa para laptop%3C/text%3E%3C/svg%3E";

const $ = selector => document.querySelector(selector);
const productGrid = $("#product-grid");
const modalBackdrop = $("#modal-backdrop");
const productModal = $("#product-modal");
const authModal = $("#auth-modal");
const orderModal = $("#order-modal");
const cartDrawer = $("#cart-drawer");
const toast = $("#toast");

let products = Store.getProducts();
let cart = Store.getCart();
let customer = Store.getCustomer();
let activeModal = null;
let toastTimeout;

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function safeImage(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return ["http:", "https:", "data:"].includes(parsed.protocol) ? parsed.href : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value) || 0);
}

function persistProducts() {
  Store.saveProducts(products);
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function setPageMode(admin) {
  document.body.classList.toggle("admin-mode", admin);
  document.querySelector("body > .announcement").classList.toggle("hidden", admin);
  document.querySelector("body > .site-header").classList.toggle("hidden", admin);
  document.querySelector("body > main:not(.admin-page)").classList.toggle("hidden", admin);
  document.querySelector("body > .site-footer").classList.toggle("hidden", admin);
  $("#admin-page").classList.toggle("hidden", !admin);
  if (admin) renderAdmin();
  else renderProducts();
}

function renderProducts() {
  const query = $("#search-input").value.trim().toLowerCase();
  const availability = $("#availability-filter").value;
  const visible = products.filter(product => {
    const matchesQuery = `${product.name} ${product.brand} ${product.specs}`.toLowerCase().includes(query);
    const matchesAvailability = availability === "all" || (availability === "available" ? product.stock : !product.stock);
    return matchesQuery && matchesAvailability;
  });
  $("#result-count").textContent = `${visible.length} ${visible.length === 1 ? "producto" : "productos"}`;
  $("#empty-state").classList.toggle("hidden", visible.length > 0);
  productGrid.classList.toggle("hidden", visible.length === 0);
  productGrid.innerHTML = visible.map(product => `
    <article class="product-card ${product.stock ? "" : "sold-out-card"}" data-product-id="${escapeHTML(product.id)}" tabindex="0" role="button" aria-label="Ver detalles de ${escapeHTML(product.name)}">
      <div class="product-image-wrap">
        <img class="product-image" src="${escapeHTML(safeImage(product.image))}" alt="${escapeHTML(product.name)}" loading="lazy">
        <span class="stock-pill ${product.stock ? "" : "sold-out"}">${product.stock ? "En stock" : "Agotado"}</span>
      </div>
      <div class="product-info">
        <div class="product-brand">${escapeHTML(product.brand)}</div>
        <h3>${escapeHTML(product.name)}</h3>
        <div class="product-price-row"><span class="product-price">${formatPrice(product.price)} <small>USD</small></span><span class="card-arrow">↗</span></div>
      </div>
    </article>`).join("");
  productGrid.querySelectorAll("img").forEach(image => image.addEventListener("error", () => { image.src = FALLBACK_IMAGE; image.classList.add("fallback-image"); }, { once: true }));
  if (customer?.role !== "admin") {
    $("#account-label").textContent = customer?.name ? customer.name.split(" ")[0] : "Iniciar sesión";
  }
  updateCartBadge();
}

function openDialog(element) {
  closeDrawer(false);
  activeModal = element;
  modalBackdrop.classList.remove("hidden");
  element.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  const focusable = element.querySelector("button, input, textarea, select");
  focusable?.focus();
}

function closeModal() {
  [productModal, authModal, orderModal].forEach(modal => modal.classList.add("hidden"));
  activeModal = null;
  if (cartDrawer.classList.contains("hidden")) {
    modalBackdrop.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

function showProduct(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;
  productModal.innerHTML = `
    <div class="product-modal-layout">
      <div class="product-modal-image"><img src="${escapeHTML(safeImage(product.image))}" alt="${escapeHTML(product.name)}"><span class="stock-pill ${product.stock ? "" : "sold-out"}">${product.stock ? "En stock" : "Agotado"}</span></div>
      <div class="modal-details">
        <button class="modal-close" data-close type="button" aria-label="Cerrar">×</button>
        <div class="modal-brand">${escapeHTML(product.brand)} · BATERÍA PARA LAPTOP</div>
        <h2 id="product-modal-title">${escapeHTML(product.name)}</h2>
        <p class="modal-description">Energía confiable para que tu equipo siga el ritmo de tu día.</p>
        <div class="compatibility"><strong>Especificaciones y compatibilidad</strong><p>${escapeHTML(product.specs)}</p></div>
        <div class="modal-price">${formatPrice(product.price)} <small>USD</small></div>
        <button class="button button-primary modal-add" data-add="${escapeHTML(product.id)}" type="button" ${product.stock ? "" : "disabled"}>${product.stock ? "Agregar al carrito" : "Producto agotado"} <span>＋</span></button>
      </div>
    </div>`;
  productModal.querySelector("img").addEventListener("error", event => { event.currentTarget.src = FALLBACK_IMAGE; });
  openDialog(productModal);
}

function updateCartBadge() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  $("#cart-count").textContent = String(count);
  $("#drawer-count").textContent = count ? `(${count})` : "";
}

function renderCart() {
  const normalizedCart = cart.filter(item => products.some(product => product.id === item.id && product.stock));
  if (normalizedCart.length !== cart.length) {
    cart = normalizedCart;
    Store.saveCart(cart);
  }
  const items = cart.map(item => {
    const product = products.find(entry => entry.id === item.id);
    if (!product) return "";
    return `<article class="cart-item">
      <img src="${escapeHTML(safeImage(product.image))}" alt="${escapeHTML(product.name)}">
      <div class="cart-item-info"><strong>${escapeHTML(product.name)}</strong><small>${formatPrice(product.price)} c/u</small>
        <div class="quantity-control"><button data-quantity="${escapeHTML(product.id)}" data-delta="-1" type="button" aria-label="Reducir cantidad">−</button><span>${item.quantity}</span><button data-quantity="${escapeHTML(product.id)}" data-delta="1" type="button" aria-label="Aumentar cantidad">+</button></div>
      </div><div class="cart-item-price">${formatPrice(product.price * item.quantity)}<button class="remove-item" data-remove="${escapeHTML(product.id)}" type="button">Quitar</button></div>
    </article>`;
  }).join("");
  $("#cart-items").innerHTML = items;
  $("#cart-empty").classList.toggle("hidden", cart.length > 0);
  $("#cart-summary").classList.toggle("hidden", cart.length === 0);
  const total = cart.reduce((sum, item) => sum + (products.find(product => product.id === item.id)?.price || 0) * item.quantity, 0);
  $("#cart-total").textContent = formatPrice(total);
  updateCartBadge();
}

function addToCart(productId) {
  const product = products.find(item => item.id === productId);
  if (!product?.stock) return;
  const existing = cart.find(item => item.id === productId);
  if (existing) existing.quantity += 1;
  else cart.push({ id: productId, quantity: 1 });
  Store.saveCart(cart);
  closeModal();
  renderCart();
  notify(`${product.name} agregado al carrito`);
}

function openCart() {
  closeModal();
  renderCart();
  cartDrawer.classList.remove("hidden");
  modalBackdrop.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  $("#cart-button").setAttribute("aria-expanded", "true");
}

function closeDrawer(restoreOverflow = true) {
  cartDrawer.classList.add("hidden");
  $("#cart-button").setAttribute("aria-expanded", "false");
  if (restoreOverflow && !activeModal) {
    modalBackdrop.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

function showAuth() {
  authModal.innerHTML = `
    <button class="modal-close" data-close type="button" aria-label="Cerrar">×</button>
    <div class="eyebrow"><span class="eyebrow-line"></span> BIENVENIDO</div>
    <h2 class="auth-heading" id="auth-title">Accede a tu cuenta</h2>
    <p class="auth-copy">Regístrate o inicia sesión para confirmar tu pedido. Usa tu correo o teléfono.</p>
    <form class="auth-form" id="customer-form">
      <label for="customer-name">Nombre completo</label><input id="customer-name" required maxlength="80" autocomplete="name" placeholder="Tu nombre">
      <label for="customer-contact">Correo electrónico o teléfono</label><input id="customer-contact" required maxlength="120" autocomplete="email" placeholder="nombre@gmail.com o +53...">
      <button class="button button-primary" type="submit">Continuar <span>→</span></button>
    </form>
    <div class="auth-divider">o</div>
    <button class="button admin-access" id="admin-login-button" type="button">♛ Acceso de administrador</button>
    <p class="auth-hint">Acceso de demostración: <strong>${ADMIN_EMAIL}</strong> · contraseña <strong>${ADMIN_PASSWORD}</strong></p>`;
  const contact = $("#customer-contact");
  if (customer?.role !== "admin") {
    $("#customer-name").value = customer?.name || "";
    contact.value = customer?.contact || "";
  }
  openDialog(authModal);
}

function showOrderConfirmation(order) {
  const json = JSON.stringify(order, null, 2);
  const message = [
    "Hola, quiero confirmar este pedido de Cuban Fashioner:",
    `Pedido: ${order.id}`,
    `Cliente: ${order.customer.name}`,
    `Contacto: ${order.customer.contact}`,
    "Productos:",
    ...order.products.map(item => `- ${item.name} x ${item.quantity} — ${formatPrice(item.unitPrice)} c/u`),
    `Total: ${formatPrice(order.total)} USD`,
    "Quedo pendiente para coordinar la recogida."
  ].join("\n");
  const whatsappUrl = `https://wa.me/5350727220?text=${encodeURIComponent(message)}`;
  orderModal.innerHTML = `
    <button class="modal-close" data-close type="button" aria-label="Cerrar">×</button>
    <div class="eyebrow"><span class="eyebrow-line"></span> PEDIDO REGISTRADO</div>
    <h2 id="order-title">¡Gracias por tu pedido!</h2>
    <p>Envía el resumen por WhatsApp para confirmar tu pedido y coordinar la recogida.</p>
    <pre class="order-json">${escapeHTML(json)}</pre>
    <div class="order-actions"><a class="button button-primary whatsapp-order" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">Enviar por WhatsApp <span>↗</span></a><button class="button button-outline" id="copy-order" type="button">Copiar JSON</button></div>`;
  openDialog(orderModal);
  $("#copy-order").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(json);
      notify("Resumen del pedido copiado");
    } catch (error) {
      console.error("No se pudo copiar el resumen del pedido.", error);
      notify("No se pudo copiar; selecciona el JSON para copiarlo.");
    }
  });
}

function confirmOrder() {
  if (!cart.length) return;
  if (!customer || customer.role !== "customer") {
    closeDrawer();
    showAuth();
    notify("Inicia sesión para confirmar el pedido");
    return;
  }
  const order = {
    id: `CF-${Date.now()}`,
    date: new Date().toISOString(),
    customer: { name: customer.name, contact: customer.contact },
    products: cart.map(item => {
      const product = products.find(entry => entry.id === item.id);
      return { name: product.name, quantity: item.quantity, unitPrice: Number(product.price) };
    }),
    total: Number(cart.reduce((sum, item) => sum + products.find(entry => entry.id === item.id).price * item.quantity, 0).toFixed(2))
  };
  const orders = Store.getOrders();
  orders.unshift(order);
  Store.saveOrders(orders);
  cart = [];
  Store.saveCart(cart);
  renderCart();
  closeDrawer();
  showOrderConfirmation(order);
}

function renderAdmin() {
  $("#admin-product-count").textContent = String(products.length);
  $("#inventory-count").textContent = `${products.length} ${products.length === 1 ? "producto" : "productos"}`;
  $("#admin-product-list").innerHTML = products.length ? products.map(product => `
    <article class="admin-product-row">
      <img src="${escapeHTML(safeImage(product.image))}" alt="">
      <div class="admin-product-text"><strong>${escapeHTML(product.name)}</strong><small>${formatPrice(product.price)} · <span class="admin-stock ${product.stock ? "available" : "unavailable"}">${product.stock ? "En stock" : "Agotado"}</span></small></div>
      <div class="admin-row-actions"><button data-edit="${escapeHTML(product.id)}" type="button">Editar</button><button data-stock="${escapeHTML(product.id)}" type="button">${product.stock ? "Agotar" : "Activar"}</button><button class="delete-product" data-delete="${escapeHTML(product.id)}" type="button" aria-label="Eliminar ${escapeHTML(product.name)}">×</button></div>
    </article>`).join("") : '<div class="admin-empty">Aún no hay productos. Agrega el primero con el formulario.</div>';
  $("#admin-product-list").querySelectorAll("img").forEach(image => image.addEventListener("error", () => { image.src = FALLBACK_IMAGE; }, { once: true }));
  const orders = Store.getOrders();
  $("#orders-count").textContent = `${orders.length} ${orders.length === 1 ? "pedido" : "pedidos"}`;
  $("#admin-orders").innerHTML = orders.length ? orders.map(order => `
    <article class="order-row"><div class="order-row-top"><div><strong>${escapeHTML(order.customer.name)}</strong><br><small>${escapeHTML(order.customer.contact)} · ${new Date(order.date).toLocaleString("es-ES")}</small></div><strong>${formatPrice(order.total)}</strong></div><p>${order.products.map(item => `${escapeHTML(item.name)} × ${item.quantity}`).join(" · ")}</p></article>`).join("") : '<div class="admin-empty">Los pedidos confirmados aparecerán aquí.</div>';
}

function resetProductForm() {
  $("#product-form").reset();
  $("#product-id").value = "";
  $("#product-stock").checked = true;
  $("#form-title").textContent = "Agregar producto";
  $("#save-product").innerHTML = 'Agregar al catálogo <span>＋</span>';
  $("#cancel-edit").classList.add("hidden");
}

function beginEdit(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;
  $("#product-id").value = product.id;
  $("#product-name").value = product.name;
  $("#product-brand").value = product.brand;
  $("#product-image").value = product.image || "";
  $("#product-specs").value = product.specs;
  $("#product-price").value = product.price;
  $("#product-stock").checked = product.stock;
  $("#form-title").textContent = "Editar producto";
  $("#save-product").innerHTML = 'Guardar cambios <span>✓</span>';
  $("#cancel-edit").classList.remove("hidden");
  $("#product-name").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("#search-input").addEventListener("input", renderProducts);
$("#availability-filter").addEventListener("change", renderProducts);
$("#clear-search").addEventListener("click", () => {
  $("#search-input").value = "";
  $("#availability-filter").value = "all";
  renderProducts();
});
productGrid.addEventListener("click", event => {
  const card = event.target.closest("[data-product-id]");
  if (card) showProduct(card.dataset.productId);
});
productGrid.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-product-id]")) {
    event.preventDefault();
    showProduct(event.target.dataset.productId);
  }
});
$("#account-button").addEventListener("click", () => {
  if (customer?.role === "admin") setPageMode(true);
  else if (customer?.role === "customer") {
    customer = null;
    Store.clearCustomer();
    renderProducts();
    notify("Has cerrado sesión");
  } else showAuth();
});
$("#cart-button").addEventListener("click", openCart);
$("#checkout-button").addEventListener("click", confirmOrder);
modalBackdrop.addEventListener("click", () => {
  closeModal();
  closeDrawer();
});
document.addEventListener("click", event => {
  const closeButton = event.target.closest("[data-close]");
  if (closeButton) {
    closeModal();
    closeDrawer();
    return;
  }
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    addToCart(addButton.dataset.add);
    return;
  }
  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) {
    const item = cart.find(entry => entry.id === quantityButton.dataset.quantity);
    if (!item) return;
    item.quantity += Number(quantityButton.dataset.delta);
    if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== item.id);
    Store.saveCart(cart);
    renderCart();
    return;
  }
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    cart = cart.filter(item => item.id !== removeButton.dataset.remove);
    Store.saveCart(cart);
    renderCart();
  }
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal();
    closeDrawer();
  }
});

authModal.addEventListener("submit", event => {
  if (event.target.id !== "customer-form") return;
  event.preventDefault();
  const name = $("#customer-name").value.trim();
  const contact = $("#customer-contact").value.trim();
  if (!name || !contact) return;
  customer = { name, contact, role: "customer" };
  Store.saveCustomer(customer);
  closeModal();
  renderProducts();
  notify(`Bienvenido/a, ${name.split(" ")[0]}`);
});
authModal.addEventListener("click", event => {
  if (event.target.id === "admin-login-button") {
    authModal.innerHTML = `
      <button class="modal-close" data-close type="button" aria-label="Cerrar">×</button>
      <div class="eyebrow"><span class="eyebrow-line"></span> ACCESO RESTRINGIDO</div>
      <h2 class="auth-heading" id="auth-title">Administración</h2><p class="auth-copy">Introduce las credenciales de administrador.</p>
      <form class="auth-form" id="admin-form"><label for="admin-email">Correo</label><input id="admin-email" type="email" autocomplete="username" required value="${ADMIN_EMAIL}"><label for="admin-password">Contraseña</label><input id="admin-password" type="password" autocomplete="current-password" required><button class="button button-primary" type="submit">Entrar al panel <span>→</span></button></form>
      <p class="auth-hint">Credenciales de demostración disponibles en la documentación del proyecto.</p>`;
    $("#admin-password").focus();
  }
});
authModal.addEventListener("submit", event => {
  if (event.target.id !== "admin-form") return;
  event.preventDefault();
  if ($("#admin-email").value.trim().toLowerCase() !== ADMIN_EMAIL || $("#admin-password").value !== ADMIN_PASSWORD) {
    notify("Correo o contraseña incorrectos");
    $("#admin-password").value = "";
    $("#admin-password").focus();
    return;
  }
  customer = { name: "Administrador", contact: ADMIN_EMAIL, role: "admin" };
  Store.saveCustomer(customer);
  closeModal();
  setPageMode(true);
});

$("#product-form").addEventListener("submit", event => {
  event.preventDefault();
  const id = $("#product-id").value;
  const product = {
    id: id || `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: $("#product-name").value.trim(),
    brand: $("#product-brand").value.trim(),
    image: $("#product-image").value.trim() || FALLBACK_IMAGE,
    specs: $("#product-specs").value.trim(),
    price: Number($("#product-price").value),
    stock: $("#product-stock").checked
  };
  if (!product.name || !product.brand || !product.specs || !Number.isFinite(product.price) || product.price <= 0) {
    notify("Completa los campos requeridos con datos válidos");
    return;
  }
  try {
    if (id) products = products.map(item => item.id === id ? product : item);
    else products = [product, ...products];
    persistProducts();
    resetProductForm();
    renderAdmin();
    renderProducts();
    notify(id ? "Producto actualizado" : "Producto agregado al catálogo");
  } catch (error) {
    notify(error.message);
  }
});
$("#cancel-edit").addEventListener("click", resetProductForm);
$("#admin-product-list").addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    beginEdit(editButton.dataset.edit);
    return;
  }
  const stockButton = event.target.closest("[data-stock]");
  if (stockButton) {
    products = products.map(product => product.id === stockButton.dataset.stock ? { ...product, stock: !product.stock } : product);
    persistProducts();
    renderAdmin();
    renderProducts();
    notify("Disponibilidad actualizada");
    return;
  }
  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton && window.confirm("¿Eliminar este producto del catálogo?")) {
    products = products.filter(product => product.id !== deleteButton.dataset.delete);
    cart = cart.filter(item => item.id !== deleteButton.dataset.delete);
    try {
      persistProducts();
      Store.saveCart(cart);
      renderAdmin();
      renderProducts();
      notify("Producto eliminado");
    } catch (error) {
      notify(error.message);
    }
  }
});
$("#back-to-store").addEventListener("click", () => setPageMode(false));
$("#admin-logout").addEventListener("click", () => {
  customer = null;
  Store.clearCustomer();
  setPageMode(false);
  notify("Has cerrado sesión");
});

$("#current-year").textContent = String(new Date().getFullYear());
renderProducts();
if (customer?.role === "admin") setPageMode(true);
