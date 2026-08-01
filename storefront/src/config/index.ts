function getEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const config = {
  apiUrl: getEnv('VITE_API_URL'),
} as const;
