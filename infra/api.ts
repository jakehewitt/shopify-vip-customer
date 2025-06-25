/// <reference path="../.sst/platform/config.d.ts" />

import { SHOPIFY_API_SECRET } from './secrets';

export const tagVipsFunction = new sst.aws.Function('TagVipsFunction', {
  handler: 'src/functions/tag-vips.handler',
  runtime: 'nodejs22.x',
  timeout: '60 seconds',
  link: [SHOPIFY_API_SECRET],
  url: true,
});
