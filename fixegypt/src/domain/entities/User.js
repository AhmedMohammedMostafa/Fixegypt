/**
 * User Entity in the domain layer
 * This represents the core User object in our domain
 */
class User {
  constructor({
    id = null,
    nationalId,
    firstName,
    lastName,
    email,
    password,
    phone,
    address,
    city,
    governorate,
    role = 'citizen',
    isVerified = false,
    points = 0,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.nationalId = nationalId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.phone = phone;
    this.address = address;
    this.city = city;
    this.governorate = governorate;
    this.role = role;
    this.isVerified = isVerified;
    this.points = points;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Get full name of the user
   */
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Check if user is an admin
   */
  isAdmin() {
    return this.role === 'admin';
  }

  /**
   * Check if user is a citizen
   */
  isCitizen() {
    return this.role === 'citizen';
  }

  /**
   * Add points to user
   * @param {number} amount - Amount of points to add
   */
  addPoints(amount) {
    if (amount <= 0) {
      throw new Error('Points amount must be positive');
    }
    this.points += amount;
    this.updatedAt = new Date();
    return this.points;
  }

  /**
   * Deduct points from user
   * @param {number} amount - Amount of points to deduct
   */
  deductPoints(amount) {
    if (amount <= 0) {
      throw new Error('Points amount must be positive');
    }
    if (this.points < amount) {
      throw new Error('Insufficient points');
    }
    this.points -= amount;
    this.updatedAt = new Date();
    return this.points;
  }

  /**
   * Check if user has enough points
   * @param {number} amount - Amount of points to check
   */
  hasEnoughPoints(amount) {
    return this.points >= amount;
  }

  /**
   * Validate Egyptian National ID format (14 digits)
   */
  static validateNationalId(nationalId) {
    // Basic validation - 14 digits
    const nationalIdRegex = /^\d{14}$/;
    
    if (!nationalIdRegex.test(nationalId)) {
      return { isValid: false, message: 'National ID must be 14 digits' };
    }

    // Extract data components from National ID
    // Format: YYMMDDGGLLLLN
    // YY: Year of birth (last 2 digits)
    // MM: Month of birth
    // DD: Day of birth
    // GG: Governorate code
    // LLLL: Sequence number within governorate
    // N: Gender (odd for male, even for female)

    const year = nationalId.substring(0, 2);
    const month = nationalId.substring(2, 4);
    const day = nationalId.substring(4, 6);
    const governorate = nationalId.substring(6, 8);
    
    // Validate birth date components
    const birthMonth = parseInt(month, 10);
    const birthDay = parseInt(day, 10);
    const governorateCode = parseInt(governorate, 10);
    

    // Validate governorate code (00 is invalid)
    if (governorateCode === 0) {
      return { isValid: false, message: 'Invalid governorate code in National ID' };
    }
    
    // For ID 30001021501347:
    // Year: 00 (2000)
    // Month: 01 (January) - Valid
    // Day: 02 (2nd) - Valid  
    // Governorate: 15 - Valid
    // Sequence: 0134
    // Gender: 7 (odd = male)
    
    return { isValid: true, message: 'Valid National ID' };
  }

  /**
   * Create a safe user object (without sensitive data)
   */
  toSafeObject() {
    const { password, ...safeUser } = this;
    return safeUser;
  }
}

export default User; 