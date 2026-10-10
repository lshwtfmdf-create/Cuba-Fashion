import { Backend, Store, supabase, supabaseConfigured } from "./data.js";

const ADMIN_EMAIL = "cubanfashioner@gmail.com";
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f1'/%3E%3Crect x='130' y='80' width='140' height='140' rx='18' fill='%23d9e9db'/%3E%3Cpath d='M205 101l-30 52h23l-5 45 37-59h-25z' fill='%234e9961'/%3E%3Ctext x='200' y='253' text-anchor='middle' font-family='Arial' font-size='14' fill='%237b887e'%3EBater%C3%ADa para laptop%3C/text%3E%3C/svg%3E";

const $ = selector => document.querySelector(selector);
const productGrid = $("#product-grid");
const modalBackdrop = $("#modal-backdrop");
const brandModal = $("#brand-modal");
const productModal = $("#product-modal");
const authModal = $("#auth-modal");
const orderModal = $("#order-modal");
const cartDrawer = $("#cart-drawer");
const toast = $("#toast");

let products = Store.getDemoProducts();
let cart = Store.getCart();
let customer = null;
let orders = [];
let activeModal = null;
let activeBrandKey = null;
let overlayHistoryActive = false;
let toastTimeout;

function applyTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("dark-mode", dark);
  document.querySelectorAll("[data-theme-toggle]").forEach(button => {
    button.setAttribute("aria-pressed", String(dark));
    button.setAttribute("aria-label", dark ? "Activar modo claro" : "Activar modo oscuro");
    button.title = dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    const icon = button.querySelector(".theme-icon");
    const label = button.querySelector(".theme-label");
    if (icon) icon.textContent = dark ? "☀" : "☾";
    if (label) label.textContent = dark ? "Modo claro" : "Modo oscuro";
  });
}

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

