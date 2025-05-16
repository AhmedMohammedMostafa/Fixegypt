import express from 'express';
import redemptionController from '../controllers/redemptionController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Redemptions
 *   description: Redemption management endpoints
 */

// All redemption routes require authentication
router.use(authMiddleware.protect);

/**
 * @swagger
 * /redemptions/user:
 *   get:
 *     summary: Get user's redemptions
 *     tags: [Redemptions]
 *     description: Get the authenticated user's redemption history
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, rejected]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Redemptions retrieved successfully
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
 *                   example: Redemptions retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     redemptions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Redemption'
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
router.get('/user', redemptionController.getUserRedemptions);

/**
 * @swagger
 * /redemptions/{redemptionId}:
 *   get:
 *     summary: Get redemption by ID
 *     tags: [Redemptions]
 *     description: Get detailed information about a specific redemption
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: redemptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Redemption ID
 *     responses:
 *       200:
 *         description: Redemption retrieved successfully
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
 *                   example: Redemption retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     redemption:
 *                       $ref: '#/components/schemas/Redemption'
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not authorized to view this redemption
 *       404:
 *         description: Redemption not found
 */
router.get('/:redemptionId',  redemptionController.getRedemptionById);

// Admin routes
router.use(authMiddleware.restrictTo('admin'));

/**
 * @swagger
 * /redemptions:
 *   get:
 *     summary: Get all redemptions (admin only)
 *     tags: [Redemptions]
 *     description: Get paginated list of all redemptions with filtering options
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: Redemptions retrieved successfully
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
 *                   example: Redemptions retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     redemptions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Redemption'
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
 *       403:
 *         description: Forbidden - not an admin
 */
router.get('/',  redemptionController.getAllRedemptions);

/**
 * @swagger
 * /redemptions/statistics:
 *   get:
 *     summary: Get redemption statistics (admin only)
 *     tags: [Redemptions]
 *     description: Get statistics about redemptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: Redemption statistics retrieved successfully
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
 *                   example: Redemption statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         statusCounts:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               status:
 *                                 type: string
 *                               count:
 *                                 type: number
 *                         pointsStats:
 *                           type: object
 *                           properties:
 *                             totalRedemptions:
 *                               type: number
 *                             totalPointsRedeemed:
 *                               type: number
 *                             avgPointsPerRedemption:
 *                               type: number
 *                         topProducts:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               productId:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               count:
 *                                 type: number
 *                               totalPoints:
 *                                 type: number
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 */
router.get('/statistics',redemptionController.getRedemptionStatistics);

/**
 * @swagger
 * /redemptions/{redemptionId}/status:
 *   patch:
 *     summary: Update redemption status (admin only)
 *     tags: [Redemptions]
 *     description: Update the status of a redemption request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: redemptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Redemption ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [processing, completed, rejected]
 *                 description: New status
 *               notes:
 *                 type: string
 *                 description: Notes about the status change
 *     responses:
 *       200:
 *         description: Redemption status updated successfully
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
 *                   example: Redemption status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     redemption:
 *                       $ref: '#/components/schemas/Redemption'
 *       400:
 *         description: Bad request - invalid status
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 *       404:
 *         description: Redemption not found
 */
router.patch(
  '/:redemptionId/status',
  redemptionController.updateRedemptionStatus
);

export default router; 