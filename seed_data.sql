-- ============================================
-- ФЕЙКОВІ ДАНІ ДЛЯ OPE-71 (Car Detailes Saler)
-- ============================================
-- Встав у Supabase Dashboard > SQL Editor, виконай по черзі

-- 1. АВТОМОБІЛІ
INSERT INTO cars (vin, brand, model, year, engine) VALUES
('WBA3A5C5XDF123456', 'BMW', '3 Series', 2019, '2.0L Turbo B48'),
('WDB9634031L789012', 'Mercedes-Benz', 'S-Class', 2020, '3.0L Turbo M256'),
('WAUZZZ8V9KA123789', 'Audi', 'A6', 2023, '2.0L TFSI'),
('VF1RZ000X345678901', 'Renault', 'Megane', 2021, '1.5 dCi K9K'),
('WVWZZZ3CZJE567890', 'Volkswagen', 'Passat B8', 2018, '2.0 TDI CRLB'),
('YV1FWA2K7M2345678', 'Volvo', 'XC60', 2021, '2.0L T5 B420'),
('SALLAAA147A1234567', 'Land Rover', 'Range Rover', 2022, '3.0L Ingenium'),
('ZAR92200009543210', 'Fiat', 'Doblo', 2020, '1.3 Multijet'),
('XTA210406Y1234567', 'Lada', '2104', 2005, '1.6L VAZ-2106'),
('JTDKW963000345678', 'Toyota', 'Corolla', 2022, '1.8L Hybrid 2ZR-FXE');

-- 2. КАТЕГОРІЇ
INSERT INTO categories (name, description) VALUES
('Гальмівна система', 'Гальма, колодки, диски, циліндри'),
('Двигун', 'Двигун та його компоненти'),
('Підвіска', 'Амортизатори, пружини, важелі'),
('Електрика', 'Генератор, стартер, проводка'),
('Трансмісія', 'КПП, зчеплення, кардан'),
('Система охолодження', 'Радіатори, помпи, термостати'),
('Паливна система', 'Форсунки, насоси, фільтри'),
('Вихлопна система', 'Глушники, каталізатори, лямбда-зонди'),
('Кузов та оптика', 'Фари, бампери, дзеркала'),
('Фільтри', 'Оливні, повітряні, салонні, паливні');

--  3. ЗАПЧАСТИНИ (по категоріях)
-- Категорія 1: Гальмівна система
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'BRK-BMW-001', 'Гальмівні колодки BMW 3 Series (перед)', 'Оригінал Textar, комплект передніх колодок', id, 1850, 15, 2 FROM categories WHERE name='Гальмівна система';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'BRK-BMW-002', 'Гальмівний диск BMW 3 Series (перед)', 'Вентильований, 330мм, Zimmermann', id, 2900, 8, 3 FROM categories WHERE name='Гальмівна система';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'BRK-VW-001', 'Гальмівні колодки VW Passat B8 (зад)', 'TRW, комплект задніх колодок з датчиком', id, 1650, 20, 1 FROM categories WHERE name='Гальмівна система';

-- Категорія 2: Двигун
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'ENG-BMW-001', 'Ремінь ГРМ BMW B48', 'Dayton, комплект ГРМ з роликами', id, 4200, 5, 4 FROM categories WHERE name='Двигун';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'ENG-MB-001', 'Масляний насос Mercedes M256', 'Оригінал Mercedes, з приводами', id, 8500, 3, 7 FROM categories WHERE name='Двигун';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'ENG-VW-001', 'Форсунка VW 2.0 TDI CRLB', 'Bosch, дизельна форсунка Common Rail', id, 3200, 10, 2 FROM categories WHERE name='Двигун';

-- Категорія 3: Підвіска
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'SUS-BMW-001', 'Амортизатор передній BMW 3 Series', 'Bilstein B4, газомасляний', id, 3800, 6, 3 FROM categories WHERE name='Підвіска';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'SUS-AUDI-001', 'Важіль передній Audi A6', 'Лемішер, нижній передній', id, 2400, 12, 2 FROM categories WHERE name='Підвіска';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'SUS-VOLVO-001', 'Сайлентблок Volvo XC60', 'Powerflex, поліуретан', id, 950, 25, 1 FROM categories WHERE name='Підвіска';

