export function ok(res, data, message = 'Success', statusCode = 200) {
    const payload = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(payload);
}
export function fail(res, message = 'An error occurred', statusCode = 400, errors = null, stack) {
    const payload = {
        success: false,
        message,
        errors,
        ...(process.env.NODE_ENV === 'development' && stack ? { stack } : {}),
    };
    return res.status(statusCode).json(payload);
}
