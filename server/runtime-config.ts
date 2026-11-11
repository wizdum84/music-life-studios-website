const REQUIRED_PRODUCTION_ENV = [
  "APP_ORIGIN",
  "DATABASE_URL",
  "SESSION_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

export function productionConfigurationErrors(env: NodeJS.ProcessEnv = process.env) {
  const errors: string[] = [];

  for (const name of REQUIRED_PRODUCTION_ENV) {
    if (!env[name]?.trim()) errors.push(`${name} is required`);
  }

  const origin = env.APP_ORIGIN?.trim();
  if (origin && !/^https:\/\/[^\s/]+(?:\/.*)?$/.test(origin)) {
    errors.push("APP_ORIGIN must be an HTTPS URL");
  }

  if (env.SESSION_SECRET && env.SESSION_SECRET.length < 32) {
    errors.push("SESSION_SECRET must contain at least 32 characters");
  }

  if (env.DATABASE_URL && !/^postgres(?:ql)?:\/\//.test(env.DATABASE_URL.trim())) {
    errors.push("DATABASE_URL must be a PostgreSQL connection URL");
  }

  return errors;
}

export function validateProductionConfiguration(env: NodeJS.ProcessEnv = process.env) {
  const errors = productionConfigurationErrors(env);
  if (errors.length > 0) {
    throw new Error(`Production configuration is invalid: ${errors.join("; ")}`);
  }
}
