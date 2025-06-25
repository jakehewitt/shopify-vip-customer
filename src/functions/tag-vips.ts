import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { Resource } from 'sst';
import { createShopifyClient, ShopifyClient } from '../lib/shopify-client';
import { createLogger } from '../lib/logger';
import type {
  ShopifyCustomer,
  VipIdentificationResult,
  VipIdentificationOptions,
  TagVipCustomersRequest,
  TagVipCustomersResponse,
} from './types';

const DEFAULT_BATCH_SIZE = 50; // Default batch size for fetching customers
const MAX_BATCH_SIZE = 250; // Shopify GraphQL limit
const VIP_MIN_ORDER_COUNT = 3; // Minimum order count to qualify as VIP

const app = new Hono();
const logger = createLogger('tag-vips-api');

function identifyVipCustomers(
  customers: ShopifyCustomer[],
  options: VipIdentificationOptions = { minOrderCount: VIP_MIN_ORDER_COUNT, dryRun: false }
): VipIdentificationResult {
  const startTime = Date.now();
  
  const vipCustomers = customers.filter(customer => 
    customer.numberOfOrders >= options.minOrderCount && 
    !customer.tags.includes('VIP')
  );
  
  const endTime = Date.now();
  
  return {
    vipCustomers,
    totalCustomers: customers.length,
    processingTime: endTime - startTime
  };
}

async function processVipUpdates(
  vipCustomers: ShopifyCustomer[],
  shopifyClient: ShopifyClient,
  dryRun: boolean
): Promise<{ customersUpdated: number; errors: string[]; totalCost?: { requested: number; actual: number } }> {
  if (dryRun) {
    // In dry run mode, simulate the updates
    return { customersUpdated: vipCustomers.length, errors: [] };
  }

  if (vipCustomers.length === 0) {
    return { customersUpdated: 0, errors: [] };
  }

  const updates = vipCustomers.map(customer => ({
    id: customer.id,
    tags: [...customer.tags, 'VIP']
  }));

  const result = await shopifyClient.batchUpdateCustomerTags(updates);

  return result;
}

function validateRequest(req: TagVipCustomersRequest): string[] {
  const errors: string[] = [];
  
  if (!req.shopDomain) {
    errors.push('shopDomain is required');
  } else if (!req.shopDomain.includes('.myshopify.com')) {
    errors.push('shopDomain must be a valid Shopify domain');
  }
  
  if (req.batchSize !== undefined && (req.batchSize < 1 || req.batchSize > MAX_BATCH_SIZE)) {
    errors.push(`batchSize must be between 1 and ${MAX_BATCH_SIZE}`);
  }
  
  return errors;
}

// Main API endpoint for tagging VIP customers
app.post('/', async (context) => {
  try {
    const body = await context.req.json() as TagVipCustomersRequest;
    
    const validationErrors = validateRequest(body);
    if (validationErrors.length > 0) {
      return context.json({
        success: false,
        errors: validationErrors
      }, 400);
    }
    
    const dryRun = body.dryRun ?? false;
    const batchSize = body.batchSize ?? DEFAULT_BATCH_SIZE;
    const startTime = Date.now();
    
    // Get Shopify access token from AWS Secrets Manager
    const accessToken = Resource.SHOPIFY_API_SECRET.value;
    if (!accessToken) {
      return context.json({
        success: false,
        errors: ['Shopify API credentials not configured']
      }, 500);
    }
    
    // Create Shopify client
    const shopifyClient = createShopifyClient({
      shopDomain: body.shopDomain,
      accessToken: accessToken
    });
    
    logger.info('Starting VIP customer analysis', {
      shopDomain: body.shopDomain,
      dryRun,
      batchSize
    });
    
    // Fetch all customers
    const customerResult = await shopifyClient.fetchAllCustomers(batchSize);
    const customers = customerResult.items;
    logger.info(`Fetched ${customers.length} customers`);
    
    // Identify VIP customers
    const vipResult = identifyVipCustomers(customers, {
      minOrderCount: VIP_MIN_ORDER_COUNT,
      dryRun
    });
    logger.info(`Identified ${vipResult.vipCustomers.length} VIP customers`);
    
    // Process VIP updates using the dedicated function
    const updateResult = await processVipUpdates(
      vipResult.vipCustomers,
      shopifyClient,
      dryRun
    );
    
    const { customersUpdated, errors } = updateResult;
    
    // TODO: Delete 
    const endTime = Date.now();
    const processingTime = `${endTime - startTime}ms`;
    
    const response: TagVipCustomersResponse = {
      success: true,
      summary: {
        totalCustomers: vipResult.totalCustomers,
        vipsIdentified: vipResult.vipCustomers.length,
        customersUpdated,
        processingTime
      },
      errors
    };
    
    logger.info('VIP customer analysis completed', response.summary);
    
    return context.json(response);
  } catch (error) {
    logger.error('Error processing request:', error);
    return context.json({
      success: false,
      errors: ['Internal server error']
    }, 500);
  }
});

// Export core business logic functions for testing
export { identifyVipCustomers, validateRequest, processVipUpdates };

// Export Lambda handler
export const handler = handle(app);
