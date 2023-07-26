import type { SSTConfig } from 'sst';
import { SvelteKitSite } from 'sst/constructs';
import { config } from 'dotenv';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
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
        customDomain:
          app.stage === 'spy4x'
            ? {
                domainName: 'sage.antonshubin.com',
                isExternalDomain: true,
                cdk: {
                  certificate: Certificate.fromCertificateArn(
                    stack,
                    'MyCert',
                    'arn:aws:acm:us-east-1:232783690572:certificate/17b62498-f6d6-4b90-a907-48b32c92253a',
                  ),
                },
              }
            : undefined,
      });
      stack.addOutputs({
        url: site.customDomainUrl || site.url,
      });
    });
  },
} satisfies SSTConfig;
