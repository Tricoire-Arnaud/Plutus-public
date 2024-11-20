export const filterLogs = (req, res, next) => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  if (process.env.NODE_ENV === "production") {
    console.log = (...args) => {
      const sanitizedArgs = args.map((arg) =>
        typeof arg === "string"
          ? arg.replace(/\/api\/.*|\/emprunts\/\d+/, "[FILTERED]")
          : arg
      );
      originalConsoleLog.apply(console, sanitizedArgs);
    };

    console.error = (...args) => {
      const sanitizedArgs = args.map((arg) =>
        typeof arg === "string"
          ? arg.replace(/\/api\/.*|\/emprunts\/\d+/, "[FILTERED]")
          : arg
      );
      originalConsoleError.apply(console, sanitizedArgs);
    };
  }

  next();
};
