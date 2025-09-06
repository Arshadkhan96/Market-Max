
import React from 'react'
import { RiDeleteBin3Line } from "react-icons/ri"
import { useDispatch } from 'react-redux'
import { removeFromCart, updateCartItemQuantity } from "../../redux/slices/cartSlice"

const CartContents = ({ cart, userId, guestId }) => {
    const dispatch = useDispatch()

    // ✅ Handle adding or subtracting from cart
    const handleUpdateQuantity = (productId, delta, currentQuantity, size, color) => {
        const newQuantity = currentQuantity + delta;
        if (newQuantity < 1) {
            // If quantity would go below 1, remove the item instead
            handleRemoveFromCart(productId, size, color);
            return;
        }
        
        dispatch(updateCartItemQuantity({
            productId,
            quantity: newQuantity,
            guestId,
            userId,
            size: size || undefined,
            color: color || undefined,
        })).unwrap()
        .catch(error => {
            console.error('Failed to update quantity:', error);
            // Optionally show error to user
        });
    }

    // ✅ Handle removing item from cart
    const handleRemoveFromCart = (productId, size, color) => {
        dispatch(removeFromCart({ 
            productId, 
            userId, 
            guestId, 
            size: size || undefined, 
            color: color || undefined 
        })).unwrap()
        .catch(error => {
            console.error('Failed to remove item:', error);
            // Optionally show error to user
        });
    }

    return (
        <div>
            {cart.products.map((product, index) => (
                <div key={index}
                    className='flex items-start justify-between py-4 border-b'>

                    <div className='flex items-start'>
                        <img src={product.image} alt={product.name}
                            className='w-16 h-20 sm:h-24 sm:w-20 object-cover mr-4 rounded' />
                        <div>
                            <h3>{product.name}</h3>
                            <p className='text-sm text-gray-500'>
                                size: {product.size} | color: {product.color}
                            </p>

                            <div className='flex items-center mt-2'>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateQuantity(
                                            product.productId, 
                                            -1, 
                                            product.quantity, 
                                            product.size, 
                                            product.color
                                        );
                                    }}
                                    className='border rounded px-2 py-1 text-xl font-medium hover:bg-gray-100 transition-colors'
                                    aria-label="Decrease quantity">
                                    -
                                </button>
                                <span className='mx-4 w-6 text-center'>{product.quantity}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateQuantity(
                                            product.productId, 
                                            1, 
                                            product.quantity, 
                                            product.size, 
                                            product.color
                                        );
                                    }}
                                    className='border rounded px-2 py-1 text-xl font-medium hover:bg-gray-100 transition-colors'
                                    aria-label="Increase quantity">
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p>${product.price.toLocaleString()}</p>

                        {/* ❌ FIXED: productId was not defined, replaced with product.productId */}
                        <button onClick={() => handleRemoveFromCart(product.productId, product.size, product.color)}>
                            <RiDeleteBin3Line className='w-6 h-6 mt-2 text-red-600' />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default CartContents
