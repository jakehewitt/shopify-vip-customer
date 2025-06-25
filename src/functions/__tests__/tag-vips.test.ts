import { describe, it, expect, vi } from 'vitest';
import { identifyVipCustomers, validateRequest, processVipUpdates } from '../tag-vips';
import type { ShopifyCustomer, VipIdentificationOptions, TagVipCustomersRequest } from '../types';

// helpers
const createCustomer = (id: string, numberOfOrders: number, tags: string[] = []): ShopifyCustomer =>
  ({
    id,
    numberOfOrders,
    tags,
    email: `customer${id}@example.com`,
    firstName: `Customer`,
    lastName: `${id}`,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }) as ShopifyCustomer;

const createValidRequest = (overrides: Partial<TagVipCustomersRequest> = {}): TagVipCustomersRequest => ({
  shopDomain: 'test-store.myshopify.com',
  dryRun: false,
  batchSize: 50,
  ...overrides,
});

describe('VIP Customer Tagging - Core Business Logic', () => {
  describe('identifyVipCustomers', () => {
    it('should identify customers with 3+ orders as VIP', () => {
      const customers = [
        createCustomer('1', 2),
        createCustomer('2', 3),
        createCustomer('3', 5),
        createCustomer('4', 1),
      ];
      const options: VipIdentificationOptions = { minOrderCount: 3, dryRun: false };
      const result = identifyVipCustomers(customers, options);

      expect(result.vipCustomers).toHaveLength(2);
      expect(result.vipCustomers[0].id).toBe('2');
      expect(result.vipCustomers[1].id).toBe('3');
      expect(result.totalCustomers).toBe(4);
    });

    it('should exclude customers already tagged as VIP', () => {
      const customers = [
        createCustomer('1', 5, ['VIP']), // Already VIP
        createCustomer('2', 4), // New VIP
        createCustomer('3', 3, ['Premium', 'VIP']), // Already VIP with multiple tags
      ];
      const options: VipIdentificationOptions = { minOrderCount: 3, dryRun: false };
      const result = identifyVipCustomers(customers, options);

      expect(result.vipCustomers).toHaveLength(1);
      expect(result.vipCustomers[0].id).toBe('2');
      expect(result.totalCustomers).toBe(3);
    });

    it('should respect custom minOrderCount parameter', () => {
      const customers = [createCustomer('1', 1), createCustomer('2', 2), createCustomer('3', 3)];
      const options: VipIdentificationOptions = { minOrderCount: 2, dryRun: false };
      const result = identifyVipCustomers(customers, options);

      expect(result.vipCustomers).toHaveLength(2);
      expect(result.vipCustomers[0].id).toBe('2');
      expect(result.vipCustomers[1].id).toBe('3');
    });

    it('should handle empty customer list', () => {
      const customers: ShopifyCustomer[] = [];
      const options: VipIdentificationOptions = { minOrderCount: 3, dryRun: false };
      const result = identifyVipCustomers(customers, options);

      expect(result.vipCustomers).toHaveLength(0);
      expect(result.totalCustomers).toBe(0);
    });
  });

  describe('validateRequest', () => {
    it('should validate required shopDomain', () => {
      const request = createValidRequest({ shopDomain: '' });
      const errors = validateRequest(request);
      expect(errors).toContain('shopDomain is required');
    });

    it('should validate Shopify domain format', () => {
      const request = createValidRequest({ shopDomain: 'invalid-domain.com' });
      const errors = validateRequest(request);
      expect(errors).toContain('shopDomain must be a valid Shopify domain');
    });

    it('should validate batchSize minimum boundary', () => {
      const request = createValidRequest({ batchSize: 0 });
      const errors = validateRequest(request);
      expect(errors).toContain('batchSize must be between 1 and 250');
    });

    it('should validate batchSize maximum boundary', () => {
      const request = createValidRequest({ batchSize: 300 });
      const errors = validateRequest(request);
      expect(errors).toContain('batchSize must be between 1 and 250');
    });

    it('should return multiple validation errors', () => {
      const request = createValidRequest({
        shopDomain: '',
        batchSize: 0,
      });
      const errors = validateRequest(request);

      expect(errors).toHaveLength(2);
      expect(errors).toContain('shopDomain is required');
      expect(errors).toContain('batchSize must be between 1 and 250');
    });

    it('should pass validation for valid request', () => {
      const request = createValidRequest();
      const errors = validateRequest(request);
      expect(errors).toHaveLength(0);
    });
  });

  describe('processVipUpdates', () => {
    const mockShopifyClient = {
      batchUpdateCustomerTags: vi.fn(),
    };

    it('should return correct count in dry-run mode', async () => {
      const vipCustomers = [createCustomer('1', 3), createCustomer('2', 5)];
      const dryRun = true;

      const result = await processVipUpdates(vipCustomers, mockShopifyClient as any, dryRun);

      expect(result.customersUpdated).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(mockShopifyClient.batchUpdateCustomerTags).not.toHaveBeenCalled();
    });

    it('should handle empty VIP customer list', async () => {
      const vipCustomers: ShopifyCustomer[] = [];
      const dryRun = false;
      const result = await processVipUpdates(vipCustomers, mockShopifyClient as any, dryRun);

      expect(result.customersUpdated).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockShopifyClient.batchUpdateCustomerTags).not.toHaveBeenCalled();
    });

    it('should call batchUpdateCustomerTags with correct data in live mode', async () => {
      const vipCustomers = [createCustomer('1', 3, ['Premium']), createCustomer('2', 5, [])];
      const dryRun = false;

      mockShopifyClient.batchUpdateCustomerTags.mockResolvedValue({
        customersUpdated: 2,
        errors: [],
        totalCost: { requested: 10, actual: 8 },
      });

      const result = await processVipUpdates(vipCustomers, mockShopifyClient as any, dryRun);

      expect(mockShopifyClient.batchUpdateCustomerTags).toHaveBeenCalledWith([
        { id: '1', tags: ['Premium', 'VIP'] },
        { id: '2', tags: ['VIP'] },
      ]);
      expect(result.customersUpdated).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should preserve existing tags when adding VIP tag', async () => {
      const vipCustomers = [createCustomer('1', 4, ['Premium', 'Loyal'])];
      const dryRun = false;

      mockShopifyClient.batchUpdateCustomerTags.mockResolvedValue({
        customersUpdated: 1,
        errors: [],
      });

      await processVipUpdates(vipCustomers, mockShopifyClient as any, dryRun);

      expect(mockShopifyClient.batchUpdateCustomerTags).toHaveBeenCalledWith([
        { id: '1', tags: ['Premium', 'Loyal', 'VIP'] },
      ]);
    });
  });
});
