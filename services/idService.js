import { pool } from '../db.js'; // Убедитесь, что у вас есть правильный путь и добавлено .js

export const getNextProductId = async () => {
  try {
    // Ищем первый свободный ID
    const [result] = await pool.query(`
      SELECT MIN(t1.id + 1) as next_id
      FROM products t1
      LEFT JOIN products t2 ON t1.id + 1 = t2.id
      WHERE t2.id IS NULL
      UNION
      SELECT 1 as next_id
      FROM dual
      WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1)
      LIMIT 1
    `);
    
    return result[0].next_id || 1;
  } catch (error) {
    console.error('Ошибка при получении следующего ID:', error);
    throw error;
  }
};
