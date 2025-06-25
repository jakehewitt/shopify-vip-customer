export interface ShopifyClientOptions {
  shopDomain: string;
  accessToken: string;
}

export interface ThrottleStatus {
  maximumAvailable: number;
  currentlyAvailable: number;
  restoreRate: number;
}

export interface QueryCostInfo {
  requestedQueryCost: number;
  actualQueryCost: number;
  throttleStatus: ThrottleStatus;
}

export interface BatchOptions {
  batchSize?: number;
}

export interface BatchResult<T> {
  results: T[];
  errors: string[];
  totalCost?: { requested: number; actual: number };
}

export interface OperationResult<T> {
  result: T;
  costInfo?: QueryCostInfo;
}
