create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text not null,
  image text not null default '',
  specs text not null,
  price numeric(10, 2) not null check (price > 0),
  stock boolean not null default true
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  customer_name text not null,
  customer_contact text not null,
  products jsonb not null check (jsonb_typeof(products) = 'array'),
  total numeric(10, 2) not null check (total >= 0)
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = (select auth.uid())
      and lower(email) = 'cubanfashioner@gmail.com'
      and email_confirmed_at is not null
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Products are publicly readable" on public.products;
create policy "Products are publicly readable"
on public.products for select
to anon, authenticated
using (true);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
on public.products for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Customers create their own orders" on public.orders;
create policy "Customers create their own orders"
on public.orders for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Admins read orders" on public.orders;
create policy "Admins read orders"
on public.orders for select
to authenticated
using ((select public.is_admin()));

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert on public.orders to authenticated;
grant select on public.orders to authenticated;

insert into public.products (id, name, brand, image, specs, price, stock) values
  ('hp-hs04', 'Batería HP HS04', 'HP', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', 'Batería de ion-litio de 14.8 V y 2600 mAh. Compatible con HP 240 G4, 245 G4, 250 G4, 255 G4 y modelos de la serie HP 14/15.', 32.50, true),
  ('dell-inspiron-15', 'Batería Dell Inspiron 15', 'Dell', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80', 'Batería de reemplazo de 14.8 V y 40 Wh. Compatible con Dell Inspiron 15 3000 Series, 3451, 3452, 3551 y modelos compatibles.', 38, true),
  ('lenovo-ideapad-330', 'Batería Lenovo IdeaPad 330', 'Lenovo', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', 'Batería interna de 7.6 V y 30 Wh. Compatible con Lenovo IdeaPad 330-14IKB, 330-15IKB, 330-15AST y variantes.', 41.75, true),
  ('acer-aspire-e5', 'Batería Acer Aspire E5', 'Acer', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 'Batería de 14.8 V y 2200 mAh. Compatible con Acer Aspire E5-571, E5-571G, E5-511 y equipos de la serie Aspire E.', 35, false),
  ('asus-x540', 'Batería ASUS X540', 'ASUS', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', 'Batería de polímero de litio de 7.6 V y 33 Wh. Compatible con ASUS X540, X540S, X540L, F540 y modelos de la familia.', 36.25, true),
  ('hp-pavilion-ht03xl', 'Batería HP HT03XL', 'HP', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', 'Batería de 11.55 V y 41.9 Wh. Compatible con HP Pavilion 14-ce, 15-cs, 15-da y modelos que utilizan batería HT03XL.', 44.90, true),
  ('dell-latitude-e5470', 'Batería Dell Latitude E5470', 'Dell', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80', 'Batería de 11.1 V y 47 Wh. Compatible con Dell Latitude E5470, E5570 y determinados modelos de las series E5xxx.', 49, false),
  ('lenovo-thinkpad-t470', 'Batería Lenovo ThinkPad T470', 'Lenovo', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 'Batería externa de 11.4 V y 24 Wh. Compatible con Lenovo ThinkPad T470, T480, A475 y modelos seleccionados.', 52.50, true)
on conflict (id) do nothing;