function brandLogo(brand) {
  const logos = {
    acer: "acer.svg",
    asus: "asus.svg",
    dell: "dell.svg",
    hp: "hp.svg",
    lenovo: "lenovo.svg"
  };
  return logos[brand.trim().toLocaleLowerCase()] || "";
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function refreshAdmin() {
  renderAdmin().catch(error => {
    console.error("No se pudo cargar el panel de administración.", error);
    notify("No se pudo cargar la información del panel.");
  });
}

function isAdminAccount(user) {
  return user.email?.trim().toLowerCase() === ADMIN_EMAIL;
}

function setPageMode(admin) {
  document.body.classList.toggle("admin-mode", admin);
  document.querySelector("body > .announcement").classList.toggle("hidden", admin);
  document.querySelector("body > .site-header").classList.toggle("hidden", admin);
  document.querySelector("body > main:not(.admin-page)").classList.toggle("hidden", admin);
  document.querySelector("body > .site-footer").classList.toggle("hidden", admin);
  $("#admin-page").classList.toggle("hidden", !admin);
  if (admin) refreshAdmin();
  else renderProducts();
}

function trackOverlayInHistory(element) {
  const nestedBrandModel = overlayHistoryActive && activeModal === brandModal && element !== brandModal;
  const state = {
    ...window.history.state,
    cubanFashionerOverlay: true,
    cubanFashionerBrandKey: element === brandModal ? activeBrandKey : nestedBrandModel ? activeBrandKey : null
  };
  if (nestedBrandModel) window.history.pushState(state, "", window.location.href);
  else if (overlayHistoryActive) window.history.replaceState(state, "", window.location.href);
  else {
    window.history.pushState(state, "", window.location.href);
    overlayHistoryActive = true;
  }
}

function releaseOverlayHistory() {
  if (!overlayHistoryActive) return;
  overlayHistoryActive = false;
  window.history.back();
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
  $("#brand-list-heading").classList.toggle("hidden", visible.length === 0);
  productGrid.classList.toggle("hidden", visible.length === 0);
  const brandGroups = new Map();
  visible.forEach(product => {
    const key = product.brand.trim().toLocaleLowerCase();
    if (!brandGroups.has(key)) brandGroups.set(key, []);
    brandGroups.get(key).push(product);
  });
  productGrid.innerHTML = [...brandGroups.entries()]
    .sort((left, right) => left[1][0].brand.localeCompare(right[1][0].brand, "es"))
    .map(([brandKey, group]) => {
      const brand = group[0].brand;
      const logo = brandLogo(brand);
      return `
      <button class="brand-card" data-brand="${escapeHTML(brandKey)}" type="button" aria-label="Ver modelos de ${escapeHTML(group[0].brand)}">
        <span class="brand-card-logo">${logo ? `<img src="assets/brand-logos/${logo}" alt="" aria-hidden="true">` : `<span aria-hidden="true">${escapeHTML(brand.slice(0, 2).toLocaleUpperCase())}</span>`}</span>
        <span class="brand-card-copy"><strong>${escapeHTML(brand)}</strong><small>${group.length} ${group.length === 1 ? "modelo" : "modelos"} de batería</small></span>
        <span class="brand-card-arrow" aria-hidden="true">↗</span>
      </button>`;
    }).join("");
  if (customer?.role !== "admin") {
    $("#account-label").textContent = customer?.name ? customer.name.split(" ")[0] : "Iniciar sesión";
  }
  updateCartBadge();
}

function renderProductCards(items) {
  return items.map(product => `
    <button class="product-card ${product.stock ? "" : "sold-out-card"}" data-product-id="${escapeHTML(product.id)}" type="button" aria-label="Ver detalles de ${escapeHTML(product.name)}">
      <span class="product-image-wrap">
        <img class="product-image" src="${escapeHTML(safeImage(product.image))}" alt="" loading="lazy">
        <span class="stock-pill ${product.stock ? "" : "sold-out"}">${product.stock ? "En stock" : "Agotado"}</span>
      </span>
      <span class="product-info">
        <span class="product-brand">${escapeHTML(product.brand)}</span>
        <span class="product-card-name">${escapeHTML(product.name)}</span>
        <span class="product-price-row"><span class="product-price">${formatPrice(product.price)} <small>USD</small></span><span class="card-arrow">↗</span></span>
      </span>
    </button>`).join("");
}

function showBrandModels(brandKey) {
  const query = $("#search-input").value.trim().toLowerCase();
  const availability = $("#availability-filter").value;
  const models = products.filter(product => {
    const matchesBrand = product.brand.trim().toLocaleLowerCase() === brandKey;
    const matchesQuery = `${product.name} ${product.brand} ${product.specs}`.toLowerCase().includes(query);
    const matchesAvailability = availability === "all" || (availability === "available" ? product.stock : !product.stock);
    return matchesBrand && matchesQuery && matchesAvailability;
  });
  if (!models.length) return;
  activeBrandKey = brandKey;
  brandModal.innerHTML = `
    <button class="modal-close" data-close type="button" aria-label="Cerrar">×</button>
    <div class="modal-identity"><img src="assets/cuban-fashioner-logo.png" alt=""><span>Cuban Fashioner</span></div>
    <div class="eyebrow"><span class="eyebrow-line"></span> MODELOS DISPONIBLES</div>
    <h2 class="brand-modal-title" id="brand-modal-title">${escapeHTML(models[0].brand)}</h2>
    <p class="brand-modal-copy">Selecciona un modelo para ver sus especificaciones, precio y disponibilidad.</p>
    <div class="brand-model-grid">${renderProductCards(models)}</div>`;
  brandModal.querySelectorAll(".product-card img").forEach(image => image.addEventListener("error", () => {
    image.src = FALLBACK_IMAGE;
    image.classList.add("fallback-image");
  }, { once: true }));
  openDialog(brandModal);
}

function openDialog(element) {
  closeDrawer(false, true);
  if (activeModal && activeModal !== element) activeModal.classList.add("hidden");
  trackOverlayInHistory(element);
  activeModal = element;
  modalBackdrop.classList.remove("hidden");
  element.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  const focusable = element.querySelector("button, input, textarea, select");
  focusable?.focus();
}

function closeModal(preserveHistory = false) {
  [brandModal, productModal, authModal, orderModal].forEach(modal => modal.classList.add("hidden"));
  activeModal = null;
  activeBrandKey = null;
  if (cartDrawer.classList.contains("hidden")) {
    modalBackdrop.classList.add("hidden");
    document.body.style.overflow = "";
  }
  if (!preserveHistory) releaseOverlayHistory();
}

function showProduct(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;
  productModal.innerHTML = `
    <div class="product-modal-layout">
      <div class="product-modal-image"><img src="${escapeHTML(safeImage(product.image))}" alt="${escapeHTML(product.name)}"><span class="stock-pill ${product.stock ? "" : "sold-out"}">${product.stock ? "En stock" : "Agotado"}</span></div>
      <div class="modal-details">
        <button class="modal-close" data-close type="button" aria-label="Cerrar">×</button>
        <div class="modal-identity"><img src="assets/cuban-fashioner-logo.png" alt=""><span>Cuban Fashioner</span></div>
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
  closeModal(true);
  renderCart();
  trackOverlayInHistory();
  cartDrawer.classList.remove("hidden");
  modalBackdrop.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  $("#cart-button").setAttribute("aria-expanded", "true");
}

function closeDrawer(restoreOverflow = true, preserveHistory = false) {
  cartDrawer.classList.add("hidden");
  $("#cart-button").setAttribute("aria-expanded", "false");
  if (restoreOverflow && !activeModal) {
    modalBackdrop.classList.add("hidden");
    document.body.style.overflow = "";
  }
  if (!preserveHistory) releaseOverlayHistory();
}

function renderCustomerAuth(mode, name = "", contact = "") {
  const registering = mode === "register";
  authModal.innerHTML = `
    <button class="modal-close" data-close type="button" aria-label="Cerrar">×</button>
    <div class="modal-identity"><img src="assets/cuban-fashioner-logo.png" alt=""><span>Cuban Fashioner</span></div>
    <div class="eyebrow"><span class="eyebrow-line"></span> BIENVENIDO</div>
    <h2 class="auth-heading" id="auth-title">${registering ? "Crear cuenta de cliente" : "Inicia sesión"}</h2>
    <p class="auth-copy">${registering ? "Crea tu cuenta con correo electrónico y una contraseña para continuar." : "Introduce el correo electrónico y la contraseña de tu cuenta."}</p>
    <div class="auth-mode-switch" aria-label="Tipo de acceso">
      <button class="${registering ? "" : "active"}" data-auth-mode="login" type="button" aria-pressed="${!registering}">Iniciar sesión</button>
      <button class="${registering ? "active" : ""}" data-auth-mode="register" type="button" aria-pressed="${registering}">Crear cuenta</button>
    </div>
    <form class="auth-form" id="customer-form">
      ${registering ? `<label for="customer-name">Nombre completo</label><input id="customer-name" required maxlength="80" autocomplete="name" placeholder="Tu nombre" value="${escapeHTML(name)}">` : ""}
      <label for="customer-contact">Correo electrónico</label><input id="customer-contact" type="email" required maxlength="120" autocomplete="username" placeholder="nombre@gmail.com" value="${escapeHTML(contact)}">
      <label for="customer-password">Contraseña</label><input id="customer-password" type="password" required minlength="8" maxlength="128" autocomplete="${registering ? "new-password" : "current-password"}" placeholder="Mínimo 8 caracteres">
      <button class="button button-primary" type="submit">${registering ? "Crear cuenta" : "Entrar"} <span>→</span></button>
    </form>
    <div class="auth-divider">o</div>
    <button class="button admin-access" id="admin-login-button" type="button">♛ Acceso de administrador</button>
    <p class="auth-hint">Las contraseñas se validan de forma segura mediante el servicio de autenticación.</p>`;
}

function showAuth() {
  const name = customer?.role === "customer" ? customer.name : "";
  const contact = customer?.role === "customer" ? customer.contact : "";
  renderCustomerAuth("login", name, contact);
  openDialog(authModal);
}

function showOrderConfirmation(order) {
  const message = [
    "Hola, quiero confirmar este pedido de Cuban Fashioner:",
    `Pedido: ${order.id}`,
    `Cliente: ${order.customer.name}`,
    `Contacto: ${order.customer.contact}`,
    "Productos:",
    ...order.products.map(item => `- ${item.name}: ${item.description} — ${item.quantity} x ${formatPrice(item.unitPrice)} = ${formatPrice(item.lineTotal)}`),
    `Total: ${formatPrice(order.total)} USD`,
    "Quedo pendiente para coordinar la recogida."
  ].join("\n");
  const whatsappUrl = `https://wa.me/5350727220?text=${encodeURIComponent(message)}`;
  orderModal.innerHTML = `
    <button class="modal-close" data-close type="button" aria-label="Cerrar">×</button>
    <div class="modal-identity"><img src="assets/cuban-fashioner-logo.png" alt=""><span>Cuban Fashioner</span></div>
    <div class="eyebrow"><span class="eyebrow-line"></span> PEDIDO REGISTRADO</div>
    <h2 id="order-title">¡Gracias por tu pedido!</h2>
    <p>Envía el resumen por WhatsApp para confirmar tu pedido y coordinar la recogida.</p>
    <div class="order-summary">
      <p class="order-number">Pedido <strong>${escapeHTML(order.id)}</strong></p>
      <ul class="order-products">${order.products.map(item => `
        <li><div><strong>${escapeHTML(item.name)}</strong><p>${escapeHTML(item.description)}</p><small>${escapeHTML(item.quantity)} × ${formatPrice(item.unitPrice)}</small></div><strong>${formatPrice(item.lineTotal)}</strong></li>`).join("")}</ul>
      <div class="order-total"><span>Total</span><strong>${formatPrice(order.total)} USD</strong></div>
    </div>
    <div class="order-actions"><a class="button button-primary whatsapp-order" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">Enviar por WhatsApp <span>↗</span></a><button class="button button-outline" id="copy-order" type="button">Copiar resumen</button></div>`;
  openDialog(orderModal);
  $("#copy-order").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(message);
      notify("Resumen del pedido copiado");
    } catch (error) {
      console.error("No se pudo copiar el resumen del pedido.", error);
      notify("No se pudo copiar el resumen. Inténtalo de nuevo.");
    }
  });
}

