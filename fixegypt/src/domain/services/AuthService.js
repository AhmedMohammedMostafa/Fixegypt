import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../config.js';
import { ApiError } from '../../infrastructure/web/middlewares/errorHandler.js';

/**
 * Authentication Domain Service
 * Contains core business logic for authentication
 */
class AuthService {
  /**
   * Hash a password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare a password with a hash
   * @param {string} password - Plain text password
   * @param {string} hash - Password hash
   * @returns {Promise<boolean>} Match result
   */
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   * @param {Object} payload - Token payload
   * @returns {string} JWT token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  /**
   * Generate JWT refresh token
   * @param {Object} payload - Token payload
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @param {string} secret - Secret key
   * @returns {Object} Decoded token payload
   */
  verifyToken(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired token');
    }
  }

  /**
   * Generate tokens for user
   * @param {User} user - User entity
   * @returns {Object} Access and refresh tokens
   */
  generateAuthTokens(user) {
    const payload = {
      id: user.id,
      nationalId: user.nationalId,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }
}

export default new AuthService(); 