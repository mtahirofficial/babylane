function ErrorsMiddleware(exception, request, response, next) {
  // Ensure we have a numeric status code and a message for all errors
  const status = Number.isInteger(exception && exception.status) ? exception.status : 500;
  const message = (exception && exception.message) || 'Internal Server Error';
  const errors = (exception && exception.errors) || null;

  // Send a safe response
  response.status(status).send({
    status,
    message,
    errors,
  });
}

module.exports = ErrorsMiddleware;
