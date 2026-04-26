import Review, { IReview } from '../models/Review';
import Product from '../models/Product';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';

export class ReviewService {
  async addReview(userId: string, productId: string, rating: number, comment: string): Promise<IReview> {
    // C3: Try to use a Mongoose session (requires replica-set). Fall back to
    // non-transactional operations on single-node / local MongoDB installs.
    let session: mongoose.ClientSession | null = null;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      // Sessions not supported (e.g. standalone mongod in local dev) — session stays null
      session = null;
    }

    try {
      // Create the review (with or without session)
      const review = session
        ? await Review.create([{ userId, productId, rating, comment }], { session })
        : await Review.create([{ userId, productId, rating, comment }]);

      // Recalculate average rating
      const reviewQuery = Review.find({ productId });
      if (session) reviewQuery.session(session);
      const reviews = await reviewQuery;
      const totalReviews = reviews.length;
      const avgRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews;

      // Update product rating
      const updateOpts = session ? { session } : {};
      await Product.findByIdAndUpdate(
        productId,
        { averageRating: avgRating, numReviews: totalReviews },
        updateOpts
      );

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      return Array.isArray(review) ? review[0] : review;
    } catch (error: any) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      if (error.code === 11000) {
        throw AppError.conflict('You have already reviewed this product');
      }
      throw error;
    }
  }

  async getProductReviews(productId: string): Promise<IReview[]> {
    return Review.find({ productId }).populate('userId', 'name').sort({ createdAt: -1 });
  }
}
