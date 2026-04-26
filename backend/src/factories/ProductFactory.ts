// ─── Product Factory ────────────────────────────────────────────────
// Factory Pattern: Creates correct Product subclass based on product type.
// Adding a new product type requires only registering a new creator — 
// NO modification to existing code (OCP).

export interface ProductData {
  name: string;
  price: number;
  categoryId: string;
  vendorId: string;
  stock: number;
  description?: string;
  imageUrl?: string;
}

export interface PhysicalProductData extends ProductData {
  weight: number;
  dimensions: { length: number; width: number; height: number };
}

export interface DigitalProductData extends ProductData {
  downloadUrl: string;
  licenseKey: string;
}

// Product type discriminator
export type ProductType = 'physical' | 'digital';

// Creator function type
type ProductCreator = (data: Record<string, unknown>) => Record<string, unknown>;

export class ProductFactory {
  private static _creators: Map<string, ProductCreator> = new Map();

  /** Register a creator for a product type (Open/Closed Principle) */
  static register(type: string, creator: ProductCreator): void {
    ProductFactory._creators.set(type, creator);
  }

  /** Create a product data object with the correct type discriminator */
  static create(type: string, data: Record<string, unknown>): Record<string, unknown> {
    const creator = ProductFactory._creators.get(type);
    if (!creator) {
      throw new Error(`Unknown product type: "${type}". Register it first via ProductFactory.register()`);
    }
    return creator(data);
  }

  /** Check if a product type is registered */
  static isRegistered(type: string): boolean {
    return ProductFactory._creators.has(type);
  }

  /** List all registered product types */
  static getRegisteredTypes(): string[] {
    return Array.from(ProductFactory._creators.keys());
  }
}

// ─── Register built-in product types ────────────────────────────────

ProductFactory.register('physical', (data: Record<string, unknown>) => ({
  ...data,
  productType: 'physical',
  weight: data.weight ?? 0,
  dimensions: data.dimensions ?? { length: 0, width: 0, height: 0 },
}));

ProductFactory.register('digital', (data: Record<string, unknown>) => ({
  ...data,
  productType: 'digital',
  downloadUrl: data.downloadUrl ?? '',
  licenseKey: data.licenseKey ?? '',
}));
