import { createAdminApiClient } from '@shopify/admin-api-client';
import type { ShopifyClientOptions, QueryCostInfo, ThrottleStatus, OperationResult } from './types';

// Rate limiting configuration - unified across all GraphQL operations
export const RATE_LIMIT_CONFIG = {
  MIN_POINTS_THRESHOLD: 50, // Conservative estimate, will be dynamically calculated on actual query costs
  FALLBACK_DELAY_MS: 200, // Fallback when no throttle status available
  GOOD_CAPACITY_DELAY_MS: 0, // No delay when we have sufficient capacity
  POINTS_BUFFER_MULTIPLIER: 2, // Safety buffer for query costs
};

export class ShopifyClient {
  private client: ReturnType<typeof createAdminApiClient>;

  constructor(options: ShopifyClientOptions) {
    this.client = createAdminApiClient({
      storeDomain: options.shopDomain,
      accessToken: options.accessToken,
      apiVersion: '2025-04',
    });
  }

  async fetchCustomers(cursor: string | null = null, first: number = 50) {
    const query = `#graphql
      query GetCustomers($first: Int!, $after: String) {
        customers(first: $first, after: $after) {
          edges {
            node {
              id
              email
              firstName
              lastName
              numberOfOrders
              tags
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const variables = {
      first,
      after: cursor,
    };

    const response = await this.client.request(query, { variables });

    if (!response.data) {
      throw new Error('No data returned from customers query');
    }

    return {
      data: response.data.customers.edges.map((edge) => edge.node),
      pageInfo: {
        hasNextPage: response.data.customers.pageInfo.hasNextPage,
        endCursor: response.data.customers.pageInfo.endCursor ?? null,
      },
      costInfo: response.extensions?.cost,
    };
  }

  async updateCustomerTags(customerId: string, tags: string[]) {
    const mutation = `#graphql
      mutation UpdateCustomer($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            tags
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        id: customerId,
        tags: tags,
      },
    };

    const response = await this.client.request(mutation, { variables });

    if (!response.data) {
      throw new Error('No data returned from customer update mutation');
    }

    const { customerUpdate } = response.data;

    if (!customerUpdate) {
      throw new Error('Customer update mutation returned null');
    }

    if (customerUpdate.userErrors.length > 0) {
      throw new Error(`Customer update failed: ${customerUpdate.userErrors[0].message}`);
    }

    return {
      customer: customerUpdate.customer,
      costInfo: response.extensions?.cost,
    };
  }

  async paginateAll<T>(
    queryFn: (cursor: string | null) => Promise<{
      data: T[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      costInfo?: QueryCostInfo;
    }>,
  ): Promise<{ items: T[]; totalCost?: { requested: number; actual: number } }> {
    let allItems: T[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    let totalRequestedCost = 0;
    let totalActualCost = 0;

    while (hasNextPage) {
      const result = await queryFn(cursor);
      allItems = [...allItems, ...result.data];

      // Track query cost points information for rate limiting
      if (result.costInfo) {
        totalRequestedCost += result.costInfo.requestedQueryCost;
        totalActualCost += result.costInfo.actualQueryCost;
      }

      hasNextPage = result.pageInfo.hasNextPage;
      cursor = result.pageInfo.endCursor;

      if (hasNextPage && result.costInfo) {
        // Use point cost from this operation to predict next operation cost
        const expectedCost = result.costInfo.actualQueryCost;
        const delay = this.calculateRateLimit(result.costInfo.throttleStatus, expectedCost);

        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } else if (hasNextPage) {
        // Fallback to conservative delay if no cost info available
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_CONFIG.FALLBACK_DELAY_MS));
      }
    }

    return {
      items: allItems,
      totalCost:
        totalRequestedCost > 0
          ? {
              requested: totalRequestedCost,
              actual: totalActualCost,
            }
          : undefined,
    };
  }

  // Uses point based rate limiting from shopify docs here: https://shopify.dev/docs/api/usage/limits#compare-rate-limits-by-api
  private calculateRateLimit(throttleStatus?: ThrottleStatus, expectedCost: number = 10): number {
    if (!throttleStatus) {
      return RATE_LIMIT_CONFIG.FALLBACK_DELAY_MS;
    }

    const { currentlyAvailable, restoreRate } = throttleStatus;

    // Calculate dynamic threshold based on expected cost
    const dynamicThreshold = Math.max(
      expectedCost * RATE_LIMIT_CONFIG.POINTS_BUFFER_MULTIPLIER,
      RATE_LIMIT_CONFIG.MIN_POINTS_THRESHOLD,
    );

    // If we don't have enough points for the next operation, wait for capacity
    if (currentlyAvailable < dynamicThreshold) {
      const pointsNeeded = dynamicThreshold - currentlyAvailable;
      const timeNeeded = Math.ceil(pointsNeeded / restoreRate) * 1000;
      return timeNeeded;
    }

    // If we have enough capacity, probably dont need a delay.
    return RATE_LIMIT_CONFIG.GOOD_CAPACITY_DELAY_MS;
  }

  async processItems<TInput, TResult>(
    items: TInput[],
    operation: (item: TInput) => Promise<OperationResult<TResult>>,
  ): Promise<{ results: TResult[]; errors: string[]; totalCost?: { requested: number; actual: number } }> {
    const results: TResult[] = [];
    const errors: string[] = [];
    let totalRequestedCost = 0;
    let totalActualCost = 0;

    if (items.length === 0) {
      return { results: [], errors: [] };
    }

    for (let i = 0; i < items.length; i++) {
      try {
        const operationResult = await operation(items[i]);
        results.push(operationResult.result);

        // Track costs and apply intelligent rate limiting
        if (operationResult.costInfo) {
          totalRequestedCost += operationResult.costInfo.requestedQueryCost;
          totalActualCost += operationResult.costInfo.actualQueryCost;

          // Smart rate limiting after each operation (except the last one)
          if (i < items.length - 1) {
            const delay = this.calculateRateLimit(
              operationResult.costInfo.throttleStatus,
              operationResult.costInfo.actualQueryCost,
            );

            if (delay > 0) {
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }
      } catch (error) {
        const errorMsg = `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
      }
    }

    return {
      results,
      errors,
      totalCost:
        totalRequestedCost > 0
          ? {
              requested: totalRequestedCost,
              actual: totalActualCost,
            }
          : undefined,
    };
  }

  async batchUpdateCustomerTags(
    updates: Array<{ id: string; tags: string[] }>,
  ): Promise<{ customersUpdated: number; errors: string[]; totalCost?: { requested: number; actual: number } }> {
    // Use the sequential processor with customer tag update operation
    const result = await this.processItems(updates, async (update: { id: string; tags: string[] }) => {
      const updateResult = await this.updateCustomerTags(update.id, update.tags);
      return {
        result: updateResult.customer,
        costInfo: updateResult.costInfo,
      };
    });

    return {
      customersUpdated: result.results.length,
      errors: result.errors,
      totalCost: result.totalCost,
    };
  }

  async fetchAllCustomers(batchSize: number = 50) {
    return this.paginateAll(async (cursor) => {
      const result = await this.fetchCustomers(cursor, batchSize);
      return {
        data: result.data,
        pageInfo: result.pageInfo,
        costInfo: result.costInfo,
      };
    });
  }
}

export function createShopifyClient(options: ShopifyClientOptions): ShopifyClient {
  return new ShopifyClient(options);
}
