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

  // Validation
  if (!checkoutItems || !Array.isArray(checkoutItems) || checkoutItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Checkout items are required",
    });
  }

  for (const item of checkoutItems) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Each item must have a valid productId and quantity",
      });
    }
  }

  if (!shippingAddress?.address || !shippingAddress?.city || !shippingAddress?.postalCode || !shippingAddress?.country) {
    return res.status(400).json({
      success: false,
      message: "Complete shipping address (address, city, postalCode, country) is required",
    });
  }

  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: "Payment method is required",
    });
  }

  if (!totalPrice || isNaN(totalPrice) || totalPrice <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid total price is required",
    });
  }

  try {
    // Verify product IDs exist
    const productIds = checkoutItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== checkoutItems.length) {
      return res.status(400).json({
        success: false,
        message: "Some products not found",
      });
    }

    // Create checkout
    const newCheckout = await Checkout.create({
      user: req.user._id,
      items: checkoutItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      })),
      shippingAddress: {
        address: shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      },
      paymentMethod,
      totalPrice,
      paymentStatus: "pending",
      isPaid: false,
    });

    console.log(`✅ Checkout created for user: ${req.user._id}`);
    res.status(201).json({ success: true, checkout: newCheckout });
  } catch (error) {
    console.error("❌ Error creating checkout", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
});

//@route PUT /api/checkout/:id/pay
//@desc Update checkout to mark as paid after successful payment
//@access Private
router.put("/:id/pay", protect, async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔹 Received Pay Request for Checkout ID:", id);

    // 1. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid checkout ID format",
        providedId: id,
      });
    }

    // 2. Validate request body
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Request body is required",
      });
    }

    const { paymentStatus, paymentDetails } = req.body;

    // 3. Find checkout
    const checkout = await Checkout.findById(id).exec();
    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: "Checkout not found",
      });
    }

    // 4. Ensure ownership
    if (checkout.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this checkout",
      });
    }

    // 5. Normalize payment details (PayPal response)
    let normalizedDetails = {};
    if (paymentDetails) {
      normalizedDetails = {
        transactionId: paymentDetails.id || paymentDetails.transactionId,
        paymentGateway: "paypal",
        amount:
          paymentDetails.purchase_units?.[0]?.amount?.value ||
          paymentDetails.amount,
        currency:
          paymentDetails.purchase_units?.[0]?.amount?.currency_code ||
          paymentDetails.currency,
        status: paymentDetails.status || "paid",
        rawResponse: paymentDetails,
      };
    }

    // 6. Update only if payment is successful
    if (paymentStatus?.toLowerCase() === "paid" || normalizedDetails.status === "COMPLETED") {
      checkout.isPaid = true;
      checkout.paymentStatus = "paid";
      checkout.paymentDetails = normalizedDetails;
      checkout.paidAt = new Date();

      const updatedCheckout = await checkout.save();

      return res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        checkout: updatedCheckout,
      });
    }

    // 7. Invalid payment status
    return res.status(400).json({
      success: false,
      message: "Invalid payment status",
      details: "Status must be 'paid' or PayPal status 'COMPLETED'",
    });

  } catch (error) {
    console.error("❌ Payment processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment processing failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
    const { id } = req.params;

    // 1️⃣ Validate checkout ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid checkout ID" });
    }

    // 2️⃣ Find checkout and populate user & product info
    const checkout = await Checkout.findById(id)
      .populate({ path: "user", select: "_id email" })
      .populate({ path: "items.productId", select: "name price images" })
      .session(session);

    if (!checkout) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Checkout not found" });
    }

    // 3️⃣ Ensure there are items in checkout
    if (!checkout.items || checkout.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No items in checkout" });
    }

    // 4️⃣ Validate each item
    const invalidItems = checkout.items.filter(
      (item) => !item.productId || !item.price || !item.quantity
    );
    if (invalidItems.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Some items are missing required fields",
        invalidItems,
      });
    }

    // 5️⃣ Map order items safely
    const orderItems = checkout.items.map((item) => {
      // Ensure image is a string URL
      let imageUrl = "";
      if (item.productId?.images?.length > 0) {
        // If product images exist, take first image
        imageUrl = typeof item.productId.images[0] === "string"
          ? item.productId.images[0]
          : item.productId.images[0]?.url || "";
      } else if (item.image) {
        imageUrl = typeof item.image === "string" ? item.image : item.image?.url || "";
      }

      return {
        productId: item.productId._id || item.productId,
        name: item.productId?.name || item.name || "Product Name",
        image: imageUrl,
        price: item.price,
        quantity: item.quantity,
        ...(item.size && { size: item.size }),
        ...(item.color && { color: item.color }),
      };
    });

    // 6️⃣ Create order
    const order = new Order({
      user: checkout.user._id,
      orderItems,
      shippingAddress: checkout.shippingAddress,
      paymentMethod: checkout.paymentMethod,
      paymentDetails: checkout.paymentDetails,
      totalPrice: checkout.totalPrice,
      status: "Processing",
      isPaid: checkout.isPaid,
      paidAt: checkout.paidAt,
      paymentStatus: checkout.paymentStatus || "pending",
    });

    // 7️⃣ Save order + update checkout + delete cart
    await order.save({ session });
    await checkout.updateOne(
      { isFinalized: true, finalizedAt: new Date(), status: "completed" },
      { session }
    );
    await Cart.deleteOne({ user: checkout.user._id }, { session });

    // 8️⃣ Commit transaction
    await session.commitTransaction();

    // 9️⃣ Success response
    return res.status(201).json({
      success: true,
      message: "Order finalized successfully",
      order: {
        _id: order._id,
        status: order.status,
        total: order.totalPrice,
        itemsCount: order.orderItems.length,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Finalization Error:", error);

    return res.status(500).json({
      success: false,
      message: "Order finalization failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    session.endSession();
  }
});

module.exports = router