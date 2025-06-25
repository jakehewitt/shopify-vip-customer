/**
 * Shared TypeScript definitions
 */

export interface TagVipCustomersRequest {
  shopDomain: string;
  
  /** @default false */
  dryRun?: boolean;
  
  /** @default 50 @minimum 1 @maximum 250 */
  batchSize?: number;
}

export interface TagVipCustomersSummary {
  totalCustomers: number;
  vipsIdentified: number;
  customersUpdated: number;
  processingTime: string;
}

export interface TagVipCustomersResponse {
  success: boolean;
  summary?: TagVipCustomersSummary;
  errors: string[];
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  ordersCount: number;
  tags: string[];
}

export interface ShopifyPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface ShopifyPaginatedResult<T> {
  data: T[];
  pageInfo: ShopifyPageInfo;
}

export interface ShopifyConfig {
  accessToken: string;
  apiVersion: string;
}

export interface VipConfig {
  /** @default 3 */
  minOrderCount: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}
