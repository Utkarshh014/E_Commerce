import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { AppError } from '../utils/AppError';

// ─── Auth Service ───────────────────────────────────────────────────
// Abstraction: Auth logic behind a service interface.
// Encapsulation: Password hashing is inside User model (not here).

interface AuthResult {
  user: Record<string, unknown>;
  token: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'customer' | 'admin';
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private readonly _jwtSecret: string;
  private readonly _jwtExpiresIn: string;

  constructor(jwtSecret?: string, jwtExpiresIn?: string) {
    this._jwtSecret = jwtSecret || process.env.JWT_SECRET || 'fallback_secret';
    this._jwtExpiresIn = jwtExpiresIn || process.env.JWT_EXPIRES_IN || '7d';
  }

  private _generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      this._jwtSecret,
      { expiresIn: this._jwtExpiresIn } as jwt.SignOptions
    );
  }

  async register(data: RegisterData): Promise<AuthResult> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw AppError.conflict('User with this email already exists');
    }

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role || 'customer',
    });

    const token = this._generateToken((user._id as any).toString(), user.role);

    return {
      user: user.toSafeObject(),
      token,
    };
  }

  async login(data: LoginData): Promise<AuthResult> {
    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const token = this._generateToken((user._id as any).toString(), user.role);

    return {
      user: user.toSafeObject(),
      token,
    };
  }

  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  }

  verifyToken(token: string): { userId: string; role: string } {
    try {
      const decoded = jwt.verify(token, this._jwtSecret) as {
        userId: string;
        role: string;
      };
      return decoded;
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }
  }
}
