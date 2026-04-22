CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'user');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferred_currency TEXT NOT NULL DEFAULT 'INR',
  home_city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  base_fare NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_per_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_per_minute NUMERIC(10,2) NOT NULL DEFAULT 0,
  surge_multiplier_default NUMERIC(6,2) NOT NULL DEFAULT 1,
  eta_bias_minutes INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  pickup_label TEXT NOT NULL,
  pickup_place_id TEXT,
  pickup_lat NUMERIC(9,6),
  pickup_lng NUMERIC(9,6),
  drop_label TEXT NOT NULL,
  drop_place_id TEXT,
  drop_lat NUMERIC(9,6),
  drop_lng NUMERIC(9,6),
  distance_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes NUMERIC(10,2) NOT NULL DEFAULT 0,
  ride_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  time_of_day_bucket TEXT NOT NULL DEFAULT 'day',
  traffic_level TEXT NOT NULL DEFAULT 'moderate',
  weather_condition TEXT NOT NULL DEFAULT 'clear',
  surge_multiplier NUMERIC(6,2) NOT NULL DEFAULT 1,
  quoted_fare NUMERIC(10,2),
  predicted_fare NUMERIC(10,2),
  actual_fare NUMERIC(10,2),
  trip_status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fare_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  ride_type TEXT NOT NULL,
  pickup_label TEXT NOT NULL,
  pickup_place_id TEXT,
  drop_label TEXT NOT NULL,
  drop_place_id TEXT,
  distance_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes NUMERIC(10,2) NOT NULL DEFAULT 0,
  time_of_day_bucket TEXT NOT NULL DEFAULT 'day',
  traffic_level TEXT NOT NULL DEFAULT 'moderate',
  weather_condition TEXT NOT NULL DEFAULT 'clear',
  surge_multiplier NUMERIC(6,2) NOT NULL DEFAULT 1,
  estimated_fare NUMERIC(10,2) NOT NULL,
  eta_minutes INTEGER,
  quote_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorite_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  pickup_label TEXT NOT NULL,
  pickup_place_id TEXT,
  pickup_lat NUMERIC(9,6),
  pickup_lng NUMERIC(9,6),
  drop_label TEXT NOT NULL,
  drop_place_id TEXT,
  drop_lat NUMERIC(9,6),
  drop_lng NUMERIC(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fare_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_routes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
CREATE POLICY "Admins can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can view active providers" ON public.providers;
CREATE POLICY "Anyone can view active providers"
ON public.providers
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage providers" ON public.providers;
CREATE POLICY "Admins can manage providers"
ON public.providers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view their own rides" ON public.rides;
CREATE POLICY "Users can view their own rides"
ON public.rides
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own rides" ON public.rides;
CREATE POLICY "Users can create their own rides"
ON public.rides
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own rides" ON public.rides;
CREATE POLICY "Users can update their own rides"
ON public.rides
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own rides" ON public.rides;
CREATE POLICY "Users can delete their own rides"
ON public.rides
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own fare quotes" ON public.fare_quotes;
CREATE POLICY "Users can view their own fare quotes"
ON public.fare_quotes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own fare quotes" ON public.fare_quotes;
CREATE POLICY "Users can create their own fare quotes"
ON public.fare_quotes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own fare quotes" ON public.fare_quotes;
CREATE POLICY "Users can delete their own fare quotes"
ON public.fare_quotes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own favorite routes" ON public.favorite_routes;
CREATE POLICY "Users can view their own favorite routes"
ON public.favorite_routes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own favorite routes" ON public.favorite_routes;
CREATE POLICY "Users can create their own favorite routes"
ON public.favorite_routes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own favorite routes" ON public.favorite_routes;
CREATE POLICY "Users can update their own favorite routes"
ON public.favorite_routes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorite routes" ON public.favorite_routes;
CREATE POLICY "Users can delete their own favorite routes"
ON public.favorite_routes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_providers_updated_at ON public.providers;
CREATE TRIGGER update_providers_updated_at
BEFORE UPDATE ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_rides_updated_at ON public.rides;
CREATE TRIGGER update_rides_updated_at
BEFORE UPDATE ON public.rides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_favorite_routes_updated_at ON public.favorite_routes;
CREATE TRIGGER update_favorite_routes_updated_at
BEFORE UPDATE ON public.favorite_routes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_user_id_ride_date ON public.rides(user_id, ride_date DESC);
CREATE INDEX IF NOT EXISTS idx_rides_provider_id ON public.rides(provider_id);
CREATE INDEX IF NOT EXISTS idx_fare_quotes_user_id_created_at ON public.fare_quotes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorite_routes_user_id ON public.favorite_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_slug ON public.providers(slug);

INSERT INTO public.providers (name, slug, base_fare, price_per_km, price_per_minute, surge_multiplier_default, eta_bias_minutes, is_active)
VALUES
  ('Uber', 'uber', 45, 14, 2.4, 1, 0, true),
  ('Ola', 'ola', 42, 13.5, 2.2, 1, 2, true),
  ('Rapido', 'rapido', 35, 12, 1.9, 1, 3, true)
ON CONFLICT (slug) DO NOTHING;