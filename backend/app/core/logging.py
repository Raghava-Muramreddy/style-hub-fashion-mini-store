from logging.config import dictConfig


def configure_logging() -> None:
    dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {"format": "%(asctime)s %(levelname)s %(name)s %(message)s"}
        },
        "handlers": {
            "default": {"class": "logging.StreamHandler", "formatter": "standard"}
        },
        "loggers": {
            "app": {"handlers": ["default"], "level": "INFO", "propagate": False}
        },
    })
