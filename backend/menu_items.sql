 create table menu_items (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text,

  price numeric(10,2) not null check (price >= 0),

  category text not null check (
    category in ('mains', 'sides', 'drinks')
  ),

  image_url text,

  is_available boolean default true,

  created_at timestamp with time zone default now()
);



alter table menu_items enable row level security;

create policy "Public can read menu items"
on menu_items
for select
using (is_available = true);
