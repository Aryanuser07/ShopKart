import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';

describe('ShopKart API Test Suite', () => {
  
  describe('Health Check Endpoint', () => {
    it('should return 200 OK with service status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toContain('ShopKart');
    });
  });

  describe('Product Routes & Pagination', () => {
    it('GET /api/products should return paginated list of products capped at 50 max', async () => {
      const res = await request(app).get('/api/products?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.page).toBe(1);
      expect(res.body.products.length).toBeLessThanOrEqual(10);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('pages');
    });

    it('GET /api/products with requested limit 100 should enforce max limit cap of 50', async () => {
      const res = await request(app).get('/api/products?limit=100');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeLessThanOrEqual(50);
    });

    it('GET /api/products/:id should return single product details', async () => {
      const res = await request(app).get('/api/products/prod-1');
      expect(res.status).toBe(200);
      expect(res.body.product).toBeDefined();
      expect(res.body.product.title).toBeDefined();
    });
  });

  describe('Authentication & Validation Middleware', () => {
    it('POST /api/auth/register-otp should reject invalid email format', async () => {
      const res = await request(app).post('/api/auth/register-otp').send({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation Error');
    });

    it('POST /api/auth/send-otp should require valid email', async () => {
      const res = await request(app).post('/api/auth/send-otp').send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation Error');
    });

    it('POST /api/auth/verify-otp should require 6-digit OTP code', async () => {
      const res = await request(app).post('/api/auth/verify-otp').send({
        email: 'test@example.com',
        otp: '123'
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation Error');
    });
  });

  describe('Admin Security & Authorization', () => {
    it('GET /api/admin/analytics without JWT token should return 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/analytics');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Not authorized');
    });

    it('PUT /api/products/prod-1 without token should return 401 Unauthorized', async () => {
      const res = await request(app).put('/api/products/prod-1').send({ title: 'Hacked Title' });
      expect(res.status).toBe(401);
    });
  });

});
