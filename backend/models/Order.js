const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true  // Added index for better query performance
    },
    name: {
        type: String,
        required: true,
        trim: true  // Added trim to remove whitespace
    },
    image: {
        type: String,
        required: true,
        validate: {  // Added URL validation
            validator: function(v) {
                return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']  // Added minimum value validation
    },
    size: {
        type: String,
        trim: true,
        uppercase: true  // Standardize size formatting
    },
    color: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],  // Minimum quantity
        max: [1000, 'Quantity cannot exceed 1000']  // Reasonable upper limit
    }
}, { 
    _id: false,
    toJSON: { virtuals: true },  // Enable virtuals when converted to JSON
    toObject: { virtuals: true }
});

// Add virtual for total item price
orderItemSchema.virtual('totalPrice').get(function() {
    return this.price * this.quantity;
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    orderItems: {
        type: [orderItemSchema],
        required: true,
        validate: {  // Validate at least one item
            validator: function(v) {
                return v && v.length > 0;
            },
            message: 'At least one order item is required'
        }
    },
    shippingAddress: {
        type: {
            address: {
                type: String,
                required: true,
                trim: true,
                maxlength: [200, 'Address too long']
            },
            city: {
                type: String,
                required: true,
                trim: true,
                maxlength: [100, 'City name too long']
            },
            postalCode: {
                type: String,
                required: true,
                trim: true,
                validate: {
                    validator: function(v) {
                        return /^[A-Za-z0-9\- ]{3,10}$/.test(v);
                    },
                    message: props => `${props.value} is not a valid postal code!`
                }
            },
            country: {
                type: String,
                required: true,
                trim: true,
                maxlength: [100, 'Country name too long']
            }
        },
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: {
            values: ['Paypal', 'Credit Card', 'Bank Transfer', 'Cash on Delivery'],
            message: '{VALUE} is not a supported payment method'
        }
    },
    totalPrice: {
        type: Number,
        required: true,
        min: [0, 'Total price cannot be negative'],
        validate: {
            validator: function(v) {
                // Validate that total matches sum of items
                const itemsTotal = this.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                return v === itemsTotal;
            },
            message: 'Total price does not match sum of items'
        }
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: {
        type: Date,
        validate: {
            validator: function(v) {
                // PaidAt must be set if isPaid is true
                if (this.isPaid) return v !== undefined;
                return true;
            },
            message: 'PaidAt date is required when order is paid'
        }
    },
    isDelivered: {
        type: Boolean,
        default: false
    },
    deliveredAt: {
        type: Date,
        validate: {
            validator: function(v) {
                // DeliveredAt must be set if isDelivered is true
                if (this.isDelivered) return v !== undefined;
                return true;
            },
            message: 'DeliveredAt date is required when order is delivered'
        }
    },
    paymentStatus: {
        type: String,
        default: 'pending',
        enum: {
            values: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
            message: '{VALUE} is not a valid payment status'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
            message: '{VALUE} is not a valid order status'
        },
        default: 'Processing'
    },
    notes: {  // Added field for order notes
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    }
}, { 
    timestamps: true,  // Fixed typo from timeseries
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add virtual for order summary
orderSchema.virtual('summary').get(function() {
    return `${this.orderItems.length} items - ${this.status}`;
});

// Add index for frequently queried fields
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ totalPrice: 1 });

// Middleware to validate before save
orderSchema.pre('save', function(next) {
    if (this.isPaid && !this.paidAt) {
        this.paidAt = new Date();
    }
    if (this.isDelivered && !this.deliveredAt) {
        this.deliveredAt = new Date();
    }
    next();
});

module.exports = mongoose.model("Order", orderSchema);  // Changed to "Order" with uppercase