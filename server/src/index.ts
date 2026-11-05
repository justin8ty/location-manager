import { createApp } from "./app";
import { createDb } from "./db";
import { loadEnv } from "./env";

const env = loadEnv();

const app = createApp({
  db: createDb(env.DATABASE_URL),
  jwtSecret: env.JWT_SECRET,
  secureCookies: env.NODE_ENV === "production",
});

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});
