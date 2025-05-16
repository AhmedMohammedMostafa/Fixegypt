import crypto from 'crypto';
import RegisterUserUseCase from '../../../application/use-cases/user/RegisterUserUseCase.js';
import LoginUserUseCase from '../../../application/use-cases/user/LoginUserUseCase.js';
import MongoUserRepository from '../../persistence/repositories/MongoUserRepository.js';
import emailService from '../../email/EmailService.js';
import { ApiError } from '../middlewares/errorHandler.js';
import authService from '../../../domain/services/AuthService.js';
import config from '../../../config.js';

// Create instances of required dependencies
const userRepository = new MongoUserRepository();

/**
 * AuthController provides handlers for authentication-related routes
 */
class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async register(req, res, next) {
    try {
      const registerUseCase = new RegisterUserUseCase(userRepository, emailService);
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiration = new Date();
      tokenExpiration.setHours(tokenExpiration.getHours() + 24); // 24 hours expiration
      
      // Execute use case
      const result = await registerUseCase.execute(req.body);
      
      // Store verification token in database
      await userRepository.setVerificationToken(
        result.user.id,
        verificationToken,
        tokenExpiration
      );
      
      // Send verification email
      await emailService.sendVerificationEmail(result.user, verificationToken);
      
      // Return result
      res.status(201).json({
        status: 'success',
        message: 'User registered successfully. Please check your email to verify your account.',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      console.log(`Login attempt for email: ${email}`);
      
      const loginUseCase = new LoginUserUseCase(userRepository);
      
      // Execute use case
      const result = await loginUseCase.execute(email, password);
      
      // Store refresh token
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days expiration
      
      try {
        await userRepository.storeRefreshToken(
          result.user.id,
          result.tokens.refreshToken,
          refreshTokenExpiry
        );
      } catch (tokenError) {
        console.error('Error storing refresh token:', tokenError);
        // Continue with login even if token storage fails
      }
      
      console.log(`User logged in successfully: ${email}`);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'User logged in successfully',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      });
    } catch (error) {
      console.error('Login error:', error.message, error.stack);
      
      // Format MongoDB-related errors in a more user-friendly way
      if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        return next(new ApiError(500, 'Database connection error. Please try again later.'));
      }
      
      // Handle other errors normally
      next(error);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
      }
      
      // Verify refresh token
      const decoded = authService.verifyToken(refreshToken, config.jwt.refreshSecret);
      
      // Check if refresh token exists in database
      const isValid = await userRepository.verifyRefreshToken(decoded.id, refreshToken);
      
      if (!isValid) {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }
      
      // Get user
      const user = await userRepository.findById(decoded.id);
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      // Generate new tokens
      const tokens = authService.generateAuthTokens(user);
      
      // Store new refresh token
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days expiration
      
      await userRepository.storeRefreshToken(
        user.id,
        tokens.refreshToken,
        refreshTokenExpiry
      );
      
      // Delete old refresh token
      await userRepository.deleteRefreshToken(user.id, refreshToken);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: {
          tokens
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
      }
      
      // Verify refresh token
      const decoded = authService.verifyToken(refreshToken, config.jwt.refreshSecret);
      
      // Delete refresh token
      await userRepository.deleteRefreshToken(decoded.id, refreshToken);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'User logged out successfully'
      });
    } catch (error) {
      // Even if token is invalid, consider logout successful
      res.status(200).json({
        status: 'success',
        message: 'User logged out successfully'
      });
    }
  }

  /**
   * Verify email with token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;
      
      if (!token) {
        throw new ApiError(400, 'Verification token is required');
      }
      
      // Verify user with token
      const user = await userRepository.verifyUserWithToken(token);
      
      if (!user) {
        throw new ApiError(400, 'Invalid or expired verification token');
      }
      
      // Send welcome email
      await emailService.sendWelcomeEmail(user);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      
      // Find user by email
      const user = await userRepository.findByEmail(email);
      
      if (!user) {
        // Don't reveal that email doesn't exist
        return res.status(200).json({
          status: 'success',
          message: 'If your email is registered, you will receive a password reset link'
        });
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiration = new Date();
      tokenExpiration.setHours(tokenExpiration.getHours() + 1); // 1 hour expiration
      
      // Update user with reset token
      await userRepository.update(user.id, {
        resetPasswordToken: {
          token: resetToken,
          expiresAt: tokenExpiration
        }
      });
      
      // Send password reset email
      await emailService.sendPasswordResetEmail(user, resetToken);
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'If your email is registered, you will receive a password reset link'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      
      // Find user by reset token
      const user = await userRepository.findOne({
        'resetPasswordToken.token': token,
        'resetPasswordToken.expiresAt': { $gt: new Date() }
      });
      
      if (!user) {
        throw new ApiError(400, 'Invalid or expired reset token');
      }
      
      // Hash new password
      const hashedPassword = await authService.hashPassword(password);
      
      // Update user with new password and remove reset token
      await userRepository.update(user.id, {
        password: hashedPassword,
        $unset: { resetPasswordToken: 1 }
      });
      
      // Return result
      res.status(200).json({
        status: 'success',
        message: 'Password reset successful'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController(); 