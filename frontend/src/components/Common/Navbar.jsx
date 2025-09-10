import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiBars3BottomRight,
} from "react-icons/hi2";
import SearchBar from "./SearchBar";
import CartDrawer from "../Layout/CartDrawer";
import { IoMdClose } from "react-icons/io";
import { useSelector } from "react-redux";

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  const {user} = useSelector((state)=>state.auth)

  // ✅ Safe selector (works if state.cart OR state.cart.cart is used)
  const cart = useSelector((state) => state.cart.cart || state.cart);

  // ✅ Safe reduce with number conversion
  const cartItemCount =
    cart?.products?.reduce(
      (total, product) => total + (Number(product.quantity) || 0),
      0
    ) || 0;

  // ✅ Toggle functions
  const toggleNavDrawer = () => {
    setNavDrawerOpen((prev) => !prev);
  };

  const toggleCartDrawer = () => {
    setDrawerOpen((prev) => !prev);
  };

  return (
    <>
      <nav className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo Left */}
        <div>
          <Link to="/" className="text-2xl font-medium">
            MarketMax
          </Link>
        </div>

        {/* Center - Navigation Links */}
        <div className="hidden md:flex space-x-6">
          <Link
            to="/collections/all?gender=Men"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Men
          </Link>
          <Link
            to="/collections/all?gender=Women"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Women
          </Link>
          <Link
            to="/collections/all?category=Top Wear"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Top Wear
          </Link>
          <Link
            to="/collections/all?category=Bottom Wear"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Bottom Wear
          </Link>
        </div>

        {/* Right - Icons */}
        <div className="flex items-center space-x-4">
          {user && user.role === "admin" &&(
            <Link
            to="/admin"
            className="block bg-black px-2 font-bold rounded text-sm text-white"
          >
            Admin
          </Link>
          )}
          
          <Link to="/profile" className="hover:text-black">
            <HiOutlineUser className="h-6 w-6 text-gray-700" />
          </Link>

          {/* Cart */}
          <button
            onClick={toggleCartDrawer}
            className="relative hover:text-black"
            aria-label="Open cart"
          >
            <HiOutlineShoppingBag className="h-6 w-6 text-gray-700" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rabbit-red text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Search */}
          <div className="overflow-hidden">
            <SearchBar />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleNavDrawer}
            className="md:hidden"
            aria-label="Open menu"
          >
            <HiBars3BottomRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </nav>

      {/* Cart Drawer */}
      <CartDrawer drawerOpen={drawerOpen} toggleCartDrawer={toggleCartDrawer} />

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed top-0 left-0 w-3/4 sm:w-1/2 md:w-1/3 h-full bg-white shadow-lg transform transition-transform duration-300 z-50 ${
          navDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button onClick={toggleNavDrawer} aria-label="Close menu">
            <IoMdClose className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Mobile Links */}
        <div className="px-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Menu</h2>
          <Link
            to="/collections/all?gender=Men"
            className="block text-gray-700 font-medium text-lg"
          >
            Men
          </Link>
          <Link
            to="/collections/all?gender=Women"
            className="block text-gray-700 font-medium text-lg"
          >
            Women
          </Link>
          <Link
            to="/collections/all?category=Top Wear"
            className="block text-gray-700 font-medium text-lg"
          >
            Top Wear
          </Link>
          <Link
            to="/collections/all?category=Bottom Wear"
            className="block text-gray-700 font-medium text-lg"
          >
            Bottom Wear
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
