import React, { useEffect, useState } from "react";
import Hero from "../components/Layout/Hero";
import GenderCollectionSection from "../components/Products/GenderCollectionSection";
import NewArrivals from "../components/Products/NewArrivals";
import ProductDetails from "../components/Products/ProductDetails";
import { Toaster } from "sonner";
import ProductGrid from "../components/Products/ProductGrid";
import FeatureCollection from "../components/Products/FeatureCollection";
import FeaturesSection from "../components/Products/FeaturesSection";
import { useDispatch } from "react-redux";
import axios from "axios";

const Home = () => {
  const dispatch = useDispatch();
  const [bestSellerProduct, setBestSellerProduct] = useState(null);
  const [womensTopWear, setWomensTopWear] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch Women's Top Wear directly
    const fetchWomensTopWear = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products`,
          {
            params: {
              gender: "Women",
              category: "Top Wear",
              limit: 8
            }
          }
        );
        setWomensTopWear(response.data.products || response.data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching women's top wear:", err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch best seller product
    const fetchBestSeller = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products/best-seller`
        );
        setBestSellerProduct(response.data?.product || response.data);
      } catch (error) {
        console.error("Best seller product not found", error);
      }
    };

    fetchWomensTopWear();
    fetchBestSeller();
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />
      <GenderCollectionSection />
      <NewArrivals />
      <Toaster position="top-right" />

      {/* Best Seller Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-center font-bold mb-8">Best Seller</h2>
          {bestSellerProduct ? (
            <ProductDetails productId={bestSellerProduct._id} />
          ) : (
            <p className="text-center">Loading best seller product...</p>
          )}
        </div>
      </section>

      {/* Women's Top Wear Collection Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-center font-bold mb-8">
            Top Wears for Women
          </h2>
          <ProductGrid products={womensTopWear} loading={loading} error={error} />
        </div>
      </section>

      <FeatureCollection />
      <FeaturesSection />
    </div>
  );
};

export default Home;