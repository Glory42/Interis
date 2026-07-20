import { neonConfig } from "@neondatabase/serverless";

// docker-compose.yml fronts a plain postgres:16-alpine container with
// ghcr.io/timowilhelm/local-neon-http-proxy so @neondatabase/serverless (which
// only speaks Neon's HTTP protocol, never the Postgres wire protocol) can
// reach it. Only called when USE_LOCAL_DB_PROXY is set, which docker-compose
// is the sole source of - real local/CI/prod DATABASE_URLs point at Neon
// directly and never touch this.
export const configureLocalNeonProxy = (): void => {
  neonConfig.fetchEndpoint = (host) => `http://${host}:4444/sql`;
};
