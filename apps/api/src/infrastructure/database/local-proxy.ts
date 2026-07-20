import { neonConfig } from "@neondatabase/serverless";

// docker-compose.yml fronts plain Postgres with local-neon-http-proxy so
// @neondatabase/serverless (which only speaks Neon's HTTP protocol) can
// reach it. Only called when USE_LOCAL_DB_PROXY is set - real local/CI/prod
// DATABASE_URLs point at Neon directly and never touch this.
export const configureLocalNeonProxy = (): void => {
  neonConfig.fetchEndpoint = (host) => `http://${host}:4444/sql`;
};
