import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

app.listen(PORT, () => {
  console.log(`🚀 [ShopKart Server] Running on http://localhost:${PORT}`);
  console.log(`⚡ API Endpoints active: /api/auth, /api/products, /api/orders, /api/admin`);
});

export default app;
