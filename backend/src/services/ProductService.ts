import mongoose from 'mongoose';
import Product, { IProduct, PhysicalProduct, DigitalProduct } from '../models/Product';
import { ProductFactory } from '../factories/ProductFactory';
import { AppError } from '../utils/AppError';

// ─── Product Service ────────────────────────────────────────────────
// Abstraction: All product CRUD through service layer.
// Factory Pattern: Uses ProductFactory for creation.

interface ProductFilters {
  categoryId?: string;
  vendorId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  productType?: string;
  page?: number;
  limit?: number;
}

export class ProductService {
  async createProduct(type: string, data: Record<string, unknown>): Promise<IProduct> {
    // Use Factory Pattern to build product data
    const productData = ProductFactory.create(type, data);

    let product: IProduct;
    if (type === 'physical') {
      product = await PhysicalProduct.create(productData);
    } else if (type === 'digital') {
      product = await DigitalProduct.create(productData);
    } else {
      // For extensibility: fallback to base Product
      product = await Product.create(productData);
    }

    return product;
  }

  async getAllProducts(filters: ProductFilters = {}): Promise<{
    products: IProduct[];
    total: number;
    page: number;
    pages: number;
  }> {
    const query: Record<string, unknown> = {};

    if (filters.categoryId) {
      query.categoryId = filters.categoryId;
    }
    if (filters.vendorId) {
      query.vendorId = filters.vendorId;
    }
    if (filters.productType) {
      query.productType = filters.productType;
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) (query.price as Record<string, number>).$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) (query.price as Record<string, number>).$lte = filters.maxPrice;
    }
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name slug')
        .populate('vendorId', 'name vendorName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    return {
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await Product.findById(id)
      .populate('categoryId', 'name slug')
      .populate('vendorId', 'name vendorName');
    if (!product) {
      throw AppError.notFound('Product not found');
    }
    return product;
  }

  async updateProduct(id: string, data: Partial<IProduct>): Promise<IProduct> {
    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      throw AppError.notFound('Product not found');
    }
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      throw AppError.notFound('Product not found');
    }
  }

  async getCategories() {
    const Category = mongoose.model('Category');
    const categories = await Category.find().sort({ name: 1 });
    return categories;
  }
}
