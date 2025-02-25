const AsyncRouter = require('../index');
const express = require('express');
const request = require('supertest');
const methods = require('methods');

describe('AsyncRouter', () => {
  // Unit tests
  describe('Unit Tests', () => {
    test('should create instance with router', () => {
      const asyncRouter = new AsyncRouter();
      expect(asyncRouter.router).toBeDefined();
      expect(asyncRouter.getRouter()).toBe(asyncRouter.router);
    });

    test('should identify async functions correctly', () => {
      const asyncRouter = new AsyncRouter();
      const asyncFn = async () => {};
      const normalFn = () => {};
      
      expect(asyncRouter._isAsyncFunction(asyncFn)).toBe(true);
      expect(asyncRouter._isAsyncFunction(normalFn)).toBe(false);
      expect(asyncRouter._isAsyncFunction(null)).toBe(false);
      expect(asyncRouter._isAsyncFunction({})).toBe(false);
    });

    test('should skip patching non-function properties', () => {
      // Create a mock Express router with a non-function property
      const mockRouter = {
        get: jest.fn(),
        post: jest.fn(),
        nonFunctionProperty: 'string value'
      };
      
      // Mock express.Router to return our mock
      jest.spyOn(express, 'Router').mockReturnValue(mockRouter);
      
      // Create AsyncRouter - this will patch the methods
      const asyncRouter = new AsyncRouter();
      
      // Verify non-function property was skipped and remains unchanged
      expect(mockRouter.nonFunctionProperty).toBe('string value');
      
      // Restore original implementation
      express.Router.mockRestore();
    });

    test('should wrap only async functions in arguments', () => {
      const asyncFn = async () => {};
      const regularFn = () => {};
      const notAFunction = 'string';

      // Create a mock function for get
      const mockGet = jest.fn();
      // Create a mock router object
      const mockRouter = { get: mockGet };

      // Spy on express.Router to return our mockRouter when constructing AsyncRouter
      const routerSpy = jest.spyOn(express, 'Router').mockReturnValue(mockRouter);

      // Now create the AsyncRouter instance which will use the mock router
      const asyncRouter = new AsyncRouter();

      // Call the patched get method on our router
      asyncRouter.router.get('/path', regularFn, asyncFn, notAFunction);

      expect(mockGet).toHaveBeenCalled();
      const calledWith = mockGet.mock.calls[0];

      // First arg should be unchanged
      expect(calledWith[0]).toBe('/path');

      // Second arg (regular function) should be unchanged
      expect(calledWith[1]).toBe(regularFn);

      // Third arg (async function) should be wrapped
      expect(calledWith[2]).not.toBe(asyncFn);
      expect(typeof calledWith[2]).toBe('function');

      // Fourth arg (not a function) should be unchanged
      expect(calledWith[3]).toBe(notAFunction);

      // Restore the original express.Router implementation
      routerSpy.mockRestore();
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    let app;
    let router;
    
    beforeEach(() => {
      app = express();
      router = new AsyncRouter().getRouter();
    });
    
    test('should catch errors in async route handlers', async () => {
      router.get('/error', async (req, res) => {
        throw new Error('Test error');
      });
      
      app.use(router);
      app.use((err, req, res, next) => {
        res.status(500).json({ error: err.message });
      });
      
      const response = await request(app).get('/error');
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Test error');
    });
    
    test('should work with successful async handlers', async () => {
      router.get('/success', async (req, res) => {
        res.json({ success: true });
      });
      
      app.use(router);
      
      const response = await request(app).get('/success');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should work with router.use() middlewares', async () => {
      router.use((req, res, next) => {
        req.middlewareRan = true;
        next();
      });
      
      router.get('/middleware', (req, res) => {
        res.json({ middlewareRan: req.middlewareRan });
      });
      
      app.use(router);
      
      const response = await request(app).get('/middleware');
      expect(response.status).toBe(200);
      expect(response.body.middlewareRan).toBe(true);
    });
    
    test('should work with router.all()', async () => {
      router.all('/all', async (req, res) => {
        res.json({ method: req.method });
      });
      
      app.use(router);
      
      const getResponse = await request(app).get('/all');
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.method).toBe('GET');
    });

    test('should catch errors from async middleware', async () => {
      // Middleware that throws an error
      router.use(async (req, res, next) => {
        throw new Error('Middleware error');
      });
      
      router.get('/middleware-error', (req, res) => {
        // This shouldn't be reached
        res.json({ success: true });
      });
      
      app.use(router);
      app.use((err, req, res, next) => {
        res.status(500).json({ error: err.message });
      });
      
      const response = await request(app).get('/middleware-error');
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Middleware error');
    });

    test('should support route chaining with async handlers', async () => {
      router.route('/chain')
        .get(async (req, res) => {
          res.json({ method: 'GET' });
        })
        .post(async (req, res) => {
          res.json({ method: 'POST' });
        });
      
      app.use(router);
      
      const getResponse = await request(app).get('/chain');
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.method).toBe('GET');
      
      const postResponse = await request(app).post('/chain');
      expect(postResponse.status).toBe(200);
      expect(postResponse.body.method).toBe('POST');
    });

    test('should handle multiple middleware functions with async functions', async () => {
      router.get('/multiple', 
        async (req, res, next) => {
          req.value1 = 'first';
          next();
        },
        (req, res, next) => {
          req.value2 = 'second';
          next();
        },
        async (req, res) => {
          res.json({ 
            value1: req.value1,
            value2: req.value2
          });
        }
      );
      
      app.use(router);
      
      const response = await request(app).get('/multiple');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        value1: 'first',
        value2: 'second'
      });
    });
  });
}); 