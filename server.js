import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Получаем текущую директорию
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Инициализация Express
const app = express();

// Подключение к SQLite
const dbPath = path.join(__dirname, 'database.sql');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Импорты роутов
import productRouter from './routes/product.js';
import manufacturersRouter from './routes/manufacturers.js';
import categoriesRouter from './routes/categories.js';

// Создаем папку uploads, если её нет
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  exposedHeaders: ['Content-Disposition']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Настройка Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Инициализация базы данных
function initializeDatabase() {
  try {
    // Проверяем, нужно ли инициализировать БД
    const tablesExist = db.prepare(`
      SELECT count(*) as count FROM sqlite_master 
      WHERE type='table' AND name IN ('categories', 'manufacturers', 'products', 'photos')
    `).get().count === 4;

    if (!tablesExist) {
      console.log('Инициализация структуры БД...');
      const initScript = fs.readFileSync(path.join(__dirname, 'database', 'init.sql'), 'utf8');
      db.exec(initScript);
    }

    // Проверяем наличие базовых данных
    const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    const manufacturersCount = db.prepare('SELECT COUNT(*) as count FROM manufacturers').get().count;

    if (categoriesCount === 0 || manufacturersCount === 0) {
      console.log('Добавление тестовых данных...');
      const initDataScript = fs.readFileSync(path.join(__dirname, 'database', 'init-data.sql'), 'utf8');
      db.exec(initDataScript);
    }

    console.log('База данных готова к работе');
  } catch (err) {
    console.error('Ошибка инициализации БД:', err);
    throw err; // Прерываем запуск при ошибке инициализации БД
  }
}
// Подключение роутов
app.use('/api/products', productRouter(upload));
app.use('/api/categories', categoriesRouter);
app.use('/api/manufacturers', manufacturersRouter);

// Тестовый роут для загрузки файлов
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

process.on('SIGINT', () => {
  console.log('Закрытие соединения с БД...');
  db.close();
  process.exit();
});

// Инициализация и запуск сервера
initializeDatabase();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`Путь к базе данных: ${dbPath}`);
  console.log(`Путь к загрузкам: ${uploadsDir}`);
});