async function confirmOrder(button) {
  if (!cart.length) return;
  if (!customer || customer.role !== "customer") {
    closeDrawer(false, true);
    showAuth();
    notify("Inicia sesión para confirmar el pedido");
    return;
  }
  const cartProducts = cart.map(item => ({ item, product: products.find(entry => entry.id === item.id) }));
  if (cartProducts.some(({ product }) => !product || !product.stock)) {
    notify("El carrito tiene productos que ya no están disponibles. Revísalo antes de confirmar.");
    renderCart();
    return;
  }
  const order = {
    id: `CF-${Date.now()}`,
    date: new Date().toISOString(),
    customer: { name: customer.name, contact: customer.contact },
    products: cartProducts.map(({ item, product }) => {
      const unitPrice = Number(product.price);
      return {
        name: product.name,
        description: product.specs,
        quantity: item.quantity,
        unitPrice,
        lineTotal: Number((unitPrice * item.quantity).toFixed(2))
      };
    }),
    total: Number(cart.reduce((sum, item) => sum + (products.find(entry => entry.id === item.id)?.price || 0) * item.quantity, 0).toFixed(2))
  };
  button.disabled = true;
  try {
    await Backend.saveOrder(order, customer.userId);
    cart = [];
    Store.saveCart(cart);
    renderCart();
    closeDrawer(false, true);
    showOrderConfirmation(order);
  } catch (error) {
    console.error("No se pudo guardar el pedido.", error);
    notify("No se pudo registrar el pedido. Inténtalo de nuevo.");
  } finally {
    button.disabled = false;
  }
}

