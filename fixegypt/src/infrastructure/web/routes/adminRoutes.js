import express from 'express';
import adminController from '../controllers/adminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { validateAdminLogin, validateStatusUpdate } from '../validators/adminValidator.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     description: Login with admin credentials
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin password
 *     responses:
 *       200:
 *         description: Admin logged in successfully
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
 *                   example: Admin logged in successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [admin]
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateAdminLogin, adminController.login);

// Protected admin routes - require admin authentication
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     description: Get dashboard overview statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                   example: Dashboard statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     counts:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: number
 *                         reports:
 *                           type: number
 *                         pendingReports:
 *                           type: number
 *                         resolvedReports:
 *                           type: number
 *                         criticalReports:
 *                           type: number
 *                     recentUsers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     recentReports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Report'
 *                     distributions:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               status:
 *                                 type: string
 *                               count:
 *                                 type: number
 *                         category:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               category:
 *                                 type: string
 *                               count:
 *                                 type: number
 *                         urgency:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               urgency:
 *                                 type: string
 *                               count:
 *                                 type: number
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 */
router.get('/dashboard',  adminController.getDashboardStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     description: Get paginated list of users with filtering options
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [citizen, admin, manager, analyst]
 *         description: Filter by role
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, email, or national ID
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         total:
 *                           type: number
 *                         pages:
 *                           type: number
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 */
router.get('/users', adminController.getUsers);

/**
 * @swagger
 * /admin/users/{userId}/verify:
 *   patch:
 *     summary: Verify a user
 *     tags: [Admin]
 *     description: Manually verify a user's account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User verified successfully
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
 *                   example: User verified successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - invalid user ID
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 *       404:
 *         description: User not found
 */
router.patch('/users/:userId/verify', adminController.verifyUser);

/**
 * @swagger
 * /admin/users/{userId}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Admin]
 *     description: Change a user's role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [citizen, admin, manager, analyst]
 *                 description: New role for the user
 *     responses:
 *       200:
 *         description: User role updated successfully
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
 *                   example: User role updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Bad request - invalid user ID or role
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 *       404:
 *         description: User not found
 */
router.patch('/users/:userId/role', adminController.updateUserRole);

/**
 * @swagger
 * /admin/reports/pending:
 *   get:
 *     summary: Get pending reports
 *     tags: [Admin]
 *     description: Get paginated list of pending reports
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
 *     responses:
 *       200:
 *         description: Pending reports retrieved successfully
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
 *                   example: Pending reports retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Report'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         total:
 *                           type: number
 *                         pages:
 *                           type: number
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 */
router.get('/reports/pending', adminController.getPendingReports);

/**
 * @swagger
 * /admin/reports/{reportId}/status:
 *   patch:
 *     summary: Update report status
 *     tags: [Admin]
 *     description: Change the status of a report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
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
 *                 enum: [pending, in-progress, resolved, rejected]
 *                 description: New status for the report
 *               note:
 *                 type: string
 *                 description: Optional note explaining the status change
 *     responses:
 *       200:
 *         description: Report status updated successfully
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
 *                   example: Report status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/Report'
 *       400:
 *         description: Bad request - invalid report ID or status
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 *       404:
 *         description: Report not found
 */
router.patch('/reports/:reportId/status', validateStatusUpdate, adminController.updateReportStatus);

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     summary: Get analytics data
 *     tags: [Admin]
 *     description: Get various types of analytics data with filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [resolution-time-category, resolution-time-area, trends, seasonal, agency-performance, damage-assessment]
 *         description: Type of analytics to retrieve
 *       - in: query
 *         name: timeUnit
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: Time unit for trend analysis
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by report category
 *       - in: query
 *         name: governorate
 *         schema:
 *           type: string
 *         description: Filter by governorate
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
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
 *                   example: Analytics data retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: Type of analytics requested
 *                     filters:
 *                       type: object
 *                       description: Filters applied to the analytics
 *                     results:
 *                       type: array
 *                       description: Analytics results
 *       400:
 *         description: Bad request - invalid analytics type
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 */
router.get('/analytics',  adminController.getAnalytics);

export default router; 