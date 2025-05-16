import authService from '../../../domain/services/AuthService.js';
import { ApiError } from '../../../infrastructure/web/middlewares/errorHandler.js';
import User from '../../../domain/entities/User.js';
import mongoose from 'mongoose';

/**
 * Use case for user login
 */
class LoginUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result with user and tokens
   */
  async execute(email, password) {
    // Special case for admin login
    if (email === 'admin@egypt.com' && password === 'egypt1234') {
      try {
        // Check if admin exists in database
        let adminUser = await this.userRepository.findByEmail('admin@egypt.com');
        
        // If admin doesn't exist, create it
        if (!adminUser) {
          console.log('Admin user not found in database. Creating admin user...');
          
          // Create hashed password for admin
          const hashedPassword = await authService.hashPassword('egypt1234');
          
          // Create new MongoDB ObjectId for admin
          const adminId = new mongoose.Types.ObjectId();
          console.log('Generated admin ID:', adminId.toString());
          
          // Create admin user with valid MongoDB ObjectId
          const newAdminUser = new User({
            id: adminId.toString(),
            nationalId: '29901023456789',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@egypt.com',
            password: hashedPassword,
            phone: '01234567890',
            address: 'Admin Building',
            city: 'Cairo',
            governorate: 'Cairo',
            role: 'admin',
            isVerified: true,
            points: 9999,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Save admin user to database
          adminUser = await this.userRepository.create(newAdminUser);
          console.log('Admin user created successfully with ID:', adminUser.id);
        } else {
          // Ensure admin has admin role and is verified regardless of db state
          if (adminUser.role !== 'admin' || !adminUser.isVerified) {
            console.log('Updating admin user properties...');
            adminUser.role = 'admin';
            adminUser.isVerified = true;
            adminUser = await this.userRepository.update(adminUser.id, adminUser);
          }
        }
        
        // Generate admin tokens
        const tokens = authService.generateAuthTokens(adminUser);
        
        // Return admin user info and tokens
        return {
          user: adminUser.toSafeObject(),
          tokens
        };
      } catch (error) {
        console.error('Error handling admin login:', error);
        throw new ApiError(500, 'Error processing admin login');
      }
    }
    
    // Regular user login flow
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await authService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Generate auth tokens
    const tokens = authService.generateAuthTokens(user);

    // Return user info and tokens
    return {
      user: user.toSafeObject(),
      tokens
    };
  }
}

export default LoginUserUseCase; 