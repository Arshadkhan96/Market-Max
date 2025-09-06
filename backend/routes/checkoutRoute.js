const express = require("express")
const Checkout = require("../models/Checkout")
const Cart = require("../models/Cart")
const Product = require("../models/Product")
const Order = require("../models/Order")
const { protect } = require("../middleware/authMiddleware")
const mongoose = require("mongoose")

const router = express.Router()
//@route POST /api/checkout
//@desc Create a new checkout session
//@access Private
router.post("/", protect, async (req, res) => {
    const { checkoutItems, shippingAddress, paymentMethod, totalPrice } = req.body;
    
    // Enhanced validation with more detailed error messages
    if (!checkoutItems || !Array.isArray(checkoutItems)) {
        return res.status(400).json({ 
            success: false,
            message: "Checkout items are required",
            details: "Please provide an array of checkout items"
        });
    }

    if (checkoutItems.length === 0) {
        return res.status(400).json({ 
            success: false,
            message: "Empty checkout items",
            details: "Please provide at least one item in checkoutItems array"
        });
    }

    // Validate each item in checkoutItems
    for (const item of checkoutItems) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid item format",
                details: "Each item must have a productId and positive quantity"
            });
        }
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || 
        !shippingAddress.country) {
        return res.status(400).json({
            success: false,
            message: "Complete shipping address is required"
        });
    }

    // Validate payment method
    if (!paymentMethod) {
        return res.status(400).json({
            success: false,
            message: "Payment method is required"
        });
    }

    // Validate total price
    if (!totalPrice || isNaN(totalPrice) || totalPrice <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid total price is required"
        });
    }

    try {
        // Verify product IDs exist in database
        const productIds = checkoutItems.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });
        
        if (products.length !== checkoutItems.length) {
            return res.status(400).json({
                success: false,
                message: "Some products not found",
                details: "One or more product IDs are invalid"
            });
        }

        // Create a new checkout session - IMPORTANT: using checkoutSchema to match model
        const newCheckout = await Checkout.create({
            user: req.user._id,
            checkoutSchema: checkoutItems.map(item => ({
                productId: item.productId,  // Changed from product to productId to match schema
                name: item.name,
                image: item.image,
                price: item.price,
                quantity: item.quantity
            })),
            shippingAddress: {
                address: shippingAddress.address,
                city: shippingAddress.city,
                country: shippingAddress.country
            },
            paymentMethod,
            totalPrice,
            paymentStatus: "pending",  // Changed to lowercase to match schema default
            isPaid: false,
        });
        
        console.log(`Checkout created for user: ${req.user._id}`);
        res.status(201).json({
            success: true,
            checkout: newCheckout
        });
    } catch (error) {
        console.error("Error creating Checkout session", error);
        res.status(500).json({ 
            success: false,
            message: "Server Error",
            error: error.message 
        });
    }
});
//@route PUT /api/checkout/:id/pay
//@desc Update checkout to mark as paid after successful payment
//@access Private

