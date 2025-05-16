import UserRepository from '../../../domain/repositories/UserRepository.js';
import UserModel from '../models/UserModel.js';
import User from '../../../domain/entities/User.js';

/**
 * MongoDB implementation of UserRepository
 */
class MongoUserRepository extends UserRepository {
  /**
   * Map database user to domain entity
   * @param {Object} dbUser - Database user object
   * @returns {User} Domain user entity
   */
  _mapToDomainEntity(dbUser) {
    if (!dbUser) return null;
    
    // Convert Mongoose document to plain object if needed
    const userObject = dbUser.toObject ? dbUser.toObject() : dbUser;
    
    return new User({
      id: userObject._id ? userObject._id.toString() : userObject.id || null,
      nationalId: userObject.nationalId,
      firstName: userObject.firstName,
      lastName: userObject.lastName,
      email: userObject.email,
      password: userObject.password,
      phone: userObject.phone,
      address: userObject.address,
      city: userObject.city,
      governorate: userObject.governorate,
      role: userObject.role,
      isVerified: userObject.isVerified,
      points: userObject.points || 0,
      createdAt: userObject.createdAt,
      updatedAt: userObject.updatedAt
    });
  }

  /**
   * Create a new user
   * @param {User} user - User entity
   * @returns {Promise<User>} Created user
   */
  async create(user) {
    const dbUser = new UserModel({
      nationalId: user.nationalId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      phone: user.phone,
      address: user.address,
      city: user.city,
      governorate: user.governorate,
      role: user.role,
      isVerified: user.isVerified
    });

    const savedUser = await dbUser.save();
    return this._mapToDomainEntity(savedUser);
  }

  /**
   * Find a user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>} Found user or null
   */
  async findById(id) {
    const user = await UserModel.findById(id);
    return this._mapToDomainEntity(user);
  }

  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} Found user or null
   */
  async findByEmail(email) {
    const user = await UserModel.findOne({ email });
    return this._mapToDomainEntity(user);
  }

  /**
   * Find a user by National ID
   * @param {string} nationalId - National ID
   * @returns {Promise<User|null>} Found user or null
   */
  async findByNationalId(nationalId) {
    const user = await UserModel.findOne({ nationalId });
    return this._mapToDomainEntity(user);
  }

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<User>} Updated user
   */
  async update(id, updateData) {
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    return this._mapToDomainEntity(updatedUser);
  }

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * List users with pagination
   * @param {Object} options - Pagination options
   * @returns {Promise<{users: User[], total: number, page: number, limit: number}>} Paginated users
   */
  async findAll(options = { page: 1, limit: 10, filter: {} }) {
    const { page, limit, filter } = options;
    const skip = (page - 1) * limit;

    // Process filters for the query
    const query = {};
    
    if (filter.role) query.role = filter.role;
    if (filter.isVerified !== undefined) query.isVerified = filter.isVerified;
    if (filter.governorate) query.governorate = filter.governorate;
    if (filter.city) query.city = filter.city;
    if (filter.search) {
      query.$or = [
        { firstName: { $regex: filter.search, $options: 'i' } },
        { lastName: { $regex: filter.search, $options: 'i' } },
        { email: { $regex: filter.search, $options: 'i' } },
        { nationalId: { $regex: filter.search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      UserModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      UserModel.countDocuments(query)
    ]);

    return {
      users: users.map(user => this._mapToDomainEntity(user)),
      total,
      page,
      limit
    };
  }

  /**
   * Verify a user
   * @param {string} id - User ID
   * @returns {Promise<User>} Verified user
   */
  async verifyUser(id) {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { isVerified: true, updatedAt: new Date() },
      { new: true }
    );
    
    return this._mapToDomainEntity(user);
  }

  /**
   * Change user role
   * @param {string} id - User ID
   * @param {string} role - New role
   * @returns {Promise<User>} Updated user
   */
  async changeRole(id, role) {
    if (!['citizen', 'admin'].includes(role)) {
      throw new Error('Invalid role');
    }
    
    const user = await UserModel.findByIdAndUpdate(
      id,
      { role, updatedAt: new Date() },
      { new: true }
    );
    
    return this._mapToDomainEntity(user);
  }

  /**
   * Store refresh token
   * @param {string} userId - User ID
   * @param {string} token - Refresh token
   * @param {Date} expiresAt - Expiration date
   */
  async storeRefreshToken(userId, token, expiresAt) {
    await UserModel.findByIdAndUpdate(
      userId,
      { 
        $push: { 
          refreshTokens: { 
            token, 
            expiresAt 
          } 
        },
        updatedAt: new Date()
      }
    );
  }

  /**
   * Verify refresh token
   * @param {string} userId - User ID
   * @param {string} token - Refresh token
   * @returns {Promise<boolean>} Is token valid
   */
  async verifyRefreshToken(userId, token) {
    const user = await UserModel.findOne({
      _id: userId,
      'refreshTokens.token': token,
      'refreshTokens.expiresAt': { $gt: new Date() }
    });
    
    return !!user;
  }

  /**
   * Delete refresh token
   * @param {string} userId - User ID
   * @param {string} token - Refresh token
   */
  async deleteRefreshToken(userId, token) {
    await UserModel.findByIdAndUpdate(
      userId,
      { 
        $pull: { 
          refreshTokens: { token } 
        },
        updatedAt: new Date()
      }
    );
  }

  /**
   * Set verification token
   * @param {string} userId - User ID
   * @param {string} token - Verification token
   * @param {Date} expiresAt - Expiration date
   */
  async setVerificationToken(userId, token, expiresAt) {
    await UserModel.findByIdAndUpdate(
      userId,
      { 
        verificationToken: { token, expiresAt },
        updatedAt: new Date()
      }
    );
  }

  /**
   * Verify user with token
   * @param {string} token - Verification token
   * @returns {Promise<User|null>} Verified user or null
   */
  async verifyUserWithToken(token) {
    const user = await UserModel.findOneAndUpdate(
      {
        'verificationToken.token': token,
        'verificationToken.expiresAt': { $gt: new Date() }
      },
      {
        isVerified: true,
        $unset: { verificationToken: 1 },
        updatedAt: new Date()
      },
      { new: true }
    );
    
    return this._mapToDomainEntity(user);
  }
}

export default MongoUserRepository; 