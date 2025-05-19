function errorHandler(err, req, res, next) {
  console.error('[Server Error]', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      path: req.path,
      method: req.method
  });

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({
          error: 'Invalid JSON',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
  }

  res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? {
          stack: err.stack,
          fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
      } : undefined
  });
}

// Экспортируем обработчик ошибок
export default errorHandler;
