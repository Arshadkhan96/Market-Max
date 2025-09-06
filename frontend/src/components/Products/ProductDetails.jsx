
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import ProductGrid from "./ProductGrid";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductDetails,
  fetchSimilarProducts,
} from "../../redux/slices/productsSlice";
import { addToCart } from "../../redux/slices/cartSlice";

const validObjectId = (v) => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);

const ProductDetails = ({ productId }) => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const {
    selectedProduct,
    loading: productLoading,
    error: productError,
    similarProducts = [],
    similarLoading,
    similarError,
  } = useSelector((state) => state.products);

  const { user, guestId } = useSelector((state) => state.auth);

  const [mainImage, setMainImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const productFetchId = productId || id;

  useEffect(() => {
    if (!productFetchId) return;
    if (!validObjectId(productFetchId)) return;

    dispatch(fetchProductDetails(productFetchId));
    dispatch(fetchSimilarProducts(productFetchId));
  }, [dispatch, productFetchId]);

  useEffect(() => {
    if (selectedProduct?.images?.length > 0) {
      setMainImage(selectedProduct.images[0].url);
    } else {
      setMainImage("");
    }
  }, [selectedProduct]);

  const handleQuantityChange = (action) => {
    setQuantity((q) => {
      if (action === "plus") return q + 1;
      if (action === "minus" && q > 1) return q - 1;
      return q;
    });
  };

  const handleAddToCart = () => {
    if (selectedProduct?.sizes?.length > 0 && !selectedSize) {
      toast.error("Please select a size.");
      return;
    }
    if (selectedProduct?.colors?.length > 0 && !selectedColor) {
      toast.error("Please select a color.");
      return;
    }

    setIsButtonDisabled(true);

    dispatch(
      addToCart({
        productId: productFetchId,
        quantity,
        size: selectedSize || null,
        color: selectedColor || null,
        guestId,
        userId: user?._id || null,
      })
    )
      .unwrap()
      .then(() => toast.success("Product added to cart!"))
      .catch(() => toast.error("Failed to add product."))
      .finally(() => setIsButtonDisabled(false));
  };

  if (productLoading) return <p>Loading product...</p>;
  if (productError) return <p className="text-red-500">Error: {productError}</p>;

  return (
    <div className="p-4 md:p-6">
      {selectedProduct ? (
        <div className="max-w-6xl mx-auto bg-white p-6 md:p-10 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Images */}
            <div className="flex gap-4">
              {/* Thumbnails vertically */}
              <div className="flex flex-col gap-3">
                {selectedProduct.images?.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.url}
                    alt={`thumbnail-${idx}`}
                    onClick={() => setMainImage(img.url)}
                    className={`w-20 h-20 object-cover cursor-pointer rounded-md border ${
                      mainImage === img.url ? "border-black" : "border-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Main Image */}
              <div className="flex-1">
                <img
                  src={
                    mainImage ||
                    selectedProduct.images?.[0]?.url ||
                    "https://via.placeholder.com/500"
                  }
                  alt={selectedProduct.name}
                  className="w-full h-[450px] object-cover rounded-lg border"
                />
              </div>
            </div>

            {/* Right: Info */}
            <div>
              <h1 className="text-2xl font-semibold mb-2">
                {selectedProduct.name}
              </h1>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-gray-500 line-through text-lg">
                  ₹{selectedProduct.originalPrice || selectedProduct.price + 30}
                </span>
                <span className="text-xl font-bold text-red-600">
                  ₹{selectedProduct.price}
                </span>
              </div>
              <p className="text-gray-600 mb-4">
                {selectedProduct.description}
              </p>

              {/* Colors */}
              {selectedProduct.colors?.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-medium mb-2">Color:</h3>
                  <div className="flex gap-3">
                    {selectedProduct.colors.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        className={`w-7 h-7 rounded-full border-2 ${
                          selectedColor === color
                            ? "border-black-400 scale-110"
                            : "border-gray-400"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {selectedProduct.sizes?.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-medium mb-2">Size:</h3>
                  <div className="flex gap-2">
                    {selectedProduct.sizes.map((size, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1 border rounded-md ${
                          selectedSize === size
                            ? "bg-black text-white"
                            : "bg-white text-black"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-5">
                <button
                  onClick={() => handleQuantityChange("minus")}
                  className="px-3 py-1 border rounded-md"
                >
                  -
                </button>
                <span className="text-lg">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange("plus")}
                  className="px-3 py-1 border rounded-md"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isButtonDisabled}
                className={`w-full py-3 rounded-md font-medium ${
                  isButtonDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {isButtonDisabled ? "Adding..." : "ADD TO CART"}
              </button>

              {/* Characteristics */}
              <div className="mt-8">
                <h3 className="font-medium mb-2">Characteristics:</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>
                    <strong>Brand:</strong> {selectedProduct.brand || "N/A"}
                  </li>
                  <li>
                    <strong>Material:</strong>{" "}
                    {selectedProduct.material || "N/A"}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Similar Products */}
          <div className="mt-16">
            <h2 className="text-2xl text-center font-medium mb-6">
              You May Also Like
            </h2>
            {similarLoading && <p>Loading similar products...</p>}
            {similarError && (
              <p className="text-red-500 text-center">{similarError}</p>
            )}
            <ProductGrid products={similarProducts} />
          </div>
        </div>
      ) : (
        <p className="text-center">No product found.</p>
      )}
    </div>
  );
};

export default ProductDetails;
