-- Amazon clone: core schema. Later tracks add their own migrations as
-- supabase/migrations/01NN_<track>_<name>.sql so they never collide with this file.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  image_url text
);

create table public.products (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null default '',
  brand text,
  category_id bigint references public.categories (id),
  price numeric(10, 2) not null check (price >= 0),
  list_price numeric(10, 2),
  rating numeric(2, 1) not null default 0,
  rating_count integer not null default 0,
  stock integer not null default 0,
  images text[] not null default '{}',
  thumbnail text,
  is_prime boolean not null default true,
  created_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored
);
create index products_search_idx on public.products using gin (search);
create index products_category_idx on public.products (category_id);
create index products_price_idx on public.products (price);

create table public.cart_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete cascade,
  qty integer not null default 1 check (qty > 0),
  saved_for_later boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  zip text not null,
  country text not null default 'United States',
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'paid' check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(10, 2) not null,
  shipping numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  address jsonb not null,
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id bigint references public.products (id) on delete set null,
  title text not null,
  price numeric(10, 2) not null,
  qty integer not null check (qty > 0),
  thumbnail text
);
create index order_items_order_idx on public.order_items (order_id);

create table public.reviews (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'Amazon Customer',
  rating integer not null check (rating between 1 and 5),
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_idx on public.reviews (product_id, created_at desc);

-- Keep products.rating / rating_count in step with reviews.
create function public.refresh_product_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid bigint := coalesce(new.product_id, old.product_id);
begin
  update public.products p set
    rating = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where product_id = pid), 0),
    rating_count = (select count(*) from public.reviews where product_id = pid)
  where p.id = pid;
  return null;
end $$;
create trigger reviews_refresh_rating
after insert or update or delete on public.reviews
for each row execute function public.refresh_product_rating();

-- Profile row for every new real (non-anonymous) user.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Row level security -------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

create policy "catalog is public" on public.categories for select using (true);
create policy "products are public" on public.products for select using (true);
create policy "reviews are public" on public.reviews for select using (true);

create policy "own profile" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own cart" on public.cart_items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own addresses" on public.addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own orders read" on public.orders for select using (user_id = auth.uid());
create policy "own orders insert" on public.orders for insert with check (user_id = auth.uid());
create policy "own order items read" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own order items insert" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
-- Only signed-in, non-anonymous users may write reviews.
create policy "write own review" on public.reviews for insert
  with check (user_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy "edit own review" on public.reviews for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own review" on public.reviews for delete using (user_id = auth.uid());