-- Категорія 4: Електрика
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'ELEC-BMW-001', 'Генератор BMW 3 Series', 'Valeo, 150A, новий', id, 7200, 4, 5 FROM categories WHERE name='Електрика';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'ELEC-VW-001', 'Акумулятор VW Passat', 'Varta Blue Dynamic, 70Ah, 620A', id, 3400, 18, 1 FROM categories WHERE name='Електрика';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'ELEC-TOY-001', 'Стартер Toyota Corolla', 'Denso, 1.4kW, новий', id, 4500, 7, 3 FROM categories WHERE name='Електрика';

-- Категорія 5: Трансмісія
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'TRANS-BMW-001', 'Комплект зчеплення BMW 3 Series', 'Sachs, диск + кошик + вижимний', id, 6800, 4, 4 FROM categories WHERE name='Трансмісія';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'TRANS-VW-001', 'Масло DSG VW Passat B8', 'Shell, 1л, для коробок DQ200', id, 650, 40, 1 FROM categories WHERE name='Трансмісія';

-- Категорія 6: Охолодження
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'COOL-BMW-001', 'Радіатор BMW 3 Series', 'Nissens, алюміній, новий', id, 5100, 5, 3 FROM categories WHERE name='Система охолодження';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'COOL-MB-001', 'Помпа Mercedes M256', 'OEM Mercedes, з електроприводом', id, 9400, 3, 10 FROM categories WHERE name='Система охолодження';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'COOL-VW-001', 'Термостат VW 2.0 TDI', 'Mahle, 87°C, оригінал', id, 1200, 15, 2 FROM categories WHERE name='Система охолодження';

-- Категорія 7: Паливо
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'FUEL-BMW-001', 'Паливний насос BMW 3 Series', 'VDO, занурювальний, 6Bar', id, 4300, 5, 4 FROM categories WHERE name='Паливна система';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'FUEL-VW-001', 'Форсунка VW 1.9 TDI', 'Bosch, насос-форсунка', id, 5500, 8, 3 FROM categories WHERE name='Паливна система';

-- Категорія 8: Вихлоп
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'EXH-BMW-001', 'Каталізатор BMW 3 Series', 'HJS, керамічний, 400 cell', id, 12000, 2, 7 FROM categories WHERE name='Вихлопна система';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'EXH-VW-001', 'Глушник задній VW Passat', 'Walker, нержавійка', id, 3500, 6, 3 FROM categories WHERE name='Вихлопна система';
INSERT INTO parts (code, name, description, category_id, price, stock, delivery_days) 
SELECT 'EXH-VW-002', 'Лямбда-зонд VW Passat B8', 'Bosch, передній, wideband', id, 2800, 12, 1 FROM categories WHERE name='Вихлопна система';

-- 4. ЗАМОВЛЕННЯ
INSERT INTO orders (customer_name, customer_phone, customer_email, status, total) VALUES
('Олександр Ковальчук', '+380501234567', 'oleksandr@example.com', 'new', 4700),
('Марія Іваненко', '+380671112233', 'maria@example.com', 'processing', 3400),
('Андрій Петренко', '+380934445566', 'andrii@example.com', 'completed', 1850),
('Юрій Бондар', '+380632223344', 'yurii@example.com', 'cancelled', 8100),
('Тетяна Шевченко', '+380991231212', 'tetiana@example.com', 'new', 2350);

-- 5. АНАЛОГИ
INSERT INTO analogs (part_id, analog_part_id, type, note)
SELECT a.id, b.id, 'direct', 'Повна сумісність'
FROM parts a, parts b WHERE a.code='BRK-BMW-001' AND b.code='BRK-VW-001';

INSERT INTO analogs (part_id, analog_part_id, type, note)
SELECT a.id, b.id, 'oem', 'Аналог Bosch'
FROM parts a, parts b WHERE a.code='ENG-VW-001' AND b.code='FUEL-VW-001';
