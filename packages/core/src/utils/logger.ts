import { LogLevel } from "../types.js";

const PREFIXES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "\x1b[90m[sl:debug]\x1b[0m",
  [LogLevel.INFO]: "\x1b[36m[sl:info]\x1b[0m",
  [LogLevel.WARN]: "\x1b[33m[sl:warn]\x1b[0m",
  [LogLevel.ERROR]: "\x1b[31m[sl:error]\x1b[0m",
  [LogLevel.SILENT]: "",
};

export class Logger {
  constructor(private level: LogLevel = LogLevel.INFO) {}

  debug(msg: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG)
      console.debug(PREFIXES[LogLevel.DEBUG], msg, ...args);
  }

  info(msg: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO)
      console.info(PREFIXES[LogLevel.INFO], msg, ...args);
  }

  warn(msg: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN)
      console.warn(PREFIXES[LogLevel.WARN], msg, ...args);
  }

  error(msg: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR)
      console.error(PREFIXES[LogLevel.ERROR], msg, ...args);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}
