const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart"); // adjust path
const Product = require("../models/Product"); // adjust path

// ✅ Helper: find or create cart by userId or guestId
async function getCart(userId, guestId) {
  if (userId) {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, products: [], totalPrice: 0 });
      await cart.save();
    }
    return cart;
  }
  if (guestId) {
    let cart = await Cart.findOne({ guestId });
    if (!cart) {
      cart = new Cart({ guestId, products: [], totalPrice: 0 });
      await cart.save();
    }
    return cart;
  }
  return null;
}

// ✅ Remove item from cart
router.delete("/:productId", async (req, res) => {
  try {
    // First try to get productId from URL params, then from query
    let productId = req.params.productId || req.query.productId;
    const { userId, guestId, size, color } = req.query;
    
    console.log('DELETE /api/cart request received:', { 
      params: req.params,
      query: req.query,
      body: req.body,
      method: req.method,
      url: req.originalUrl
    });
    
    if (!productId) {
      return res.status(400).json({ 
        success: false,
        message: "Product ID is required"
      });
    }
    
    // Ensure productId is a string for consistent comparison
    const productIdStr = String(productId).trim();
    
    if (!userId && !guestId) {
      console.log('Error: Either userId or guestId is required');
      return res.status(400).json({ 
        success: false,
        message: "Either userId or guestId is required" 
      });
    }

    console.log('Searching for cart with:', { userId, guestId });
    let cart = await getCart(userId, guestId);
    
    if (!cart) {
      console.log('Creating new cart for:', { userId, guestId });
      cart = new Cart({
        user: userId || null,
        guestId: guestId || null,
        products: [],
        totalPrice: 0
      });
      await cart.save();
      return res.status(200).json({ 
        success: true, 
        message: "Cart was empty",
        cart 
      });
    }

    console.log('Found cart:', { cartId: cart._id, productCount: cart.products.length });
    
    // Find and remove the item
    const initialLength = cart.products.length;
    cart.products = cart.products.filter(item => {
      // Convert both IDs to strings for comparison
      const itemProductId = item.productId ? String(item.productId) : null;
      const targetProductId = productId ? String(productId) : null;
      
      const isSameProduct = itemProductId === targetProductId;
      const sizeMatch = size ? String(item.size) === String(size) : true;
      const colorMatch = color ? String(item.color) === String(color) : true;
      const shouldRemove = isSameProduct && sizeMatch && colorMatch;
      
      console.log('Checking item:', { 
        itemProductId: itemProductId,
        targetProductId: targetProductId,
        isSameProduct,
        itemSize: item.size,
        targetSize: size,
        sizeMatch,
        itemColor: item.color,
        targetColor: color,
        colorMatch,
        shouldRemove
      });
      
      return !shouldRemove;
    });

    // If no items were removed, return error
    if (cart.products.length === initialLength) {
      console.log('Item not found in cart:', { productId, size, color });
      return res.status(404).json({ message: "Item not found in cart" });
    }

    console.log(`Removed item. Before: ${initialLength}, After: ${cart.products.length}`);
    
    // Recalculate total price
    cart.totalPrice = cart.products.reduce(
      (total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );

    console.log('Updated cart total price:', cart.totalPrice);
    
    await cart.save();
    console.log('Cart saved successfully');
    return res.json(cart);
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return res.status(500).json({ 
      message: "Error removing item from cart",
      error: error.message,
      stack: error.stack 
    });
  }
});

// ✅ Add item to cart (merge if exists)
router.post("/", async (req, res) => {
  const { productId, quantity = 1, size, color, userId, guestId } = req.body;

  try {
    if (!productId) return res.status(400).json({ message: "productId required" });

    let cart = await getCart(userId, guestId);
    if (!cart) {
      cart = new Cart({
        userId: userId || undefined,
        guestId: guestId || undefined,
        products: [],
        totalPrice: 0,
      });
    }

    const productDoc = await Product.findById(productId).select("price name images");
    if (!productDoc) return res.status(404).json({ message: "Product not found" });

    const price = Number(productDoc.price) || 0;
    const image = productDoc.images?.[0] || "";
    const name = productDoc.name || "";

    // Convert both IDs to strings for comparison
    const productIdStr = String(productId);
    const productIndex = cart.products.findIndex(p => {
      const pId = String(p.productId);
      const sizeMatch = size ? (p.size === size) : !p.size;
      const colorMatch = color ? (p.color === color) : !p.color;
      return pId === productIdStr && sizeMatch && colorMatch;
    });
    
    console.log('Product index found:', productIndex, 'for product:', productIdStr);

    if (productIndex > -1) {
      cart.products[productIndex].quantity += Number(quantity);
    } else {
      cart.products.push({
        productId,
        name,
        image,
        price,
        quantity: Number(quantity),
        size,
        color,
      });
    }

    cart.totalPrice = cart.products.reduce(
      (acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 0),
      0
    );

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error("POST /api/cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update quantity
router.put("/", async (req, res) => {
  const { productId, quantity, size, color, userId, guestId } = req.body;

  try {
    const cart = await getCart(userId, guestId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Convert both IDs to strings for comparison
    const productIdStr = String(productId);
    const productIndex = cart.products.findIndex(p => {
      const pId = String(p.productId);
      const sizeMatch = size ? (p.size === size) : !p.size;
      const colorMatch = color ? (p.color === color) : !p.color;
      return pId === productIdStr && sizeMatch && colorMatch;
    });
    
    console.log('Product index found:', productIndex, 'for product:', productIdStr);

    if (productIndex === -1) return res.status(404).json({ message: "Product not found in cart" });

    if (quantity <= 0) {
      cart.products.splice(productIndex, 1);
    } else {
      cart.products[productIndex].quantity = Number(quantity);
    }

    cart.totalPrice = cart.products.reduce(
      (acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 0),
      0
    );

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error("PUT /api/cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Export the router
module.exports = router;
