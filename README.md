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
│   │   ├── shopify-client.ts    # Shopify GraphQL client with rate limiting
│   │   ├── logger.ts            # Structured logging
│   └── generated/               # Generated Shopify GraphQL types (do not edit)
├── infra/
│   ├── api.ts                   # API infrastructure (Function URL)
│   └── secrets.ts               # AWS Secrets Manager configuration
├── .github/workflows/
│   └── deploy.yml               # CI/CD pipeline with quality gates
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
- **Testing**: Vitest with unit tests
- **Code Quality**: ESLint + Prettier with pre-commit hooks

## Development

### Prerequisites

- Node.js 22.x
- pnpm
- AWS CLI configured
- SST CLI

### Setup

Copy `.env.example` to `.env` and configure:

```bash
# Install dependencies
pnpm install

# Start development mode
pnpm dev

# Install Shopify secret to your SST dev stack
npx sst secret set SHOPIFY_API_SECRET [secret]
```

### GraphQL Type Generation

Uses shopify's graphql code gen for type safety and schema validation. [Shopify's documentation](https://shopify.dev/docs/api/shopify-app-remix/v2/guide-graphql-types).

```bash
# Generate types from GraphQL operations
pnpm graphql-codegen
```

## CI/CD Pipeline

Automated deployment with comprehensive quality gates:

### Quality Checks

- ESLint code linting
- Prettier formatting check
- TypeScript type checking
- Unit test execution

**Trigger**: Push to `main` branch

## API Endpoints

### POST /tag-vip-customers

Identifies and tags VIP customers based on order count.

**Features:**

- Real-time Shopify GraphQL API integration
- Intelligent rate limiting with Shopify's points-based system
- Dry-run mode for testing
- Configurable batch processing

**Request:**

```json
{
  "shopDomain": "comfrt-vip-test.myshopify.com",
  "dryRun": false,
  "batchSize": 250
}
```

**Response:**

```json
{
  "success": true,
  "summary": {
    "totalCustomers": 655,
    "vipsIdentified": 1,
    "customersUpdated": 1
  },
  "errors": []
}
```

## Future Enhancements

### Features

- Additional tiers: Multiple VIP tiers based on spend or purchase frequency
- Dropoff: If customer hasn't made purchase in last 12 months, they could lose status (target for email campaign)
- Prediction: Identifying potential future VIPs for email campaign targeting
- Integration with marketing platforms

### Technical

- Add authentication to the endpoint
- Retry w/ Backoff or DLQ
- Use proper structured logging
- Use Customer Segment for orders > 3 and query by customer segment. Would massively reduce total queries and execution time.
- Redis/ElastiCache based throttling with Bottleneck to enable rate limit clustering across all services.
- Add multi-store support with key selection
- Use shopify's [Bulk Operations](https://shopify.dev/docs/api/usage/bulk-operations/queries) to prepare query data. Will be needed to support > 25,000 customers if not using customer segments.
- Memory Usage Optimization:
  - Current State: Processing all customers in memory at once
  - Optimization: Implement streaming/chunked processing
- Scheduling: Schedule the action with a cron job to run automatically

### **CloudWatch Dashboards**

Operations Dashboard:

- Service health overview
- Error rates and success metrics

Technical Dashboard:

- Lambda performance metrics
- Memory and duration trends
- API efficiency metrics
- Rate limiting patterns

### Alerting

Set up alerts for:

- Critical Alerts:
  - Error rate > 5%
  - Lambda timeout incidents
  - Memory usage > 90%
  - Complete service failures
- Warnings:
  - Processing time > baseline + 50%
  - Rate limiting incidents
  - Memory usage > 75%