async function renderAdmin() {
  $("#admin-product-count").textContent = String(products.length);
  $("#inventory-count").textContent = `${products.length} ${products.length === 1 ? "producto" : "productos"}`;
  $("#admin-product-list").innerHTML = products.length ? products.map(product => `
    <article class="admin-product-row">
      <img src="${escapeHTML(safeImage(product.image))}" alt="">
      <div class="admin-product-text"><strong>${escapeHTML(product.name)}</strong><small>${formatPrice(product.price)} · <span class="admin-stock ${product.stock ? "available" : "unavailable"}">${product.stock ? "En stock" : "Agotado"}</span></small></div>
      <div class="admin-row-actions"><button data-edit="${escapeHTML(product.id)}" type="button">Editar</button><button data-stock="${escapeHTML(product.id)}" type="button">${product.stock ? "Agotar" : "Activar"}</button><button class="delete-product" data-delete="${escapeHTML(product.id)}" type="button" aria-label="Eliminar ${escapeHTML(product.name)}">×</button></div>
    </article>`).join("") : '<div class="admin-empty">Aún no hay productos. Agrega el primero con el formulario.</div>';
  $("#admin-product-list").querySelectorAll("img").forEach(image => image.addEventListener("error", () => { image.src = FALLBACK_IMAGE; }, { once: true }));
  orders = await Backend.getOrders();
  $("#orders-count").textContent = `${orders.length} ${orders.length === 1 ? "pedido" : "pedidos"}`;
  $("#admin-orders").innerHTML = orders.length ? orders.map(order => `
    <article class="order-row"><div class="order-row-top"><div><strong>${escapeHTML(order.customer.name)}</strong><br><small>${escapeHTML(order.customer.contact)} · ${new Date(order.date).toLocaleString("es-ES")}</small></div><strong>${formatPrice(order.total)}</strong></div><p>${(Array.isArray(order.products) ? order.products : []).filter(item => item && typeof item === "object").map(item => `${escapeHTML(item.name)} × ${escapeHTML(item.quantity)}`).join(" · ")}</p></article>`).join("") : '<div class="admin-empty">Los pedidos confirmados aparecerán aquí.</div>';
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
  const brandCard = event.target.closest("[data-brand]");
  if (brandCard) showBrandModels(brandCard.dataset.brand);
});
brandModal.addEventListener("click", event => {
  const productCard = event.target.closest("[data-product-id]");
  if (productCard) showProduct(productCard.dataset.productId);
});
document.querySelectorAll("[data-theme-toggle]").forEach(button => button.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
  applyTheme(nextTheme);
  try {
    Store.saveTheme(nextTheme);
  } catch (error) {
    console.error("No se pudo guardar la preferencia de tema.", error);
    notify(error.message || "No se pudo guardar el modo de color.");
  }
}));
$("#account-button").addEventListener("click", () => {
  if (customer?.role === "admin") setPageMode(true);
  else if (customer?.role === "customer") {
    supabase.auth.signOut().then(({ error }) => {
      if (error) throw error;
      notify("Has cerrado sesión");
    }).catch(error => {
      console.error("No se pudo cerrar la sesión.", error);
      notify("No se pudo cerrar la sesión. Inténtalo de nuevo.");
    });
  } else showAuth();
});
$("#cart-button").addEventListener("click", openCart);
$("#checkout-button").addEventListener("click", event => confirmOrder(event.currentTarget));
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
window.addEventListener("popstate", () => {
  const historyState = window.history.state;
  if (historyState?.cubanFashionerOverlay && historyState.cubanFashionerBrandKey) {
    overlayHistoryActive = true;
    showBrandModels(historyState.cubanFashionerBrandKey);
    return;
  }
  if (!overlayHistoryActive) return;
  overlayHistoryActive = false;
  if (activeModal) closeModal(true);
  else if (!cartDrawer.classList.contains("hidden")) closeDrawer(true, true);
});

