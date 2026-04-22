ALTER TABLE public.rides
ADD COLUMN booking_reference text,
ADD COLUMN eta_minutes integer,
ADD COLUMN driver_name text,
ADD COLUMN driver_phone text,
ADD COLUMN driver_vehicle text,
ADD COLUMN driver_rating numeric,
ADD COLUMN payment_method_type text,
ADD COLUMN payment_method_last4 text,
ADD COLUMN payment_status text NOT NULL DEFAULT 'pending',
ADD COLUMN booked_at timestamp with time zone,
ADD COLUMN completed_at timestamp with time zone,
ADD COLUMN canceled_at timestamp with time zone,
ADD COLUMN status_updated_at timestamp with time zone NOT NULL DEFAULT now(),
ADD COLUMN itinerary_id uuid,
ADD COLUMN itinerary_leg_index integer,
ADD COLUMN itinerary_stop_count integer NOT NULL DEFAULT 0;

CREATE TABLE public.itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  payment_method_type text,
  payment_method_last4 text,
  quoted_total_fare numeric,
  predicted_total_fare numeric,
  trip_status text NOT NULL DEFAULT 'planned',
  booked_at timestamp with time zone,
  completed_at timestamp with time zone,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own itineraries"
ON public.itineraries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own itineraries"
ON public.itineraries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
ON public.itineraries
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries"
ON public.itineraries
FOR DELETE
USING (auth.uid() = user_id);

CREATE TABLE public.itinerary_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  stop_order integer NOT NULL,
  label text NOT NULL,
  place_id text,
  lat numeric,
  lng numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT itinerary_stops_unique_order UNIQUE (itinerary_id, stop_order)
);

ALTER TABLE public.itinerary_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own itinerary stops"
ON public.itinerary_stops
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own itinerary stops"
ON public.itinerary_stops
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itinerary stops"
ON public.itinerary_stops
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itinerary stops"
ON public.itinerary_stops
FOR DELETE
USING (auth.uid() = user_id);

CREATE TABLE public.booking_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  itinerary_id uuid REFERENCES public.itineraries(id) ON DELETE SET NULL,
  receipt_number text NOT NULL,
  provider_name text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  payment_method_type text,
  payment_method_last4 text,
  receipt_status text NOT NULL DEFAULT 'confirmed',
  receipt_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT booking_receipts_receipt_number_key UNIQUE (receipt_number)
);

ALTER TABLE public.booking_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own booking receipts"
ON public.booking_receipts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own booking receipts"
ON public.booking_receipts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own booking receipts"
ON public.booking_receipts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own booking receipts"
ON public.booking_receipts
FOR DELETE
USING (auth.uid() = user_id);

ALTER TABLE public.rides
  ADD CONSTRAINT rides_itinerary_id_fkey
  FOREIGN KEY (itinerary_id) REFERENCES public.itineraries(id) ON DELETE SET NULL;

CREATE INDEX idx_rides_user_status_date ON public.rides(user_id, trip_status, ride_date DESC);
CREATE INDEX idx_rides_itinerary_id ON public.rides(itinerary_id);
CREATE INDEX idx_itineraries_user_updated_at ON public.itineraries(user_id, updated_at DESC);
CREATE INDEX idx_itinerary_stops_itinerary_order ON public.itinerary_stops(itinerary_id, stop_order);
CREATE INDEX idx_booking_receipts_user_created_at ON public.booking_receipts(user_id, created_at DESC);

CREATE TRIGGER update_itineraries_updated_at
BEFORE UPDATE ON public.itineraries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itinerary_stops_updated_at
BEFORE UPDATE ON public.itinerary_stops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_receipts_updated_at
BEFORE UPDATE ON public.booking_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();