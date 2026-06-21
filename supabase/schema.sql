-- Canchas Tandil — Schema SQL para Supabase
-- Ejecutar en el SQL Editor de Supabase

-- =================================================
-- 1. PROFILES
-- =================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text not null,
  telefono text,
  rol text not null check (rol in ('jugador', 'dueño')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Lectura pública de profiles" on profiles
  for select using (true);

create policy "Usuarios leen su propio profile" on profiles
  for select using (auth.uid() = id);

create policy "Usuarios insertan su propio profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Usuarios actualizan su propio profile" on profiles
  for update using (auth.uid() = id);

-- =================================================
-- 2. CANCHAS
-- =================================================
create table if not exists canchas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  nombre text not null,
  direccion text not null,
  tipo text not null check (tipo in ('Fútbol 5', 'Fútbol 7', 'Fútbol 11', 'Techo', 'Indoor')),
  precio_hora numeric not null check (precio_hora > 0),
  descripcion text default '',
  comodidades jsonb default '{"vestuario": false, "estacionamiento": false, "iluminacion": false}',
  fotos text[] default '{}',
  metodos_pago text[] default '{presencial}',
  latitud numeric,
  longitud numeric,
  activa boolean default true,
  rating numeric default 0 check (rating between 0 and 5),
  created_at timestamptz default now()
);

alter table canchas enable row level security;

create policy "Canchas activas son públicas" on canchas
  for select using (activa = true);

create policy "Dueños ven todas sus canchas" on canchas
  for select using (auth.uid() = owner_id);

create policy "Dueños insertan sus canchas" on canchas
  for insert with check (auth.uid() = owner_id);

create policy "Dueños actualizan sus canchas" on canchas
  for update using (auth.uid() = owner_id);

create policy "Dueños eliminan sus canchas" on canchas
  for delete using (auth.uid() = owner_id);

-- Índices para búsqueda
create index if not exists idx_canchas_owner on canchas(owner_id);
create index if not exists idx_canchas_tipo on canchas(tipo);
create index if not exists idx_canchas_activa on canchas(activa);

-- =================================================
-- 3. HORARIOS (franjas semanales por cancha)
-- =================================================
create table if not exists horarios (
  id uuid primary key default gen_random_uuid(),
  cancha_id uuid not null references canchas(id) on delete cascade,
  dia_semana int not null check (dia_semana between 0 and 6), -- 0=dom, 6=sáb
  hora int not null check (hora between 0 and 23),
  activo boolean default true,
  unique (cancha_id, dia_semana, hora)
);

alter table horarios enable row level security;

create policy "Horarios son públicos" on horarios
  for select using (true);

create policy "Dueños gestionan horarios de sus canchas" on horarios
  for all using (
    auth.uid() = (select owner_id from canchas where id = cancha_id)
  );

create index if not exists idx_horarios_cancha on horarios(cancha_id);

-- =================================================
-- 4. RESERVAS
-- =================================================
create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  cancha_id uuid not null references canchas(id) on delete cascade,
  jugador_id uuid not null references profiles(id),
  fecha date not null,
  hora int not null check (hora between 0 and 23),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'confirmada', 'cancelada', 'completada')),
  metodo_pago text not null check (metodo_pago in ('presencial', 'mercadopago')),
  codigo_reserva text not null unique,
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamptz default now(),
  -- Prevención de doble reserva (RF-17, RNF-03)
  unique (cancha_id, fecha, hora)
);

alter table reservas enable row level security;

-- Jugadores ven sus propias reservas
create policy "Jugadores ven sus reservas" on reservas
  for select using (auth.uid() = jugador_id);

-- Dueños ven reservas de sus canchas
create policy "Dueños ven reservas de sus canchas" on reservas
  for select using (
    auth.uid() = (select owner_id from canchas where id = cancha_id)
  );

-- Cualquier autenticado puede ver disponibilidad (solo fecha/hora, no datos del jugador)
create policy "Disponibilidad pública por fecha" on reservas
  for select using (estado != 'cancelada');

-- Jugadores insertan reservas
create policy "Jugadores insertan reservas" on reservas
  for insert with check (auth.uid() = jugador_id);

-- Jugadores cancelan sus propias reservas
create policy "Jugadores cancelan sus reservas" on reservas
  for update using (auth.uid() = jugador_id and estado = 'pendiente');

-- Dueños actualizan estado de reservas de sus canchas
create policy "Dueños actualizan reservas de sus canchas" on reservas
  for update using (
    auth.uid() = (select owner_id from canchas where id = cancha_id)
  );

create index if not exists idx_reservas_cancha_fecha on reservas(cancha_id, fecha);
create index if not exists idx_reservas_jugador on reservas(jugador_id);
create index if not exists idx_reservas_estado on reservas(estado);

-- =================================================
-- 5. TRIGGER: crear perfil automáticamente al registrarse
-- Corre como security definer (sin restricción RLS), lo que permite
-- crear el perfil aunque el usuario aún no haya confirmado su email.
-- =================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nombre, email, telefono, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data->>'telefono', ''),
    coalesce(new.raw_user_meta_data->>'rol', 'jugador')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =================================================
-- 6. FUNCIÓN: generar horarios automáticos (RF-24)
-- =================================================
create or replace function generar_horarios_cancha(p_cancha_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  dia int;
  h int;
begin
  for dia in 0..6 loop
    for h in 14..23 loop
      insert into horarios (cancha_id, dia_semana, hora, activo)
      values (p_cancha_id, dia, h, true)
      on conflict (cancha_id, dia_semana, hora) do nothing;
    end loop;
  end loop;
end;
$$;

-- =================================================
-- 6. FUNCIÓN: código único de reserva
-- =================================================
create or replace function generar_codigo_reserva()
returns text
language plpgsql
as $$
declare
  codigo text;
  existe boolean;
begin
  loop
    codigo := upper(substring(md5(random()::text) from 1 for 8));
    select exists(select 1 from reservas where codigo_reserva = codigo) into existe;
    exit when not existe;
  end loop;
  return codigo;
end;
$$;
