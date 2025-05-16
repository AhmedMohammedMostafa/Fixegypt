import express from 'express';
import userController from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { validateUpdateProfile, validateChangePassword } from '../validators/userValidator.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

// All user routes require authentication
router.use(authMiddleware.protect);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     description: Get the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User profile retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       404:
 *         description: User not found
 */
router.get('/profile',  userController.getProfile);

// Routes that require verified user
/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     description: Update the authenticated user's profile (only certain fields allowed)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               governorate:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - invalid input data or no valid fields to update
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       404:
 *         description: User not found
 */
router.patch('/profile', 
  authMiddleware.requireVerified, 
  validateUpdateProfile, 
  userController.updateProfile
);

/**
 * @swagger
 * /users/points:
 *   get:
 *     summary: Get user points history
 *     tags: [Users]
 *     description: Get the authenticated user's points transaction history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [earn, redeem]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: Points history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Points history retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PointsTransaction'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         pages:
 *                           type: number
 *       401:
 *         description: Unauthorized - no token or invalid token
 */
// TODO: Implement getPointsHistory controller method before enabling this route
// router.get('/points', cacheMiddleware(300), userController.getPointsHistory);

/**
 * @swagger
 * /users/reports:
 *   get:
 *     summary: Get user's reports
 *     tags: [Users]
 *     description: Get all reports submitted by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User reports retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Report'
 *       401:
 *         description: Unauthorized - no token or invalid token
 */
router.get('/reports', userController.getUserReports);

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Users]
 *     description: Change the authenticated user's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - no token, invalid token, or incorrect current password
 *       404:
 *         description: User not found
 */
router.post('/change-password', authMiddleware.requireVerified, validateChangePassword, userController.changePassword);

/**
 * @swagger
 * /users/account:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     description: Delete the authenticated user's account (requires password confirmation)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Current password to confirm account deletion
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Account deleted successfully
 *       400:
 *         description: Bad request - password not provided
 *       401:
 *         description: Unauthorized - no token, invalid token, or incorrect password
 *       403:
 *         description: Forbidden - admin accounts cannot be deleted through this endpoint
 *       404:
 *         description: User not found
 */
router.delete('/account', authMiddleware.requireVerified, userController.deleteAccount);

export default router; 