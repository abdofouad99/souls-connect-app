-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'sponsor');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  country TEXT,
  preferred_contact TEXT DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create orphans table
CREATE TABLE public.orphans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  age INTEGER NOT NULL CHECK (age > 0 AND age < 25),
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'partial', 'full')),
  monthly_amount DECIMAL(10, 2) NOT NULL CHECK (monthly_amount > 0),
  story TEXT,
  photo_url TEXT,
  intro_video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create sponsors table
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  country TEXT,
  preferred_contact TEXT DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create sponsorships table
CREATE TABLE public.sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orphan_id UUID REFERENCES public.orphans(id) ON DELETE CASCADE NOT NULL,
  sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('monthly', 'yearly')),
  monthly_amount DECIMAL(10, 2) NOT NULL CHECK (monthly_amount > 0),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  receipt_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create receipts table
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsorship_id UUID REFERENCES public.sponsorships(id) ON DELETE CASCADE NOT NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orphans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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
  )
$$;

-- Create function to check if user is admin or staff
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'staff')
  )
$$;

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orphans_updated_at
  BEFORE UPDATE ON public.orphans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sponsors_updated_at
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sponsorships_updated_at
  BEFORE UPDATE ON public.sponsorships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for orphans (public read, admin/staff write)
CREATE POLICY "Anyone can view orphans"
  ON public.orphans FOR SELECT
  USING (true);

CREATE POLICY "Admin and staff can manage orphans"
  ON public.orphans FOR ALL
  USING (public.is_admin_or_staff(auth.uid()));

-- RLS Policies for sponsors
CREATE POLICY "Sponsors can view their own data"
  ON public.sponsors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin and staff can view all sponsors"
  ON public.sponsors FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin can manage sponsors"
  ON public.sponsors FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create sponsor"
  ON public.sponsors FOR INSERT
  WITH CHECK (true);

-- RLS Policies for sponsorships
CREATE POLICY "Sponsors can view their sponsorships"
  ON public.sponsorships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sponsors s
      WHERE s.id = sponsor_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin and staff can view all sponsorships"
  ON public.sponsorships FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin and staff can manage sponsorships"
  ON public.sponsorships FOR ALL
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Anyone can create sponsorship"
  ON public.sponsorships FOR INSERT
  WITH CHECK (true);

-- RLS Policies for receipts
CREATE POLICY "Sponsors can view their receipts"
  ON public.receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sponsorships sp
      JOIN public.sponsors s ON s.id = sp.sponsor_id
      WHERE sp.id = sponsorship_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin and staff can view all receipts"
  ON public.receipts FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin and staff can manage receipts"
  ON public.receipts FOR ALL
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Anyone can create receipt"
  ON public.receipts FOR INSERT
  WITH CHECK (true);