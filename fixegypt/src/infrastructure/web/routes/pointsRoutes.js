import express from 'express';
import pointsController from '../controllers/pointsController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Points
 *   description: Points management endpoints
 */

// All points routes require authentication
router.use(authMiddleware.protect);

/**
 * @swagger
 * /points/balance:
 *   get:
 *     summary: Get points balance
 *     tags: [Points]
 *     description: Get the authenticated user's points balance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Points balance retrieved successfully
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
 *                   example: Points balance retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     points:
 *                       type: number
 *                       example: 150
 *       401:
 *         description: Unauthorized - no token or invalid token
 */
router.get('/balance',  pointsController.getBalance);

/**
 * @swagger
 * /points/transactions:
 *   get:
 *     summary: Get transaction history
 *     tags: [Points]
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
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [report_submission, report_resolved, product_redemption, admin_adjustment, other]
 *         description: Filter by transaction source
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
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
 *                   example: Transaction history retrieved successfully
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
router.get('/transactions',  pointsController.getTransactionHistory);

/**
 * @swagger
 * /points/reports/{reportId}/award-submission:
 *   post:
 *     summary: Award points for report submission
 *     tags: [Points]
 *     description: Award points to a user for submitting a report (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Points awarded successfully
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
 *                   example: Points awarded for report submission
 *                 data:
 *                   type: object
 *                   properties:
 *                     pointsAwarded:
 *                       type: number
 *                       example: 25
 *                     newBalance:
 *                       type: number
 *                       example: 175
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 *       404:
 *         description: Report not found
 */
router.post(
  '/reports/:reportId/award-submission',
  authMiddleware.restrictTo('admin'),
  pointsController.awardPointsForSubmission
);

/**
 * @swagger
 * /points/reports/{reportId}/award-resolution:
 *   post:
 *     summary: Award points for resolved report
 *     tags: [Points]
 *     description: Award points to a user for their report being resolved (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Points awarded successfully
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
 *                   example: Points awarded for report resolution
 *                 data:
 *                   type: object
 *                   properties:
 *                     pointsAwarded:
 *                       type: number
 *                       example: 100
 *                     newBalance:
 *                       type: number
 *                       example: 275
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 *       404:
 *         description: Report not found
 */
router.post(
  '/reports/:reportId/award-resolution',
  authMiddleware.restrictTo('admin'),
  pointsController.awardPointsForResolution
);

export default router; 