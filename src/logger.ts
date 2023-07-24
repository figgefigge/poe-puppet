import winston from 'winston';

// Create a custom log format with a package identifier
const packageIdentifier = 'camelPoe'; // Replace with your package name

const myLogFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${packageIdentifier}] [${level}]: ${message}`;
});

// Create a winston logger instance with the custom format
const logger = winston.createLogger({ // Use the custom log format
  transports: [new winston.transports.Console(
    {
      format: winston.format.combine(
        winston.format.colorize(), // Add color to log levels (optional)
        winston.format.timestamp({ format: 'HH:mm' }), // Add timestamp with [hh:mm] format
        winston.format.align(),
        winston.format.splat(),
        winston.format.simple(),
        myLogFormat)}
  )], 
});

export default logger;
