import { config, usingDevSecrets } from './config.js';
import { Store } from './lib/store.js';
import { createApp } from './app.js';

const store = new Store(config.dataFile);
const app = createApp({ store, config });

app.listen(config.port, () => {
  console.log(`MediContinuum Organization API → http://localhost:${config.port}`);
  console.log(`CORS allowed origins: ${config.corsOrigins.join(', ')}`);
  if (usingDevSecrets) console.warn('⚠  Using built-in dev secrets. Set JWT_SECRET and ID_PEPPER before deploying.');
});
