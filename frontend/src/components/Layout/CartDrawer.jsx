

import { IoMdClose } from 'react-icons/io';
import CartContents from '../Cart/CartContents';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const CartDrawer = ({ drawerOpen, toggleCartDrawer }) => {
  const { user, guestId } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);

  // ✅ Corrected userId extraction
  const userId = user ? user._id : null;

  const navigate = useNavigate();

  const handleCheckout = () => {
    toggleCartDrawer();
    if (!user) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  // ✅ Debugging log
  console.log("CART STATE:", cart);

  return (
    <div
      className={`fixed top-0 right-0 w-3/4 sm:w-1/2 md:w-[30rem] h-full bg-white shadow-lg transform transition-transform duration-300 z-50 flex flex-col ${
        drawerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Close Button */}
      <div className="flex justify-end p-4">
        <button onClick={toggleCartDrawer} aria-label="Close cart drawer">
          <IoMdClose className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Cart Content */}
      <div className="flex-grow overflow-y-auto px-4">
        <h2 className="text-xl font-semibold mb-4">Your Cart</h2>

        {cart && cart.products && cart.products.length > 0 ? (
          <CartContents cart={cart} userId={userId} guestId={guestId} />
        ) : (
          <p>Your cart is empty.</p>
        )}
      </div>

      {/* Checkout Button */}
      <div onClick={handleCheckout} className="p-4 bg-white sticky bottom-0">
        {cart && cart.products && cart.products.length > 0 && (
          <>
            <button className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 font-semibold transition duration-200">
              Checkout
            </button>
            <p className="text-sm text-center text-gray-500 mt-2 tracking-tight">
              Shipping, taxes, and discount codes calculated at checkout.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
