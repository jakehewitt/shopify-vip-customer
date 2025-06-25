# Comfrt Serverless Functions

A collection of serverless functions for Comfrt's business operations, built with SST v3 and deployed to AWS.

## Current Functions

### VIP Customer Tagging
Automatically identifies and tags VIP customers in Shopify stores based on their order history.

## Project Structure

```
comfrt-serverless/
├── src/
│   ├── functions/
│   │   └── tag-vips.ts          # VIP Customer Tagging function (Hono.js API)
│   ├── lib/
│   │   ├── shopify-client.ts    # Shopify GraphQL client
│   │   └── utils.ts             # Shared utilities
│   ├── generated/               # Generated Shopify api files (do not edit manually)
├── infra/
│   ├── api.ts                   # API infrastructure (Function URL)
│   └── secrets.ts               # Secrets configuration
├── memory-bank/                 # Project documentation
├── .graphqlrc.ts                # GraphQL Code Generator configuration
├── sst.config.ts                # SST configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── README.md
```

## Technology Stack

- **Runtime**: Node.js 22.x
- **Language**: TypeScript
- **Framework**: Hono.js (lightweight, serverless-optimized)
- **Infrastructure**: SST v3 (Serverless Stack Toolkit)
- **Cloud**: AWS Lambda with Function URL
- **API**: Shopify GraphQL Admin API
- **Type Generation**: Shopify's GraphQL Code Generator for type safety

## Development

### Prerequisites

- Node.js 22.x
- pnpm
- AWS CLI configured
- SST CLI

### Setup

```bash
# Install dependencies
pnpm install

# Start development mode
pnpm dev

# Type checking
pnpm typecheck

# Deploy to AWS
pnpm deploy

# Remove deployment
pnpm remove
```

### GraphQL Type Generation

Uses Shopify's GraphQL code gen for type safety and schema validation. [Shopify's documentation](https://shopify.dev/docs/api/shopify-app-remix/v2/guide-graphql-types).

```bash
# Generate types from GraphQL operations
pnpm graphql-codegen
```

### Environment Variables

Copy `.env.example` to `.env` and configure

## API Endpoint

### POST /tag-vip-customers

Identifies and tags VIP customers based on order count.

**Request:**
```json
{
  "shopDomain": "mystore.myshopify.com",
  "dryRun": false,
  "batchSize": 50
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalCustomers": 1250,
    "vipsIdentified": 89,
    "customersUpdated": 89,
    "processingTime": "12.5s"
  },
  "errors": []
}
```
