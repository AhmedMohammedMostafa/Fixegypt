import express from 'express';
import productController from '../controllers/productController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { uploadSingleImage } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

// All products routes require authentication
router.use(authMiddleware.protect);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     description: Get paginated list of products with filtering options
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [gift_card, merchandise, voucher, donation, service, other]
 *         description: Filter by category
 *       - in: query
 *         name: minCost
 *         schema:
 *           type: integer
 *         description: Minimum points cost
 *       - in: query
 *         name: maxCost
 *         schema:
 *           type: integer
 *         description: Maximum points cost
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: Products retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
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
router.get('/',  productController.getProducts);

/**
 * @swagger
 * /products/{productId}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     description: Get detailed information about a specific product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
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
 *                   example: Product retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       404:
 *         description: Product not found
 */
router.get('/:productId',  productController.getProductById);

/**
 * @swagger
 * /products/{productId}/redeem:
 *   post:
 *     summary: Redeem a product
 *     tags: [Products]
 *     description: Redeem a product using points
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product redeemed successfully
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
 *                   example: Product redeemed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     redemption:
 *                       $ref: '#/components/schemas/Redemption'
 *                     pointsDeducted:
 *                       type: number
 *                       example: 100
 *                     remainingPoints:
 *                       type: number
 *                       example: 50
 *       400:
 *         description: Bad request - insufficient points or product not available
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       404:
 *         description: Product not found
 */
router.post('/:productId/redeem', productController.redeemProduct);

// Admin routes
router.use(authMiddleware.restrictTo('admin'));

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     description: Create a new product that users can redeem with points (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - pointsCost
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *               description:
 *                 type: string
 *                 description: Product description
 *               pointsCost:
 *                 type: integer
 *                 description: Points cost
 *               category:
 *                 type: string
 *                 enum: [gift_card, merchandise, voucher, donation, service, other]
 *                 description: Product category
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image
 *               stock:
 *                 type: integer
 *                 description: Product stock (null for unlimited)
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   example: Product created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 */
router.post(
  '/',
  uploadSingleImage('image'),
  productController.createProduct
);

/**
 * @swagger
 * /products/{productId}:
 *   patch:
 *     summary: Update a product
 *     tags: [Products]
 *     description: Update an existing product (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *               description:
 *                 type: string
 *                 description: Product description
 *               pointsCost:
 *                 type: integer
 *                 description: Points cost
 *               category:
 *                 type: string
 *                 enum: [gift_card, merchandise, voucher, donation, service, other]
 *                 description: Product category
 *               isActive:
 *                 type: boolean
 *                 description: Product active status
 *               stock:
 *                 type: integer
 *                 description: Product stock (null for unlimited)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   example: Product updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 *       404:
 *         description: Product not found
 */
router.patch(
  '/:productId',
  uploadSingleImage('image'),
  productController.updateProduct
);

/**
 * @swagger
 * /products/{productId}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     description: Delete an existing product (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *                   example: Product deleted successfully
 *       401:
 *         description: Unauthorized - no token or invalid token
 *       403:
 *         description: Forbidden - not an admin
 *       404:
 *         description: Product not found
 */
router.delete(
  '/:productId',
  productController.deleteProduct
);

export default router; 