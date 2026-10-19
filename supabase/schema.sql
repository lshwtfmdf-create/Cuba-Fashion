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

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'products';

drop policy if exists "Product images are publicly readable" on storage.objects;
create policy "Product images are publicly readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'products');

drop policy if exists "Admins upload product images" on storage.objects;
drop policy if exists "Admins manage product images" on storage.objects;
create policy "Admins upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'products' and (select public.is_admin()));

drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'products' and (select public.is_admin()))
with check (bucket_id = 'products' and (select public.is_admin()));

drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'products' and (select public.is_admin()));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'products'
    ) then
    alter publication supabase_realtime add table public.products;
  end if;
end;
$$;

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

insert into public.products (id, name, brand, image, specs, price, stock) values
  ('hp-hs04', 'Batería HP JC04 / HS04', 'HP', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', 'Batería Li-ion nueva e importada, 14.8 V, 2200 mAh / 33 Wh. Compatible con HP 14, HP 15, HP Pavilion 240 G6 y 250 G6. Precio sugerido: 30 USD; opción de pago en CUP disponible.', 30, true),
  ('hp-pavilion-ht03xl', 'Batería HP HT03XL', 'HP', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', 'Batería Li-ion nueva, 11.55 V, 3470 mAh / 41.9 Wh. Compatible con HP Pavilion 14-CE, 15-CS, 15-DA, 15-DB y 250 G7.', 40, true),
  ('lenovo-l15m2pb1-l16m3pb1', 'Batería Lenovo L15M2PB1 / L16M3PB1', 'Lenovo', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', 'Batería Li-ion nueva, 7.5 V / 7.6 V, 4000 mAh / 30-35 Wh. Compatible con Lenovo IdeaPad 320, 330, 520 y V320.', 45, true),
  ('lenovo-l11s6y01', 'Batería Lenovo L11S6Y01', 'Lenovo', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 'Batería Li-ion nueva, 10.8 V, 4400 mAh / 48 Wh. Compatible con Lenovo G480, G580, Y480, Z580 y ThinkPad Edge E430.', 25, true),
  ('dell-yrdd6', 'Batería Dell YRDD6', 'Dell', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80', 'Batería Li-ion nueva, 11.4 V / 42 Wh. Compatible con Dell Inspiron 14 5480, 15 5584, 15 3593 y Vostro 5481.', 35, true),
  ('dell-wdx0r', 'Batería Dell WDX0R', 'Dell', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80', 'Batería Li-ion nueva, 11.4 V, 3500 mAh / 42 Wh. Compatible con Dell Inspiron 13 5368, 15 5567, 15 5570 y 17 5770.', 38, true),
  ('asus-a41-x550a', 'Batería ASUS A41-X550A', 'ASUS', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', 'Batería Li-ion nueva, 14.4 V, 2600 mAh / 37 Wh. Compatible con ASUS X450, X550, A550, K550 y R510.', 30, true),
  ('acer-as10d31-ac14b18k', 'Batería Acer AS10D31 / AC14B18K', 'Acer', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 'Batería Li-ion nueva, 10.8 V / 11.4 V, 4400 mAh / 48 Wh. Compatible con Acer Aspire E1, V3, E5-571, E5-573 y ES1.', 32, true)
on conflict (id) do update set
  name = excluded.name,
  brand = excluded.brand,
  image = excluded.image,
  specs = excluded.specs,
  price = excluded.price;
