// Error handling middleware
export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.status(500).json({ error: 'Internal server error' });
}