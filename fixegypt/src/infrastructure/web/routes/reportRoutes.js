import express from 'express';
import reportController from '../controllers/reportController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { uploadMultipleImages } from '../middlewares/uploadMiddleware.js';
import { validateCreateReport, validateUpdateReport } from '../validators/reportValidator.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Report management endpoints
 */

// All report routes require authentication
router.use(authMiddleware.protect);

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Create a new report
 *     tags: [Reports]
 *     description: Submit a new infrastructure issue report with images
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 description: Report title
 *               description:
 *                 type: string
 *                 description: Detailed description of the issue
 *               category:
 *                 type: string
 *                 enum: [road_damage, water_issue, electricity_issue, waste_management, public_property_damage, street_lighting, sewage_problem, public_transportation, environmental_issue]
 *                 description: Category of the infrastructure issue
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                     description: Street address
 *                   city:
 *                     type: string
 *                     description: City
 *                   governorate:
 *                     type: string
 *                     description: Governorate
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                         description: Latitude
 *                       lng:
 *                         type: number
 *                         description: Longitude
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Images of the infrastructure issue
 *     responses:
 *       201:
 *         description: Report created successfully
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
 *                   example: Report created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/Report'
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user account not verified
 */
router.post(
  '/',
  uploadMultipleImages('images', 5), 
  validateCreateReport,
  authMiddleware.verificationRequired,
  reportController.createReport
);

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Get all reports
 *     tags: [Reports]
 *     description: Get paginated list of reports with filtering options
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
 *           enum: [pending, in-progress, resolved, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: urgency
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by urgency
 *       - in: query
 *         name: governorate
 *         schema:
 *           type: string
 *         description: Filter by governorate
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Field to sort by, prefix with - for descending order
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
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
 *                   example: Reports retrieved successfully
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
 *                         total:
 *                           type: number
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         pages:
 *                           type: number
 *       401:
 *         description: Unauthorized - user not authenticated
 */
router.get('/',  reportController.getReports);

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: Get a report by ID
 *     tags: [Reports]
 *     description: Get detailed information about a specific report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report retrieved successfully
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
 *                   example: Report retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/Report'
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user not authorized to view this report
 *       404:
 *         description: Report not found
 */
router.get('/:id', reportController.getReportById);

/**
 * @swagger
 * /reports/{id}:
 *   patch:
 *     summary: Update a report
 *     tags: [Reports]
 *     description: Update report details (citizens can only update pending reports and limited fields)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [road_damage, water_issue, electricity_issue, waste_management, public_property_damage, street_lighting, sewage_problem, public_transportation, environmental_issue]
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   governorate:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *     responses:
 *       200:
 *         description: Report updated successfully
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
 *                   example: Report updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/Report'
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user not authorized to update this report
 *       404:
 *         description: Report not found
 */
router.patch('/:id', validateUpdateReport, reportController.updateReport);

/**
 * @swagger
 * /reports/{id}:
 *   delete:
 *     summary: Delete a report
 *     tags: [Reports]
 *     description: Delete a report (citizens can only delete their own pending reports)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted successfully
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
 *                   example: Report deleted successfully
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user not authorized to delete this report
 *       404:
 *         description: Report not found
 */
router.delete('/:id', reportController.deleteReport);

/**
 * @swagger
 * /reports/{id}/images:
 *   post:
 *     summary: Add images to a report
 *     tags: [Reports]
 *     description: Add more images to an existing report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Images to add to the report
 *     responses:
 *       200:
 *         description: Images added successfully
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
 *                   example: Images added successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/Report'
 *       400:
 *         description: Bad request - no images provided
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user not authorized to update this report
 *       404:
 *         description: Report not found
 */
router.post(
  '/:id/images', 
  uploadMultipleImages('images', 5), 
  reportController.addImagesToReport
);

/**
 * @swagger
 * /reports/user/me:
 *   get:
 *     summary: Get current user's reports
 *     tags: [Reports]
 *     description: Get the authenticated user's reports with pagination
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
 *           enum: [pending, in-progress, resolved, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Field to sort by, prefix with - for descending order
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
 *         description: Unauthorized - user not authenticated
 */
router.get('/user/me', reportController.getUserReports);

/**
 * @swagger
 * /reports/statistics:
 *   get:
 *     summary: Get report statistics
 *     tags: [Reports]
 *     description: Get statistics about reports in the system
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                   example: Statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     counts:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         pending:
 *                           type: number
 *                         inProgress:
 *                           type: number
 *                         resolved:
 *                           type: number
 *                         rejected:
 *                           type: number
 *                     categoryCounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           count:
 *                             type: number
 *                     urgencyCounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           urgency:
 *                             type: string
 *                           count:
 *                             type: number
 *       401:
 *         description: Unauthorized - user not authenticated
 */
router.get('/statistics', reportController.getReportStatistics);

/**
 * @swagger
 * /reports/nearby:
 *   get:
 *     summary: Get nearby reports
 *     tags: [Reports]
 *     description: Get reports near a specified location
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5
 *         description: Search radius in kilometers
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Nearby reports retrieved successfully
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
 *                   example: Nearby reports retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Report'
 *       400:
 *         description: Bad request - missing coordinates
 *       401:
 *         description: Unauthorized - user not authenticated
 */
router.get('/nearby', reportController.getNearbyReports);

export default router; 