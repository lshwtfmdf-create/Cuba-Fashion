import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

const STORAGE_KEYS = {
  cart: "cuban-fashioner-cart",
  theme: "cuban-fashioner-theme"
};

const starterProducts = [
  {
    id: "hp-hs04",
    name: "Batería HP JC04 / HS04",
    brand: "HP",
    price: 30,
    stock: true,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    specs: "Batería Li-ion nueva e importada, 14.8 V, 2200 mAh / 33 Wh. Compatible con HP 14, HP 15, HP Pavilion 240 G6 y 250 G6. Precio sugerido: 30 USD; opción de pago en CUP disponible."
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
    price: 40,
    stock: true,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    specs: "Batería Li-ion nueva, 11.55 V, 3470 mAh / 41.9 Wh. Compatible con HP Pavilion 14-CE, 15-CS, 15-DA, 15-DB y 250 G7."
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
  },
  {
    id: "lenovo-l15m2pb1-l16m3pb1",
    name: "Batería Lenovo L15M2PB1 / L16M3PB1",
    brand: "Lenovo",
    price: 45,
    stock: true,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    specs: "Batería Li-ion nueva, 7.5 V / 7.6 V, 4000 mAh / 30-35 Wh. Compatible con Lenovo IdeaPad 320, 330, 520 y V320."
  },
  {
    id: "lenovo-l11s6y01",
    name: "Batería Lenovo L11S6Y01",
    brand: "Lenovo",
    price: 25,
    stock: true,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    specs: "Batería Li-ion nueva, 10.8 V, 4400 mAh / 48 Wh. Compatible con Lenovo G480, G580, Y480, Z580 y ThinkPad Edge E430."
  },
  {
    id: "dell-yrdd6",
    name: "Batería Dell YRDD6",
    brand: "Dell",
    price: 35,
    stock: true,
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    specs: "Batería Li-ion nueva, 11.4 V / 42 Wh. Compatible con Dell Inspiron 14 5480, 15 5584, 15 3593 y Vostro 5481."
  },
  {
    id: "dell-wdx0r",
    name: "Batería Dell WDX0R",
    brand: "Dell",
    price: 38,
    stock: true,
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    specs: "Batería Li-ion nueva, 11.4 V, 3500 mAh / 42 Wh. Compatible con Dell Inspiron 13 5368, 15 5567, 15 5570 y 17 5770."
  },
  {
    id: "asus-a41-x550a",
    name: "Batería ASUS A41-X550A",
    brand: "ASUS",
    price: 30,
    stock: true,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    specs: "Batería Li-ion nueva, 14.4 V, 2600 mAh / 37 Wh. Compatible con ASUS X450, X550, A550, K550 y R510."
  },
  {
    id: "acer-as10d31-ac14b18k",
    name: "Batería Acer AS10D31 / AC14B18K",
    brand: "Acer",
    price: 32,
    stock: true,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    specs: "Batería Li-ion nueva, 10.8 V / 11.4 V, 4400 mAh / 48 Wh. Compatible con Acer Aspire E1, V3, E5-571, E5-573 y ES1."
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

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabase = supabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export const Backend = {
  async getProducts() {
    const { data, error } = await supabase.from("products").select("*").order("brand").order("name");
    if (error) throw error;
    return data;
  },
  async saveProduct(product) {
    const { data, error } = await supabase.from("products").upsert(product, { onConflict: "id" }).select().single();
    if (error) throw error;
    return data;
  },
  async removeProductImage(path) {
    if (!path || path.includes("..")) throw new Error("La ruta de imagen no es válida.");
    const { data, error } = await supabase.storage.from("products").remove([path]);
    if (error) throw error;
    return data;
  },
  async deleteProduct(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },
  async getOrders() {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(order => ({
      id: order.id,
      date: order.created_at,
      customer: { name: order.customer_name, contact: order.customer_contact },
      products: order.products,
      total: Number(order.total)
    }));
  },
  async saveOrder(order, userId) {
    const { error } = await supabase.from("orders").insert({
      id: order.id,
      user_id: userId,
      customer_name: order.customer.name,
      customer_contact: order.customer.contact,
      products: order.products,
      total: order.total
    });
    if (error) throw error;
  }
};

export const Store = {
  getDemoProducts() {
    return starterProducts.map(product => ({ ...product }));
  },
  getCart() {
    const cart = readStored(STORAGE_KEYS.cart, []);
    return Array.isArray(cart) ? cart : [];
  },
  saveCart(cart) {
    writeStored(STORAGE_KEYS.cart, cart);
  },
  getTheme() {
    const theme = readStored(STORAGE_KEYS.theme, "light");
    return theme === "dark" ? "dark" : "light";
  },
  saveTheme(theme) {
    writeStored(STORAGE_KEYS.theme, theme);
  }
};
