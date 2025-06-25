import {shopifyApiProject, ApiType} from '@shopify/api-codegen-preset';

// Taken from: https://shopify.dev/docs/api/shopify-app-remix/v2/guide-graphql-types
export default {
  schema: 'https://shopify.dev/admin-graphql-direct-proxy/2025-04',
  documents: ['./src/**/*.{js,ts,jsx,tsx}'],
  projects: {
    default: shopifyApiProject({
      apiType: ApiType.Admin,
      apiVersion: '2025-04',
      documents: ['./src/**/*.{js,ts,jsx,tsx}'],
      outputDir: './src/generated',
    }),
  },
};
