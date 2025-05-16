import User from '../../../domain/entities/User.js';
import authService from '../../../domain/services/AuthService.js';
import { ApiError } from '../../../infrastructure/web/middlewares/errorHandler.js';

/**
 * Use case for registering a new user
 */
class RegisterUserUseCase {
  constructor(userRepository, emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  /**
   * Execute the use case
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  async execute(userData) {
    // Validate National ID
    const { isValid, message } = User.validateNationalId(userData.nationalId);
    if (!isValid) {
      throw new ApiError(400, message);
    }

    // Check if user with this email already exists
    const existingEmail = await this.userRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new ApiError(409, 'Email already registered');
    }

    // Check if user with this National ID already exists
    const existingNationalId = await this.userRepository.findByNationalId(userData.nationalId);
    if (existingNationalId) {
      throw new ApiError(409, 'National ID already registered');
    }

    // Hash password
    const hashedPassword = await authService.hashPassword(userData.password);

    // Create user entity
    const user = new User({
      ...userData,
      password: hashedPassword,
      isVerified: false,
      role: 'citizen'
    });

    // Save user to repository
    const createdUser = await this.userRepository.create(user);

    // Generate auth tokens
    const tokens = authService.generateAuthTokens(createdUser);

    // Return safe user data and tokens
    return {
      user: createdUser.toSafeObject(),
      tokens
    };
  }
}

export default RegisterUserUseCase; 