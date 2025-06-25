/// <reference path="../.sst/platform/config.d.ts" />

/**
 * This module defines secrets that can be used across multiple
 * infrastructure components. 
 * 
 * All secrets are stored securely in AWS Secrets Manager
 * and can be set with the SST CLI using `npx sst secret set [secret-name] [value]`.
 */

// Shopify API credentials secret
export const SHOPIFY_API_SECRET = new sst.Secret("SHOPIFY_API_SECRET");
