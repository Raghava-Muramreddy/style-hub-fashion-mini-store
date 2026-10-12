class AppError(Exception):
    pass


class AuthenticationError(AppError):
    pass


class AuthorizationError(AppError):
    pass


class ResourceNotFoundError(AppError):
    pass


class ValidationError(AppError):
    pass