authModal.addEventListener("click", event => {
  const modeButton = event.target.closest("[data-auth-mode]");
  if (modeButton) {
    renderCustomerAuth(modeButton.dataset.authMode, $("#customer-name")?.value || "", $("#customer-contact").value);
    return;
  }
  if (event.target.id === "admin-login-button") {
    authModal.innerHTML = `
      <button class="modal-close" data-close type="button" aria-label="Cerrar">×</button>
      <div class="modal-identity"><img src="assets/cuban-fashioner-logo.png" alt=""><span>Cuban Fashioner</span></div>
      <div class="eyebrow"><span class="eyebrow-line"></span> ACCESO RESTRINGIDO</div>
      <h2 class="auth-heading" id="auth-title">Administración</h2><p class="auth-copy">Introduce las credenciales de administrador.</p>
      <form class="auth-form" id="admin-form"><label for="admin-email">Correo</label><input id="admin-email" type="email" autocomplete="username" required value="${ADMIN_EMAIL}"><label for="admin-password">Contraseña</label><input id="admin-password" type="password" autocomplete="current-password" required minlength="8" maxlength="128"><button class="button button-primary" type="submit">Entrar al panel <span>→</span></button></form>
      <p class="auth-hint">La contraseña se valida en Supabase y no se guarda en el código de la tienda.</p>`;
    $("#admin-password").focus();
  }
});
authModal.addEventListener("submit", async event => {
  const form = event.target;
  if (!["customer-form", "admin-form"].includes(form.id)) return;
  event.preventDefault();
  if (!supabaseConfigured) {
    notify("Falta configurar Supabase para habilitar el acceso seguro.");
    return;
  }
  const adminLogin = form.id === "admin-form";
  const registering = form.id === "customer-form" && Boolean(form.querySelector("#customer-name"));
  const email = (adminLogin ? $("#admin-email").value : $("#customer-contact").value).trim().toLowerCase();
  const password = (adminLogin ? $("#admin-password").value : $("#customer-password").value);
  const name = registering ? $("#customer-name").value.trim() : "";
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  try {
    if (adminLogin && email !== ADMIN_EMAIL) {
      notify("Esta cuenta no tiene acceso al panel de administración.");
      return;
    }
    const result = registering
      ? await supabase.auth.signUp({ email, password, options: { data: { name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    if (registering && !result.data.session) {
      closeModal();
      notify("Revisa tu correo para confirmar la cuenta antes de iniciar sesión.");
      return;
    }
    if (!result.data.user) throw new Error("El servicio no devolvió una cuenta autenticada.");
    const isAdmin = isAdminAccount(result.data.user);
    if (adminLogin && !isAdmin) {
      await supabase.auth.signOut();
      notify("Esta cuenta no tiene acceso al panel de administración.");
      return;
    }
    customer = {
      userId: result.data.user.id,
      name: result.data.user.user_metadata?.name || result.data.user.email,
      contact: result.data.user.email,
      role: isAdmin ? "admin" : "customer"
    };
    closeModal();
    if (isAdmin) setPageMode(true);
    else {
      setPageMode(false);
      notify(`Bienvenido/a, ${customer.name.split(" ")[0]}`);
    }
  } catch (error) {
    console.error("No se pudo autenticar la cuenta.", error);
    notify("No se pudo iniciar sesión. Revisa el correo y la contraseña e inténtalo de nuevo.");
  } finally {
    if (submitButton.isConnected) submitButton.disabled = false;
  }
});

$("#product-form").addEventListener("submit", async event => {
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
    const savedProduct = await Backend.saveProduct(product);
    if (id) products = products.map(item => item.id === id ? savedProduct : item);
    else products = [savedProduct, ...products];
    resetProductForm();
    refreshAdmin();
    renderProducts();
    notify(id ? "Producto actualizado" : "Producto agregado al catálogo");
  } catch (error) {
    notify(error.message);
  }
});
$("#cancel-edit").addEventListener("click", resetProductForm);
$("#admin-product-list").addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    beginEdit(editButton.dataset.edit);
    return;
  }
  const stockButton = event.target.closest("[data-stock]");
  if (stockButton) {
    const product = products.find(item => item.id === stockButton.dataset.stock);
    if (!product) return;
    try {
      const updated = await Backend.saveProduct({ ...product, stock: !product.stock });
      products = products.map(item => item.id === updated.id ? updated : item);
      refreshAdmin();
      renderProducts();
      notify("Disponibilidad actualizada");
    } catch (error) {
      console.error("No se pudo actualizar la disponibilidad.", error);
      notify("No se pudo actualizar el producto.");
    }
    return;
  }
  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton && window.confirm("¿Eliminar este producto del catálogo?")) {
    try {
      await Backend.deleteProduct(deleteButton.dataset.delete);
      products = products.filter(product => product.id !== deleteButton.dataset.delete);
      cart = cart.filter(item => item.id !== deleteButton.dataset.delete);
      Store.saveCart(cart);
      refreshAdmin();
      renderProducts();
      notify("Producto eliminado");
    } catch (error) {
      console.error("No se pudo eliminar el producto.", error);
      notify("No se pudo eliminar el producto.");
    }
  }
});
$("#back-to-store").addEventListener("click", () => setPageMode(false));
$("#admin-logout").addEventListener("click", async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    customer = null;
    setPageMode(false);
    notify("Has cerrado sesión");
  } catch (error) {
    console.error("No se pudo cerrar la sesión de administración.", error);
    notify("No se pudo cerrar la sesión. Inténtalo de nuevo.");
  }
});

