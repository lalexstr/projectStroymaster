import express from 'express';
import { db } from '../db.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем текущую директорию
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

export default (upload) => {
  // Вставка нового товара
  router.post('/', upload.array('photos'), (req, res) => {
    try {
      const { name, description, price, category_id, manufacturer_id } = req.body;
      
      // Проверка обязательных полей
      if (!name || !price || !category_id || !manufacturer_id) {
        return res.status(400).json({ error: "Не заполнены обязательные поля" });
      }

      // Начинаем транзакцию
      db.prepare('BEGIN').run();

      try {
        // 1. Создаем товар
        const productResult = db.prepare(
          'INSERT INTO products (name, description, price, category_id, manufacturer_id) VALUES (?, ?, ?, ?, ?)'
        ).run(name, description, price, category_id, manufacturer_id);
        
        const productId = productResult.lastInsertRowid;

        // 2. Сохраняем фотографии
        if (req.files && req.files.length > 0) {
          const insertPhoto = db.prepare(
            'INSERT INTO photos (product_id, photo_path) VALUES (?, ?)'
          );
          
          for (const file of req.files) {
            insertPhoto.run(productId, `/uploads/${file.filename}`);
          }
        }

        db.prepare('COMMIT').run();

        // 3. Получаем созданный товар с фотографиями
        const newProduct = db.prepare(`
          SELECT p.*, 
            c.name as category_name,
            m.name as manufacturer_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
          WHERE p.id = ?
        `).get(productId);

        // Получаем фотографии отдельно
        const photos = db.prepare(
          'SELECT photo_path FROM photos WHERE product_id = ?'
        ).all(productId);

        const product = {
          ...newProduct,
          photos: photos.map(p => p.photo_path)
        };

        res.status(201).json(product);
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('Ошибка при создании товара:', error);
      res.status(500).json({ 
        error: "Ошибка сервера",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Обновление товара
  router.put('/:id', upload.array('photos'), (req, res) => {
    const productId = req.params.id;
    const { name, description, price, category_id, manufacturer_id } = req.body;

    try {
      db.prepare('BEGIN').run();

      try {
        // 1. Обновляем основную информацию о товаре
        const result = db.prepare(`
          UPDATE products 
          SET name = ?, description = ?, price = ?, category_id = ?, manufacturer_id = ?
          WHERE id = ?
        `).run(name, description, price, category_id, manufacturer_id, productId);

        if (result.changes === 0) {
          db.prepare('ROLLBACK').run();
          return res.status(404).json({ error: 'Товар не найден' });
        }

        // 2. Обновляем фотографии (если есть новые)
        if (req.files && req.files.length > 0) {
          // Удаляем старые фотографии
          db.prepare('DELETE FROM photos WHERE product_id = ?').run(productId);
          
          // Добавляем новые
          const insertPhoto = db.prepare(
            'INSERT INTO photos (product_id, photo_path) VALUES (?, ?)'
          );
          
          for (const file of req.files) {
            insertPhoto.run(productId, `/uploads/${file.filename}`);
          }
        }

        db.prepare('COMMIT').run();

        // 3. Получаем обновленный товар
        const updatedProduct = db.prepare(`
          SELECT p.*, 
            c.name as category_name,
            m.name as manufacturer_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
          WHERE p.id = ?
        `).get(productId);

        // Получаем фотографии
        const photos = db.prepare(
          'SELECT photo_path FROM photos WHERE product_id = ?'
        ).all(productId);

        res.json({
          ...updatedProduct,
          photos: photos.map(p => p.photo_path)
        });
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('Ошибка при обновлении товара:', error);
      res.status(500).json({ 
        error: 'Ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Удаление товара
  router.delete('/:id', (req, res) => {
    const productId = req.params.id;

    try {
      db.prepare('BEGIN').run();

      try {
        // 1. Сначала удаляем все фотографии товара
        db.prepare('DELETE FROM photos WHERE product_id = ?').run(productId);

        // 2. Затем удаляем сам товар
        const result = db.prepare('DELETE FROM products WHERE id = ?').run(productId);

        if (result.changes === 0) {
          db.prepare('ROLLBACK').run();
          return res.status(404).json({ error: 'Товар не найден' });
        }

        db.prepare('COMMIT').run();
        res.json({ success: true });
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('Ошибка при удалении:', error);
      res.status(500).json({ 
        error: 'Не удалось удалить товар',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Получение категорий
  router.get('/categories', (req, res) => {
    try {
      const results = db.prepare('SELECT * FROM categories').all();
      res.json(results);
    } catch (error) {
      console.error('Ошибка при получении категорий:', error);
      res.status(500).json({ 
        error: 'Ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Получение производителей
  router.get('/manufacturers', (req, res) => {
    try {
      const results = db.prepare('SELECT * FROM manufacturers').all();
      res.json(results);
    } catch (error) {
      console.error('Ошибка при получении производителей:', error);
      res.status(500).json({ 
        error: 'Ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Получение всех товаров с фотографиями
  router.get('/', (req, res) => {
    try {
      // 1. Получаем товары
      const products = db.prepare(`
        SELECT 
          p.id,
          p.name,
          p.description,
          p.price,
          p.category_id,
          p.manufacturer_id,
          c.name as category_name,
          m.name as manufacturer_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        ORDER BY p.id DESC
      `).all();

      // 2. Получаем все фотографии одним запросом
      const photos = db.prepare(`
        SELECT product_id, photo_path 
        FROM photos
        WHERE photo_path IS NOT NULL
      `).all();

      // 3. Группируем фотографии
      const photosMap = photos.reduce((map, photo) => {
        map[photo.product_id] = map[photo.product_id] || [];
        map[photo.product_id].push(photo.photo_path);
        return map;
      }, {});

      // 4. Формируем ответ
      const result = products.map(product => ({
        ...product,
        photos: photosMap[product.id] || []
      }));

      res.json(result);
    } catch (error) {
      console.error('Ошибка при получении товаров:', error);
      res.status(500).json({ 
        error: 'Ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Получение товара по ID
  router.get('/:id', (req, res) => {
    const productId = req.params.id;

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Неверный ID товара' });
    }

    try {
      // 1. Получаем основную информацию о товаре
      const product = db.prepare(`
        SELECT 
          p.*,
          c.name as category_name,
          m.name as manufacturer_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        WHERE p.id = ?
        LIMIT 1
      `).get(productId);

      if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
      }

      // 2. Получаем фотографии
      const photos = db.prepare(
        `SELECT photo_path FROM photos WHERE product_id = ? AND photo_path IS NOT NULL`
      ).all(productId);

      // 3. Формируем результат
      const result = {
        ...product,
        photos: photos.map(p => p.photo_path)
      };

      res.json(result);
    } catch (error) {
      console.error('Ошибка при получении товара:', error);
      res.status(500).json({ 
        error: 'Ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  return router;
};