import { defineConfig } from '@hey-api/openapi-ts';

// Both the spec and the client are build artifacts: `npm run generate-client`
// exports the spec from the running backend code, then regenerates lib/api.
export default defineConfig({
  input: './openapi.json',
  output: { path: './lib/api', postProcess: [] },
  plugins: ['@hey-api/client-fetch'],
});
