declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_URL: string;
    DATABASE_URL: string;
    LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  }
}