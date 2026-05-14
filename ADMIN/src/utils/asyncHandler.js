/**
 * Wraps async route handlers to automatically catch errors
 * and forward them to the Express error handler.
 * @param {Function} fn - The async route handler function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
