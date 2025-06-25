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

export interface OperationResult<T> {
  result: T;
  costInfo?: QueryCostInfo;
}
