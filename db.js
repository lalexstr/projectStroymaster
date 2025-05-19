import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { error } from 'console';

// Путь к файлу базы данных SQLite
const dbPath = path.join(process.cwd(), 'database', 'shop.db');

// Подключение к SQLite базе данных 
export const db = new Database(dbPath, { 
  verbose: console.log // Опционально: логирование запросов
});

// Функция инициализации базы данных
export async function initializeDatabase() {
  try {
    // Включение поддержки внешних ключей
    db.pragma('foreign_keys = ON');
    
    // Чтение SQL-скрипта
    const sqlScript = fs.readFileSync(
      path.join(process.cwd(), 'database', 'init.sql'), 
      'utf8'
    );
    // Разделение скрипта на отдельные запросы
    const queries = sqlScript.split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    // Выполнение каждого запроса
    for (const query of queries) {
      try {
        db.prepare(query).run();
      } catch (error) {
        console.warn(`Предупреждение при выполнении запроса: ${error.message}`);
      }
    }

    console.log('База данных SQLite инициализирована успешно');
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
    throw error;
  }
}
// Создание Express приложения
export const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:5173/admin', 
  credentials: true
}));

// Функция запуска сервера
export async function startServer() {
  try {
    await initializeDatabase();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
      console.log(`База данных SQLite: ${dbPath}`);
    });
  } catch (error) {
    console.error('Не удалось запустить сервер:', error);
    process.exit(1);
  }
}

// Запуск сервера, если файл выполняется напрямую
if (import.meta.url === new URL(import.meta.url).href) {
  startServer();
}
