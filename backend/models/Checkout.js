const mongoose = require("mongoose");

const checkoutItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  size: String,
  color: String,
}, { _id: false });

const checkoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [checkoutItemSchema],   // ✅ must use "items"
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["Paypal", "Credit Card", "Bank Transfer"],
  },
  totalPrice: { type: Number, required: true, min: 0 },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  paymentStatus: {
    type: String,
    default: "pending",
    enum: ["pending", "paid", "failed", "refunded"],
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    amount: Number,
    currency: String,
    status: String,
    rawResponse: mongoose.Schema.Types.Mixed,
  },
  isFinalized: { type: Boolean, default: false },
  isFinalizedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Checkout", checkoutSchema);
