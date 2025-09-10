import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PayPalButton from "./PayPalButton";
import { useDispatch, useSelector } from "react-redux";
import { createCheckout } from "../../redux/slices/checkOutSlice";
import axios from "axios";

const Checkout = () => {
  const dispatch = useDispatch();
  const { cart } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { loading: checkoutLoading, error: checkoutError } = useSelector(
    (state) => state.checkout
  );

  const navigate = useNavigate();
  const [checkoutId, setCheckoutId] = useState(null);

  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart || !cart.products || cart.products.length === 0) {
      navigate("/");
    }
  }, [cart, navigate]);

  // Create checkout
  const handleCreateCheckout = async (e) => {
    e.preventDefault();

    if (cart && cart.products.length > 0) {
      // Filter out invalid products
      const validProducts = cart.products.filter(
        (item) => item.productId && item.name && item.price
      );

      if (validProducts.length === 0) {
        return alert("Some items in your cart are invalid. Please check.");
      }

      // Ensure image is always a string URL
      const checkoutItems = validProducts.map((item) => ({
        productId: item.productId || item._id,
        name: item.name,
        image: typeof item.image === "string" 
          ? item.image 
          : item.image?.url || "", // ✅ fallback to empty string if not valid
        price: item.price,
        quantity: item.quantity || 1,
        size: item.size,
        color: item.color,
      }));

      const res = await dispatch(
        createCheckout({
          checkoutItems,
          shippingAddress: { ...shippingAddress },
          paymentMethod: "Paypal",
          totalPrice: cart.totalPrice,
        })
      );

      if (res.payload && res.payload.checkout?._id) {
        setCheckoutId(res.payload.checkout._id);
      }
    }
  };

  // Handle PayPal success
  const handlePaymentSuccess = async (details) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!checkoutId) return;

      // Mark checkout as paid
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/${checkoutId}/pay`,
        {
          paymentStatus: "Paid",
          paymentDetails: details,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      // Finalize checkout
      await handleFinalizeCheckout(checkoutId);
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    }
  };

  // Finalize order
  const handleFinalizeCheckout = async (checkoutId) => {
    try {
      const token = localStorage.getItem("userToken");

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/${checkoutId}/finalize`,
        {},
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      navigate("/order-confirmation", { replace: true });
    } catch (error) {
      console.error("Finalize error:", error);
      alert("Failed to finalize your order. Please contact support.");
    }
  };

  // Loading/Error handling
  if (checkoutLoading) return <p>Loading checkout...</p>;
  if (checkoutError) return <p className="text-red-500">Error: {checkoutError}</p>;
  if (!cart || !cart.products || cart.products.length === 0) return <p>Your cart is empty</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
      {/* Checkout Form */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl uppercase mb-6">Checkout</h2>
        <form onSubmit={handleCreateCheckout}>
          {/* Contact */}
          <h3 className="text-lg mb-4">Contact Details</h3>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input type="email" value={user?.email || ""} disabled className="w-full p-2 border rounded" />
          </div>

          {/* Shipping */}
          <h3 className="text-lg mb-4">Delivery</h3>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <input type="text" placeholder="First Name" value={shippingAddress.firstName} onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })} required className="w-full p-2 border rounded" />
            <input type="text" placeholder="Last Name" value={shippingAddress.lastName} onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })} required className="w-full p-2 border rounded" />
          </div>
          <input type="text" placeholder="Address" value={shippingAddress.address} onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })} required className="w-full p-2 border rounded mb-4" />
          <div className="mb-4 grid grid-cols-2 gap-4">
            <input type="text" placeholder="City" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} required className="w-full p-2 border rounded" />
            <input type="text" placeholder="Postal Code" value={shippingAddress.postalCode} onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })} required className="w-full p-2 border rounded" />
          </div>
          <input type="text" placeholder="Country" value={shippingAddress.country} onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })} required className="w-full p-2 border rounded mb-4" />
          <input type="tel" placeholder="Phone" value={shippingAddress.phone} onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })} required className="w-full p-2 border rounded mb-4" />

          {/* Payment */}
          <div className="mt-6">
            {!checkoutId ? (
              <button type="submit" disabled={checkoutLoading} className={`w-full py-3 rounded ${checkoutLoading ? "bg-gray-400" : "bg-black text-white"}`}>
                {checkoutLoading ? "Processing..." : "Continue to Payment"}
              </button>
            ) : (
              <div>
                <h3 className="text-lg mb-4">Pay with Paypal</h3>
                <PayPalButton amount={cart.totalPrice} onSuccess={handlePaymentSuccess} onError={() => alert("Payment failed. Try again.")} />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Order Summary */}
      <div className="bg-white shadow-sm p-6 rounded-lg">
        <h3 className="text-lg mb-4">Order Summary</h3>
        <div className="border-t py-4 mb-4">
          {cart.products.map((product, index) => (
            <div key={index} className="flex items-start justify-between py-2 border-b">
              <div className="flex items-start">
                <img src={product.image} alt={product.name} className="w-20 h-24 object-cover mr-4" />
                <div>
                  <h3 className="text-md">{product.name}</h3>
                  <p className="text-gray-500">Size: {product.size || "N/A"}</p>
                  <p className="text-gray-500">Color: {product.color || "N/A"}</p>
                </div>
              </div>
              <p className="text-xl">${product.price?.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-lg mb-4">
          <p>Subtotal</p>
          <p>${cart.totalPrice?.toLocaleString()}</p>
        </div>
        <div className="flex justify-between items-center text-lg">
          <p>Shipping</p>
          <p>Free</p>
        </div>
        <div className="flex justify-between items-center text-lg mt-4 border-t pt-4">
          <p>Total</p>
          <p>${cart.totalPrice?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
