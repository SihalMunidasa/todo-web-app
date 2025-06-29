/**
 * Custom Error Class for application-specific errors
 * @extends Error
 */
class AppError extends Error {
    /**
     * Create a custom application error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} [errorType='operational'] - Error type (operational or programming)
     */
    constructor(message, statusCode, errorType = 'operational') {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.errorType = errorType;
        this.isOperational = errorType === 'operational';

        // Capture stack trace for better debugging
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const globalErrorHandler = (err, req, res, next) => {
    // Default to 500 if status code not provided
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log operational errors to console
    if (process.env.NODE_ENV === 'development') {
        console.error('ERROR', err);
    }

    // Handle JWT errors specifically
    if (err.name === 'JsonWebTokenError') {
        err = new AppError('Invalid Token. Please log in again!', 401);
    } else if (err.name === 'TokenExpiredError') {
        err = new AppError('Your token has expired! Please log in again.', 401);
    }

    // Send error response to client
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

export { AppError, globalErrorHandler };