import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`[worknow] API escuchando en http://localhost:${env.port} (${env.node})`);
});