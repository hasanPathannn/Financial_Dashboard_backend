import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Production-ready modular server running on http://localhost:${PORT}`);
});