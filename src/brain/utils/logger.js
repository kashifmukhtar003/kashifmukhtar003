const winston = require("winston");

const levels = {
    error: 0,
    warn: 1,
    crit:2,
    info: 3,
    http: 4,
    debug: 5,
};

const level = () => {
    let logLevel = "warn";
    const env = process.env.NODE_ENV || "development";
    const isDevelopment = env === "development";
    if (isDevelopment) {
        logLevel = "debug";
    }
    if (process.env.LOG_LEVEL) {
        if (process.env.LOG_LEVEL in levels) {
            logLevel = process.env.LOG_LEVEL;
        } else {
            logger.warn(
                `Unsupported log level supplied in ENV vars: ${process.env.LOG_LEVEL}`
            );
        }
    }
    return logLevel;
};

const colors = {
    error: "red",
    warn: "yellow",
    crit: "blue",
    info: "green",
    http: "magenta",
    debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

const transports = [
    new winston.transports.Console(),
    new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
    }),
    new winston.transports.File({ filename: "logs/all.log" }),
];

const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});

module.exports = logger;