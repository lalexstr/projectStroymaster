import express from 'express';
import { db } from '../db.js'; // Импортируем db вместо pool

const router = express.Router();

/**
 * Получение всех производителей
 */
router.get('/', (req, res) => {
  try {
    // 1. Проверяем наличие дубликатов
    const duplicates = db.prepare(`
      SELECT name, COUNT(*) as count 
      FROM manufacturers 
      GROUP BY name 
      HAVING count > 1
    `).all();

    if (duplicates.length > 0) {
      console.warn('Обнаружены дубликаты производителей:', duplicates);

      // Автоматически чистим дубликаты
      db.exec(`
        CREATE TEMPORARY TABLE temp_manufacturers AS
        SELECT MIN(id) as id, name, description
        FROM manufacturers
        GROUP BY name;
        
        DELETE FROM manufacturers;
        
        INSERT INTO manufacturers (id, name, description)
        SELECT id, name, description FROM temp_manufacturers;
        
        DROP TABLE temp_manufacturers;
      `);
    }

    // 2. Получаем всех производителей
    const manufacturers = db.prepare(`
      SELECT 
        id,
        name,
        description,
        (SELECT COUNT(*) FROM products WHERE manufacturer_id = manufacturers.id) as product_count
      FROM manufacturers
      ORDER BY id ASC
    `).all();

    res.json(manufacturers);
  } catch (error) {
    console.error('Ошибка при получении производителей:', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Экспортируем маршрутизатор
export default router;