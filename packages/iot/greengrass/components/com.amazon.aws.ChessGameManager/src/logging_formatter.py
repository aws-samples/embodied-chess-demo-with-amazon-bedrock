import logging


class ColoredFormatter(logging.Formatter):

    grey = "\x1b[38;20m"
    magenta = "\x1b[35;20m"
    blue = "\x1b[34;20m"
    yellow = "\x1b[33;20m"
    red = "\x1b[31;20m"
    bold_red = "\x1b[31;1m"
    green = "\x1b[32;20m"
    aqua = "\x1b[38;2;145;231;255m"
    pencil = "\x1b[38;2;253;182;0m"
    reset = "\x1b[0m"
    format = "%(asctime)s - %(funcName)s:%(lineno)d - %(levelname)s - %(message)s"

    FORMATS = {
        logging.DEBUG: grey + format + reset,
        logging.INFO: aqua + format + reset,
        logging.WARNING: yellow + format + reset,
        logging.ERROR: red + format + reset,
        logging.CRITICAL: green + format + reset,
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)
