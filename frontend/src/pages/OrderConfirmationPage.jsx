import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../redux/slices/cartSlice";

const OrderConfirmationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { checkout } = useSelector((state) => state.checkout);

  // Clear the cart when the order is confirmed
  useEffect(() => {
    if (checkout && checkout._id) {
      dispatch(clearCart());
      localStorage.removeItem("cart");
    } else {
      navigate("/my-orders");
    }
  }, [checkout, dispatch, navigate]);

  const calculateEstimatedDelivery = (createdAt) => {
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 10);
    return orderDate.toLocaleDateString();
  };

  // 🛑 Fix: Protect against null checkout
  if (!checkout || !checkout._id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-4xl font-bold text-center text-emerald-700 mb-8">
        Thank You for Your Order!
      </h1>

      <div className="p-6 rounded-lg border space-y-8">
        {/* Order Info and Estimated Delivery */}
        <div className="flex justify-between">
          <div>
            <h2 className="text-xl font-semibold">Order ID: {checkout._id}</h2>
            <p className="text-gray-500">
              Order Date: {new Date(checkout.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-emerald-700 text-sm">
              Estimated Delivery: {calculateEstimatedDelivery(checkout.createdAt)}
            </p>
          </div>
        </div>

        {/* Shipping Address */}
        <div>
          <h3 className="text-lg font-medium">Shipping Address:</h3>
          <p>{checkout.shippingAddress?.address}</p>
          <p>
            {checkout.shippingAddress?.city}, {checkout.shippingAddress?.country}
          </p>
        </div>

        {/* Ordered Items */}
        <div>
          <h3 className="text-lg font-medium mb-4">Items Ordered:</h3>
          <div className="space-y-4">
            {checkout.checkoutItems?.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 border p-4 rounded-md"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    Color: {item.color} | Size: {item.size}
                  </p>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <p className="font-medium text-right">₹{item.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment and Delivery Info */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-2">Payment</h4>
            <p className="text-gray-600">PayPal</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2">Delivery</h4>
            <p className="text-gray-600">{checkout.shippingAddress?.address}</p>
            <p className="text-gray-600">
              {checkout.shippingAddress?.city}, {checkout.shippingAddress?.country}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
