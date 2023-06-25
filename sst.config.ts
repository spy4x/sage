import type { SSTConfig } from 'sst';
import { SvelteKitSite } from 'sst/constructs';
import { config } from 'dotenv';
const { parsed: environment } = config();

export default {
  config(_input) {
    return {
      name: 'sage',
      region: 'us-east-1',
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const site = new SvelteKitSite(stack, 'site', {
        timeout: '60 seconds',
        environment,
      });
      stack.addOutputs({
        url: site.url,
      });
    });
  },
} satisfies SSTConfig;
