const express = require('express');
const methods = require('methods');

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

class AsyncRouter {
  constructor(options = {}) {
    this.router = express.Router(options);
    this._patchMethods();
  }

  _patchMethods() {
    const httpMethods = [...methods, 'all', 'use', 'param'];
    httpMethods.forEach(method => {
      const original = this.router[method];
      if (typeof original !== 'function') return;
      this.router[method] = (...args) => {
        const wrappedArgs = args.map(arg => {
          if (typeof arg === 'function' && this._isAsyncFunction(arg)) {
            return asyncHandler(arg);
          }
          return arg;
        });
        return original.apply(this.router, wrappedArgs);
      };
    });
  }

  _isAsyncFunction(fn) {
    return Object.prototype.toString.call(fn) === '[object AsyncFunction]';
  }

  getRouter() {
    return this.router;
  }
}

module.exports = AsyncRouter;