// Fixed: Added 'async' keyword that was missing after protect middleware
router.put("/:id/pay", protect, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log("Received ID:", id); // Debug logging
        
        // Validate ID format first
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid checkout ID format",
                details: `Provided ID: ${id}. ID must be a 24-character hex string like '507f1f77bcf86cd799439011'`
            });
        }

        // Validate request body
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                success: false,
                message: "Request body is required"
            });
        }

        const { paymentStatus, paymentDetails } = req.body;

        // Find the checkout document with proper error handling
        const checkout = await Checkout.findById(id).orFail(new Error('Checkout not found')).exec();

        // Verify ownership
        if (checkout.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this checkout"
            });
        }

        // Process payment
        if (paymentStatus?.toLowerCase() === "paid") {
            checkout.isPaid = true;
            checkout.paymentStatus = "paid";
            checkout.paymentDetails = {
                transactionId: paymentDetails?.transactionId,
                paymentGateway: paymentDetails?.paymentGateway,
                amount: paymentDetails?.amount,
                currency: paymentDetails?.currency,
                ...paymentDetails
            };
            checkout.paidAt = new Date();
            
            const updatedCheckout = await checkout.save();
            
            return res.status(200).json({
                success: true,
                message: "Payment processed successfully",
                checkout: updatedCheckout
            });
        }

        return res.status(400).json({
            success: false,
            message: "Invalid payment status",
            details: "Status must be 'paid'"
        });

    } catch (error) {
        console.error("Payment processing error:", error);
        
        if (error.message === 'Checkout not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Payment processing failed",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

//@route POST /api/checkout/:id/finalize
//@desc Finalize checkout and convert to an order after payment confirmation
//@access Private
router.post("/:id/finalize", protect, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Validate ID format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            await session.abortTransaction();
            return res.status(400).json({ 
                success: false,
                message: "Invalid checkout ID format",
                providedId: req.params.id
            });
        }

        // 2. Find checkout with all necessary data
        const checkout = await Checkout.findById(req.params.id)
            .populate({
                path: 'user',
                select: '_id email' // Only get essential user data
            })
            .populate({
                path: 'items.productId', // Populate product details if needed
                select: 'name price images'
            })
            .session(session);

        if (!checkout) {
            await session.abortTransaction();
            return res.status(404).json({ 
                success: false,
                message: "Checkout not found",
                checkoutId: req.params.id
            });
        }

        // 3. Debug: Log the complete checkout structure
        console.log('Complete Checkout Document:', JSON.stringify({
            _id: checkout._id,
            user: checkout.user,
            items: checkout.items,
            checkoutSchema: checkout.checkoutSchema,
            isPaid: checkout.isPaid,
            paymentStatus: checkout.paymentStatus
        }, null, 2));

        // 4. Handle items from either field (with priority to 'items')
        const orderItems = checkout.items?.length ? checkout.items : 
                         checkout.checkoutSchema?.length ? checkout.checkoutSchema : null;

        if (!orderItems || orderItems.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({ 
                success: false,
                message: "No valid items found in checkout",
                availableFields: {
                    items: checkout.items?.length || 0,
                    checkoutSchema: checkout.checkoutSchema?.length || 0
                },
                documentStructure: Object.keys(checkout.toObject())
            });
        }

        // 5. Validate all items have required fields
        const invalidItems = orderItems.filter(item => (
            !item.productId || 
            !item.name || 
            !item.price || 
            !item.quantity
        ));

        if (invalidItems.length > 0) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Some items are missing required fields",
                invalidItems: invalidItems.map(item => ({
                    itemId: item._id || 'no-id',
                    missingFields: [
                        !item.productId && 'productId',
                        !item.name && 'name',
                        !item.price && 'price',
                        !item.quantity && 'quantity'
                    ].filter(Boolean)
                }))
            });
        }

        // 6. Create the order with enhanced data mapping
        const order = new Order({
            user: checkout.user._id,
            orderItems: orderItems.map(item => ({
                product: item.productId._id || item.productId, // Handle both populated and raw IDs
                name: item.name || item.productId?.name,
                image: item.image || item.productId?.images?.[0],
                price: item.price,
                quantity: item.quantity,
                ...(item.size && { size: item.size }), // Only include if exists
                ...(item.color && { color: item.color })
            })),
            shippingAddress: checkout.shippingAddress,
            paymentMethod: checkout.paymentMethod,
            paymentDetails: checkout.paymentDetails,
            totalPrice: checkout.totalPrice,
            status: "Processing",
            isPaid: checkout.isPaid,
            paidAt: checkout.paidAt,
            paymentStatus: checkout.paymentStatus || 'completed'
        });

        // 7. Execute all operations in transaction
        const [createdOrder] = await Promise.all([
            order.save({ session }),
            Checkout.findByIdAndUpdate(
                checkout._id,
                { 
                    isFinalized: true,
                    finalizedAt: new Date(),
                    status: 'completed'
                },
                { session }
            ),
            Cart.deleteOne({ user: checkout.user._id }, { session })
        ]);

        await session.commitTransaction();

        // 8. Return success response with order details
        return res.status(201).json({
            success: true,
            message: "Order finalized successfully",
            order: {
                _id: createdOrder._id,
                status: createdOrder.status,
                total: createdOrder.totalPrice,
                itemsCount: createdOrder.orderItems.length
            }
        });

    } catch (error) {
        await session.abortTransaction();
        
        console.error('Finalization Error:', {
            message: error.message,
            stack: error.stack,
            type: error.name
        });

        return res.status(500).json({
            success: false,
            message: "Order finalization failed",
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : undefined
        });
    } finally {
        session.endSession();
    }
});
module.exports = router