async function applyAuthenticatedUser(user) {
  if (!user) {
    customer = null;
    setPageMode(false);
    return;
  }
  const isAdmin = isAdminAccount(user);
  customer = {
    userId: user.id,
    name: user.user_metadata?.name || user.email,
    contact: user.email,
    role: isAdmin ? "admin" : "customer"
  };
  if (isAdmin) setPageMode(true);
  else {
    setPageMode(false);
    renderProducts();
  }
}

async function initialize() {
  $("#current-year").textContent = String(new Date().getFullYear());
  applyTheme(Store.getTheme());
  if (!supabaseConfigured) {
    renderProducts();
    notify("Configura Supabase para activar el acceso y los datos compartidos.");
    return;
  }
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION") return;
    window.setTimeout(() => {
      applyAuthenticatedUser(session?.user || null).catch(error => {
        console.error("No se pudo comprobar el acceso de la cuenta.", error);
        customer = null;
        setPageMode(false);
        notify("No se pudo verificar la cuenta. Vuelve a iniciar sesión.");
      });
    }, 0);
  });
  try {
    const [{ data, error }, loadedProducts] = await Promise.all([
      supabase.auth.getSession(),
      Backend.getProducts()
    ]);
    if (error) throw error;
    products = loadedProducts;
    renderProducts();
    await applyAuthenticatedUser(data.session?.user || null);
  } catch (error) {
    console.error("No se pudo inicializar Supabase.", error);
    products = [];
    renderProducts();
    notify("No se pudo conectar con la tienda. Revisa la configuración de Supabase.");
  }
}

initialize();
