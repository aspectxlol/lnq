// declare process.env variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PORT: string;

    DATABASE_URL: string;

    MINIO_URL: string;
    MINIO_ACCESS_KEY: string;
    MINIO_SECRET_KEY: string;
    MINIO_BUCKET_NAME: string;

    REDIS_HOST: string;

    CORS_ORIGIN: string;
    COOKIE_SECRET: string;

    JWT_SECRET: string;
  }
}
