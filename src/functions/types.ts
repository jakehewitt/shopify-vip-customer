import { GetCustomersQuery } from '../generated/admin.generated';

export type ShopifyCustomer = GetCustomersQuery['customers']['edges'][0]['node'];

export interface VipIdentificationResult {
  vipCustomers: ShopifyCustomer[];
  totalCustomers: number;
  customersToPromote: ShopifyCustomer[];
}

export interface VipIdentificationOptions {
  minOrderCount: number;
  dryRun: boolean;
}

export interface TagVipCustomersRequest {
  shopDomain: string;
  dryRun?: boolean;
  batchSize?: number;
}

interface TagVipCustomersSummary {
  totalCustomers: number;
  vipsIdentified: number;
  customersUpdated: number;
}

export interface TagVipCustomersResponse {
  success: boolean;
  summary?: TagVipCustomersSummary;
  errors: string[];
}
