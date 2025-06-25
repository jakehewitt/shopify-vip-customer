import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { createLogger } from '../lib/utils';
import type { TagVipCustomersRequest, TagVipCustomersResponse } from '../types';

// Create Hono app
const app = new Hono();
const logger = createLogger('tag-vips-api');

// Validate request
function validateRequest(req: TagVipCustomersRequest): string[] {
  const errors: string[] = [];
  
  if (!req.shopDomain) {
    errors.push('shopDomain is required');
  } else if (!req.shopDomain.includes('.myshopify.com')) {
    errors.push('shopDomain must be a valid Shopify domain');
  }
  
  if (req.batchSize !== undefined && (req.batchSize < 1 || req.batchSize > 250)) {
    errors.push('batchSize must be between 1 and 250');
  }
  
  return errors;
}

// Main API endpoint for tagging VIP customers
app.post('/', async (c) => {
  try {
    const body = await c.req.json() as TagVipCustomersRequest;
    
    const validationErrors = validateRequest(body);
    if (validationErrors.length > 0) {
      return c.json({
        success: false,
        errors: validationErrors
      }, 400);
    }
    
    // Set defaults
    const dryRun = body.dryRun ?? false;
    const batchSize = body.batchSize ?? 50;
    
    // TODO: Implement actual VIP tagging logic
    
    // For now, return a mock response
    const response: TagVipCustomersResponse = {
      success: true,
      summary: {
        totalCustomers: 0,
        vipsIdentified: 0,
        customersUpdated: 0,
        processingTime: '0s'
      },
      errors: []
    };
    
    return c.json(response);
  } catch (error) {
    logger.error('Error processing request:', error);
    return c.json({
      success: false,
      errors: ['Internal server error']
    }, 500);
  }
});

export const handler = handle(app);
