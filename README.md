# Express Auto Catch Router

[![npm version](https://img.shields.io/npm/v/@tumblewader/express-auto-catch-router.svg)](https://www.npmjs.com/package/@tumblewader/express-auto-catch-router)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/@tumblewader/express-auto-catch-router.svg)](https://www.npmjs.com/package/@tumblewader/express-auto-catch-router)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/tumblewader/express-auto-catch-router)
[![Dependencies](https://img.shields.io/badge/dependencies-1-brightgreen.svg)](https://github.com/tumblewader/express-auto-catch-router)
[![Node.js Version](https://img.shields.io/node/v/@tumblewader/express-auto-catch-router.svg)](https://nodejs.org)

Express Auto Catch Router is an enhanced Express router that
automatically wraps asynchronous route handlers. This allows you to write
cleaner code without worrying about wrapping every async function with
`try/catch` blocks to forward errors to Express's error-handling middleware.

## Features

-   **Automatic Error Handling:** Wraps `async/await` route handlers so that
    any unhandled errors or promise rejections are automatically caught and
    passed to `next()`.
-   **Broad Method Coverage:** Supports all HTTP methods (GET, POST, PUT,
    DELETE, etc.) as well as `use`, `all`, and `param`.
-   **Easy Integration:** Works seamlessly with your existing Express
    application without requiring modifications to your route handler
    signatures.
-   **Robust Async Detection:** Uses a reliable method to detect async
    functions ensuring only those functions are wrapped.
-   **Router Options Support:** Accepts all standard Express router options like caseSensitive, strict, and mergeParams.

## Installation

Install via npm:

```bash
npm install @tumblewader/express-auto-catch-router
```

Or with yarn:

```bash
yarn add @tumblewader/express-auto-catch-router
```

Note: This package is compatible with Express 4.x versions only.

## Usage

Replace your existing Express router with the enhanced router. For example:

```javascript
const express = require('express');
const AsyncRouter = require('@tumblewader/express-auto-catch-router');

// Create an instance of the enhanced router
const router = new AsyncRouter().getRouter();

// Or with router options
const routerWithOptions = new AsyncRouter({
  caseSensitive: true,
  strict: true,
  mergeParams: true
}).getRouter();

// Define a route without manual try/catch handling:
router.get('/user/:id', async (req, res) => {
  // Any error thrown here will be automatically caught and passed to next()
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new Error('User not found');
  }
  res.json(user);
});

// In your main app file
const app = express();
app.use('/api', router);

// Standard error-handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## API

### `AsyncRouter`

#### `constructor(options)`

Creates a new instance of the enhanced router and automatically patches
methods for async error handling.

**Parameters**:
- `options` (Object, optional): Router options object that will be passed to Express's Router.
  - `caseSensitive` (Boolean): Enable case sensitivity, default: false
  - `strict` (Boolean): Enable strict routing, default: false
  - `mergeParams` (Boolean): Preserve req.params values from parent router, default: false

#### `getRouter()`

Returns the underlying Express router instance with async error handling
automatically applied to all route methods.

## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for
improvements, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for
details.

## Repository

GitHub: <https://github.com/tumblewader/express-auto-catch-router>