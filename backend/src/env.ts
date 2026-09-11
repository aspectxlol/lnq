export type NodeEnv = "development" | "test" | "production";

type BaseEnv = {
  NODE_ENV: NodeEnv;
  PORT: number;
  HOST: string;
  CORS_ORIGIN?: string;
  COOKIE_SECRET?: string;
};

export type AppEnv = BaseEnv & {
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
};

export type AuthEnv = BaseEnv & {
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
};

export type DbEnv = BaseEnv & {
  DATABASE_URL: string;
};

export type GoogleEnv = BaseEnv & {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
};

type EnvScope = "app" | "auth" | "db" | "google";

function requireNonEmpty(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePort(rawPort: string | undefined): number {
  if (!rawPort) return 3001;
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
}

function getNodeEnv(): NodeEnv {
  const nodeEnv = (process.env.NODE_ENV ?? "development") as NodeEnv;

  if (
    nodeEnv !== "development" &&
    nodeEnv !== "test" &&
    nodeEnv !== "production"
  ) {
    throw new Error("NODE_ENV must be one of: development | test | production");
  }

  return nodeEnv;
}

function getBaseEnv(): BaseEnv {
  const NODE_ENV = getNodeEnv();
  const CORS_ORIGIN = process.env.CORS_ORIGIN?.trim() || undefined;
  const COOKIE_SECRET = process.env.COOKIE_SECRET?.trim() || undefined;

  if (NODE_ENV === "production" && !COOKIE_SECRET) {
    throw new Error(
      "Missing required environment variable: COOKIE_SECRET (required in production)",
    );
  }

  if (NODE_ENV === "production" && !CORS_ORIGIN) {
    throw new Error(
      "Missing required environment variable: CORS_ORIGIN (required in production)",
    );
  }

  return {
    NODE_ENV,
    PORT: parsePort(process.env.PORT),
    HOST: process.env.HOST || "0.0.0.0",
    CORS_ORIGIN,
    COOKIE_SECRET,
  };
}

export function validateEnv(scope?: "app"): AppEnv;
export function validateEnv(scope: "auth"): AuthEnv;
export function validateEnv(scope: "db"): DbEnv;
export function validateEnv(scope: "google"): GoogleEnv;
export function validateEnv(scope: EnvScope = "app") {
  const base = getBaseEnv();

  if (scope === "auth") {
    return {
      ...base,
      JWT_ACCESS_SECRET: requireNonEmpty("JWT_ACCESS_SECRET"),
      JWT_REFRESH_SECRET: requireNonEmpty("JWT_REFRESH_SECRET"),
    };
  }

  if (scope === "db") {
    return {
      ...base,
      DATABASE_URL: requireNonEmpty("DATABASE_URL"),
    };
  }

  if (scope === "google") {
    return {
      ...base,
      GOOGLE_CLIENT_ID: requireNonEmpty("GOOGLE_CLIENT_ID"),
      GOOGLE_CLIENT_SECRET: requireNonEmpty("GOOGLE_CLIENT_SECRET"),
      GOOGLE_CALLBACK_URL: requireNonEmpty("GOOGLE_CALLBACK_URL"),
    };
  }

  return {
    ...base,
    DATABASE_URL: requireNonEmpty("DATABASE_URL"),
    JWT_ACCESS_SECRET: requireNonEmpty("JWT_ACCESS_SECRET"),
    JWT_REFRESH_SECRET: requireNonEmpty("JWT_REFRESH_SECRET"),
    GOOGLE_CLIENT_ID: requireNonEmpty("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: requireNonEmpty("GOOGLE_CLIENT_SECRET"),
    GOOGLE_CALLBACK_URL: requireNonEmpty("GOOGLE_CALLBACK_URL"),
  };
}
