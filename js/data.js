const STORAGE_KEYS = {
  products: "cuban-fashioner-products",
  cart: "cuban-fashioner-cart",
  customer: "cuban-fashioner-customer",
  orders: "cuban-fashioner-orders"
};

const starterProducts = [
  {
    id: "hp-hs04",
    name: "Batería HP HS04",
    brand: "HP",
    price: 32.5,
    stock: true,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    specs: "Batería de ion-litio de 14.8 V y 2600 mAh. Compatible con HP 240 G4, 245 G4, 250 G4, 255 G4 y modelos de la serie HP 14/15."
  },
  {
    id: "dell-inspiron-15",
    name: "Batería Dell Inspiron 15",
    brand: "Dell",
    price: 38,
    stock: true,
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    specs: "Batería de reemplazo de 14.8 V y 40 Wh. Compatible con Dell Inspiron 15 3000 Series, 3451, 3452, 3551 y modelos compatibles."
  },
  {
    id: "lenovo-ideapad-330",
    name: "Batería Lenovo IdeaPad 330",
    brand: "Lenovo",
    price: 41.75,
    stock: true,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    specs: "Batería interna de 7.6 V y 30 Wh. Compatible con Lenovo IdeaPad 330-14IKB, 330-15IKB, 330-15AST y variantes."
  },
  {
    id: "acer-aspire-e5",
    name: "Batería Acer Aspire E5",
    brand: "Acer",
    price: 35,
    stock: false,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    specs: "Batería de 14.8 V y 2200 mAh. Compatible con Acer Aspire E5-571, E5-571G, E5-511 y equipos de la serie Aspire E."
  },
  {
    id: "asus-x540",
    name: "Batería ASUS X540",
    brand: "ASUS",
    price: 36.25,
    stock: true,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    specs: "Batería de polímero de litio de 7.6 V y 33 Wh. Compatible con ASUS X540, X540S, X540L, F540 y modelos de la familia."
  },
  {
    id: "hp-pavilion-ht03xl",
    name: "Batería HP HT03XL",
    brand: "HP",
    price: 44.9,
    stock: true,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    specs: "Batería de 11.55 V y 41.9 Wh. Compatible con HP Pavilion 14-ce, 15-cs, 15-da y modelos que utilizan batería HT03XL."
  },
  {
    id: "dell-latitude-e5470",
    name: "Batería Dell Latitude E5470",
    brand: "Dell",
    price: 49,
    stock: false,
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    specs: "Batería de 11.1 V y 47 Wh. Compatible con Dell Latitude E5470, E5570 y determinados modelos de las series E5xxx."
  },
  {
    id: "lenovo-thinkpad-t470",
    name: "Batería Lenovo ThinkPad T470",
    brand: "Lenovo",
    price: 52.5,
    stock: true,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    specs: "Batería externa de 11.4 V y 24 Wh. Compatible con Lenovo ThinkPad T470, T480, A475 y modelos seleccionados."
  }
];

function readStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.error(`No se pudo leer el almacenamiento "${key}".`, error);
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`No se pudo guardar el almacenamiento "${key}".`, error);
    throw new Error("No se pudieron guardar los cambios. Comprueba el espacio disponible del navegador.");
  }
}

export const Store = {
  getProducts() {
    const stored = readStored(STORAGE_KEYS.products, null);
    if (Array.isArray(stored)) return stored;
    writeStored(STORAGE_KEYS.products, starterProducts);
    return starterProducts.map(product => ({ ...product }));
  },
  saveProducts(products) {
    writeStored(STORAGE_KEYS.products, products);
  },
  getCart() {
    const cart = readStored(STORAGE_KEYS.cart, []);
    return Array.isArray(cart) ? cart : [];
  },
  saveCart(cart) {
    writeStored(STORAGE_KEYS.cart, cart);
  },
  getCustomer() {
    return readStored(STORAGE_KEYS.customer, null);
  },
  saveCustomer(customer) {
    writeStored(STORAGE_KEYS.customer, customer);
  },
  clearCustomer() {
    localStorage.removeItem(STORAGE_KEYS.customer);
  },
  getOrders() {
    const orders = readStored(STORAGE_KEYS.orders, []);
    return Array.isArray(orders) ? orders : [];
  },
  saveOrders(orders) {
    writeStored(STORAGE_KEYS.orders, orders);
  }
};
