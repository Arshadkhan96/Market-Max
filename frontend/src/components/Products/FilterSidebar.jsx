import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const FilterSideBar = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize all filters as empty/unselected
  const [filters, setFilters] = useState({
    category: "",
    gender: "",
    color: "",
    size: [],
    material: [],
    brand: [],
    minPrice: 0,
    maxPrice: 100,
  });

  const [priceRange, setPriceRange] = useState([0, 100]);

  // Filter options data
  const categories = ["Top Wear", "Bottom Wear"];
  const colors = ["Red", "Blue", "Black", "Green", "Yellow", "Gray", "White", "Pink", "Beige", "Navy"];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const materials = ["Cotton", "Wool", "Denim", "Polyester", "Silk", "Linen", "Viscose", "Fleece"];
  const brands = ["Urban Threads", "Modern Fit", "Street Style", "Beach Breeze", "Fashionista", "ChicStyle"];
  const genders = ["Men", "Women"];

  const updateFilter = (type, value) => {
    // For radio buttons (category/gender), we want to toggle if clicking the same option
    const newValue = (type === "category" || type === "gender") 
      ? filters[type] === value ? "" : value 
      : value;
    
    const newFilters = { ...filters, [type]: newValue };
    setFilters(newFilters);
    
    console.log(`Filter changed - ${type}:`, newValue);

    const params = {};
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.gender) params.gender = newFilters.gender;
    if (newFilters.color) params.color = newFilters.color;
    if (newFilters.size.length) params.size = newFilters.size.join(",");
    if (newFilters.material.length) params.material = newFilters.material.join(",");
    if (newFilters.brand.length) params.brand = newFilters.brand.join(",");
    if (newFilters.minPrice > 0) params.minPrice = newFilters.minPrice;
    if (newFilters.maxPrice < 100) params.maxPrice = newFilters.maxPrice;

    setSearchParams(params);
  };

  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);

    const initialFilters = {
      category: params.category || "",
      gender: params.gender || "",
      color: params.color || "",
      size: params.size ? params.size.split(",") : [],
      material: params.material ? params.material.split(",") : [],
      brand: params.brand ? params.brand.split(",") : [],
      minPrice: Number(params.minPrice) || 0,
      maxPrice: Number(params.maxPrice) || 100,
    };

    setFilters(initialFilters);
    setPriceRange([0, Number(params.maxPrice) || 100]);
    
    console.log("Initial filters:", initialFilters);
  }, [searchParams]);

  return (
    <div className="p-4">
      <h3 className="text-xl font-medium text-gray-800 mb-4">Filter</h3>

      {/* Category Filter - Now properly toggles */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Category</label>
        {categories.map((category) => (
          <div key={category} className="flex items-center mb-1">
            <input
              type="radio"
              name="category"
              checked={filters.category === category}
              onChange={() => {
                updateFilter("category", category);
                console.log("Selected category:", category);
              }}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <span className="text-gray-700">{category}</span>
          </div>
        ))}
      </div>

      {/* Gender Filter - Now properly toggles */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Gender</label>
        {genders.map((gender) => (
          <div key={gender} className="flex items-center mb-1">
            <input
              type="radio"
              name="gender"
              checked={filters.gender === gender}
              onChange={() => {
                updateFilter("gender", gender);
                console.log("Selected gender:", gender);
              }}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <span className="text-gray-700">{gender}</span>
          </div>
        ))}
      </div>

      {/* Color Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => {
                updateFilter("color", color);
                console.log("Selected color:", color);
              }}
              className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all ${
                filters.color === color
                  ? "ring-2 ring-blue-500 border-blue-500"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              style={{ backgroundColor: color.toLowerCase() }}
              aria-label={color}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Size Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Size</label>
        {sizes.map((size) => (
          <div key={size} className="flex items-center mb-1">
            <input
              type="checkbox"
              checked={filters.size.includes(size)}
              onChange={() => {
                const newSizes = filters.size.includes(size)
                  ? filters.size.filter((s) => s !== size)
                  : [...filters.size, size];
                updateFilter("size", newSizes);
                console.log("Selected sizes:", newSizes);
              }}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <span className="text-gray-700">{size}</span>
          </div>
        ))}
      </div>

      {/* Material Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Material</label>
        {materials.map((material) => (
          <div key={material} className="flex items-center mb-1">
            <input
              type="checkbox"
              checked={filters.material.includes(material)}
              onChange={() => {
                const newMaterials = filters.material.includes(material)
                  ? filters.material.filter((m) => m !== material)
                  : [...filters.material, material];
                updateFilter("material", newMaterials);
                console.log("Selected materials:", newMaterials);
              }}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <span className="text-gray-700">{material}</span>
          </div>
        ))}
      </div>

      {/* Brand Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Brand</label>
        {brands.map((brand) => (
          <div key={brand} className="flex items-center mb-1">
            <input
              type="checkbox"
              checked={filters.brand.includes(brand)}
              onChange={() => {
                const newBrands = filters.brand.includes(brand)
                  ? filters.brand.filter((b) => b !== brand)
                  : [...filters.brand, brand];
                updateFilter("brand", newBrands);
                console.log("Selected brands:", newBrands);
              }}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <span className="text-gray-700">{brand}</span>
          </div>
        ))}
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">
          Price Range: ${filters.minPrice} - ${filters.maxPrice}
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={filters.maxPrice}
            onChange={(e) => {
              const newPrice = Number(e.target.value);
              updateFilter("maxPrice", newPrice);
              console.log("Selected max price:", newPrice);
            }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterSideBar;