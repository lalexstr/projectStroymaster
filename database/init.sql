-- Включение поддержки внешних ключей
PRAGMA foreign_keys = ON;

-- Создание таблицы категорий
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
);

-- Создание таблицы производителей
CREATE TABLE IF NOT EXISTS manufacturers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
);

-- Создание таблицы продуктов
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category_id INTEGER,
    manufacturer_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id)
);

-- Создание таблицы фотографий
CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    photo_path TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Тестовые данные для категорий
INSERT OR IGNORE INTO categories (name) VALUES
('Экскаватор на гусеничном ходу'),
('Экскаватор на колесном ходу'),
('Самосвал'),
('Фронтальный погрузчик'),
('Автокран «Урал»'),
('Автобетоносмесители'),
('Грузовой тягач'),
('Грузовой тягач с полуприцепом'),
('Доставка и вывоз экскаватора'),
('Грузовик бортовой с гидроманипулятором'),
('Грузовой фургон «бабочка»'),
('Илосос'),
('Вкручивание винтовых свай'),
('Автовышка на базе автокрана'),
('Скальник, сланец'),
('ПГС'),
('Песок речной'),
('Песок амурский'),
('Щебень'),
('Отсев'),
('Глина'),
('Марочный бетон');

-- Тестовые данные для производителей
INSERT OR IGNORE INTO manufacturers (name) VALUES ('СтройМастер');