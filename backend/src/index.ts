import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`NuzulJO API listening on port ${env.port}`);
});
