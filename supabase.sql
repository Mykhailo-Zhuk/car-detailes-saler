-- OPE-71: Car Parts - Таблиці для каталогу автозапчастин

-- Cars
CREATE TABLE IF NOT EXISTS cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin TEXT UNIQUE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  engine TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parts
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  price INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  delivery_days INTEGER,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analogs
CREATE TABLE IF NOT EXISTS analogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  analog_part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'direct',
  note TEXT DEFAULT ''
);

-- Schemas
CREATE TABLE IF NOT EXISTS schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  items JSONB DEFAULT '[]',
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','processing','completed','cancelled')),
  total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Індекси
CREATE INDEX IF NOT EXISTS idx_parts_code ON parts(code);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category_id);
CREATE INDEX IF NOT EXISTS idx_parts_car ON parts(car_id);
CREATE INDEX IF NOT EXISTS idx_cars_vin ON cars(vin);
CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand);

-- Storage bucket для схем
-- INSERT INTO storage.buckets (id, name, public) VALUES ('schemas', 'schemas', true) ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Публічний доступ на читання
CREATE POLICY "cars_read" ON cars FOR SELECT USING (true);
CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);
CREATE POLICY "parts_read" ON parts FOR SELECT USING (true);
CREATE POLICY "analogs_read" ON analogs FOR SELECT USING (true);
CREATE POLICY "schemas_read" ON schemas FOR SELECT USING (true);

-- Для адмінів
CREATE POLICY "cars_write" ON cars FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "categories_write" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "parts_write" ON parts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "analogs_write" ON analogs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "schemas_write" ON schemas FOR ALL USING (auth.role() = 'authenticated');

-- Orders - може створювати будь-хто, читати тільки адмін
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (auth.role() = 'authenticated');
