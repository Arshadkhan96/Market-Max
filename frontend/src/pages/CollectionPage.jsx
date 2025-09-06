// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { FaFilter, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
// import FilterSideBar from '../components/Products/FilterSideBar';
// import SortOption from '../components/Products/SortOption';
// import ProductGrid from '../components/Products/ProductGrid';
// import { useParams, useSearchParams } from 'react-router-dom';
// import { useDispatch, useSelector } from "react-redux";
// import { fetchProductsByFilters } from "../redux/slices/productsSlice";

// const CollectionPage = () => {
//     const { collection } = useParams();
//     const [searchParams] = useSearchParams();
//     const dispatch = useDispatch();
    
//     // Get products from the correct location in state
//     const { products, loading, error, metadata } = useSelector((state) => state.products);
    
//     // Debug: Log the current state
//     useEffect(() => {
//         console.log("Redux state - products:", products);
//         console.log("Redux state - loading:", loading);
//         console.log("Redux state - error:", error);
//         console.log("Redux state - metadata:", metadata);
//     }, [products, loading, error, metadata]);
    
//     // Convert searchParams to a plain object for dependency comparison
//     const queryParams = Object.fromEntries(searchParams.entries());
    
//     // Create a string representation of queryParams for the dependency array
//     const queryString = JSON.stringify(queryParams);

//     const sidebarRef = useRef(null);
//     const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//     const [retryCount, setRetryCount] = useState(0);
//     const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false);

//     // Validate and clean filters before sending to API
//     const validateFilters = (filters) => {
//         const validFilters = {};
        
//         Object.entries(filters).forEach(([key, value]) => {
//             // Only include filters with actual values
//             if (value && 
//                 value !== '' && 
//                 value !== 'all' && 
//                 value !== 'undefined' &&
//                 !(Array.isArray(value) && value.length === 0)) {
//                 validFilters[key] = value;
//             }
//         });
        
//         return validFilters;
//     };

//     // Fetch products when collection or query params change
//     useEffect(() => {
//         // Create a proper filters object
//         let filters = { 
//             collection: collection || 'all',
//             ...queryParams 
//         };
        
//         // Convert string values to numbers where appropriate
//         if (queryParams.minPrice) filters.minPrice = Number(queryParams.minPrice);
//         if (queryParams.maxPrice) filters.maxPrice = Number(queryParams.maxPrice);
//         if (queryParams.limit) filters.limit = Number(queryParams.limit);
        
//         // Handle array parameters (they might come as comma-separated strings)
//         if (filters.size) {
//             filters.size = Array.isArray(filters.size) 
//                 ? filters.size 
//                 : filters.size.split(',');
//         }
        
//         if (filters.color) {
//             filters.color = Array.isArray(filters.color) 
//                 ? filters.color 
//                 : filters.color.split(',');
//         }
        
//         if (filters.material) {
//             filters.material = Array.isArray(filters.material) 
//                 ? filters.material 
//                 : filters.material.split(',');
//         }
        
//         if (filters.gender) {
//             filters.gender = Array.isArray(filters.gender) 
//                 ? filters.gender 
//                 : filters.gender.split(',');
//         }
        
//         // Validate and clean filters
//         filters = validateFilters(filters);
        
//         console.log("Dispatching with validated filters:", filters);
//         dispatch(fetchProductsByFilters(filters));
//         setHasAttemptedInitialLoad(true);
//     }, [dispatch, collection, queryString, retryCount]);

//     const toggleSidebar = () => {
//         setIsSidebarOpen(!isSidebarOpen);
//     };

//     // Use useCallback to memoize the function
//     const handleClickOutside = useCallback((e) => {
//         // Close sidebar if clicked outside and sidebar is open
//         if (sidebarRef.current && !sidebarRef.current.contains(e.target) && isSidebarOpen) {
//             setIsSidebarOpen(false);
//         }
//     }, [isSidebarOpen]);

//     useEffect(() => {
//         // Add event listener for clicks
//         document.addEventListener("mousedown", handleClickOutside);
        
//         // Clean up event listener
//         return () => {
//             document.removeEventListener("mousedown", handleClickOutside);
//         };
//     }, [handleClickOutside]);

//     // Format collection name for display
//     const formatCollectionName = (name) => {
//         if (!name || name === 'all') return "All Collections";
//         return name.split('-')
//             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//             .join(' ');
//     };

//     const handleRetry = () => {
//         setRetryCount(prev => prev + 1);
//     };

//     const handleClearFilters = () => {
//         // Clear all search params except collection
//         const newSearchParams = new URLSearchParams();
//         if (collection && collection !== 'all') {
//             newSearchParams.set('collection', collection);
//         }
//         window.location.search = newSearchParams.toString();
//     };

//     return (
//         <div className='flex flex-col lg:flex-row min-h-screen'>
//             {/* Mobile filter button */}
//             <button 
//                 onClick={toggleSidebar} 
//                 className="lg:hidden p-4 border-b flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 transition-colors"
//             >
//                 <FaFilter className="mr-2" /> 
//                 {isSidebarOpen ? 'Hide Filters' : 'Show Filters'}
//             </button>

//             {/* Filter Sidebar with overlay for mobile */}
//             {isSidebarOpen && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
//             )}
            
//             <div 
//                 ref={sidebarRef} 
//                 className={`
//                     ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
//                     fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white overflow-y-auto 
//                     transition-transform duration-300 ease-in-out lg:translate-x-0
//                     shadow-lg lg:shadow-none
//                 `}
//             >
//                 <FilterSideBar onClose={() => setIsSidebarOpen(false)} />
//             </div>

//             {/* Main content */}
//             <div className="flex-grow p-4 lg:p-6">
//                 <h2 className="text-2xl lg:text-3xl font-bold mb-6 uppercase text-gray-800">
//                     {formatCollectionName(collection)}
//                 </h2>

//                 {/* Show loading state */}
//                 {loading && (
//                     <div className="flex justify-center items-center py-8">
//                         <FaSpinner className="animate-spin text-2xl text-blue-500 mr-2" />
//                         <span>Loading products...</span>
//                     </div>
//                 )}

//                 {/* Show error message */}
//                 {error && (
//                     <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//                         <p className="font-bold">Error Loading Products</p>
//                         <p>{error}</p>
//                         <button 
//                             onClick={handleRetry}
//                             className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
//                         >
//                             Retry
//                         </button>
//                     </div>
//                 )}

//                 {/* Show empty state if no products after initial load */}
//                 {!loading && !error && hasAttemptedInitialLoad && products.length === 0 && (
//                     <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 mb-6">
//                         <div className="flex items-center">
//                             <FaExclamationTriangle className="text-yellow-500 text-xl mr-3" />
//                             <h3 className="text-lg font-medium text-yellow-800">No products found</h3>
//                         </div>
//                         <div className="mt-2 text-yellow-700">
//                             <p>No products match your current filters. Try:</p>
//                             <ul className="list-disc list-inside mt-2 pl-5">
//                                 <li>Broadening your search criteria</li>
//                                 <li>Checking for spelling errors</li>
//                                 <li>Removing some filters</li>
//                             </ul>
//                         </div>
//                         <button
//                             onClick={handleClearFilters}
//                             className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
//                         >
//                             Clear All Filters
//                         </button>
//                     </div>
//                 )}

//                 {/* Sort Option and Product Grid */}
//                 {!loading && !error && products.length > 0 && (
//                     <>
//                         <div className="mb-6 flex justify-between items-center">
//                             <SortOption />
//                             {metadata.totalProducts > 0 && (
//                                 <p className="text-sm text-gray-600">
//                                     Showing {products.length} of {metadata.totalProducts} products
//                                 </p>
//                             )}
//                         </div>

//                         {/* Product Grid */}
//                         <ProductGrid products={products} />
//                     </>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default CollectionPage;

////////////////////////////////////////////
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaFilter, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import FilterSideBar from '../components/Products/FilterSideBar';
import SortOption from '../components/Products/SortOption';
import ProductGrid from '../components/Products/ProductGrid';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters } from "../redux/slices/productsSlice";

const CollectionPage = () => {
    const { collection } = useParams();
    const [searchParams] = useSearchParams(); // ✅ this gets ?gender=Men from URL
    const dispatch = useDispatch();
    
    // Get products from redux
    const { products, loading, error, metadata } = useSelector((state) => state.products);
    
    // Debug log
    useEffect(() => {
        console.log("Redux state - products:", products);
        console.log("Redux state - loading:", loading);
        console.log("Redux state - error:", error);
        console.log("Redux state - metadata:", metadata);
    }, [products, loading, error, metadata]);
    
    // Convert query params to plain object
    const queryParams = Object.fromEntries(searchParams.entries());
    const queryString = JSON.stringify(queryParams); // for dependency

    const sidebarRef = useRef(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false);

    // ✅ Validate filters
    const validateFilters = (filters) => {
        const validFilters = {};
        Object.entries(filters).forEach(([key, value]) => {
            if (
                value &&
                value !== '' &&
                value !== 'all' &&
                value !== 'undefined' &&
                !(Array.isArray(value) && value.length === 0)
            ) {
                validFilters[key] = value;
            }
        });
        return validFilters;
    };

    // ✅ Fetch products when collection or query params change
    useEffect(() => {
        // Create a clean filters object with proper type conversion
        let filters = { 
            collection: collection || 'all'
        };

        // Add all query params to filters
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value && value !== 'all') {
                // Handle special cases for array parameters
                if (['size', 'color', 'material'].includes(key)) {
                    filters[key] = Array.isArray(value) 
                        ? value 
                        : value.split(',');
                } 
                // Handle numeric parameters
                else if (['minPrice', 'maxPrice', 'limit', 'page'].includes(key)) {
                    filters[key] = Number(value);
                }
                // Handle gender parameter - ensure consistent case
                else if (key === 'gender') {
                    // Convert to lowercase for consistency
                    filters.gender = value.toLowerCase();
                    console.log('Setting gender filter to:', filters.gender);
                }
                // Add all other parameters as-is
                else {
                    filters[key] = value;
                }
            }
        });
        
        filters = validateFilters(filters); // clean filters
        
        console.log("Dispatching with validated filters:", filters);
        dispatch(fetchProductsByFilters(filters));
        setHasAttemptedInitialLoad(true);
    }, [dispatch, collection, queryString, retryCount]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleClickOutside = useCallback((e) => {
        if (sidebarRef.current && !sidebarRef.current.contains(e.target) && isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    }, [isSidebarOpen]);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [handleClickOutside]);

    // ✅ Format name for display
    const formatCollectionName = (name) => {
        if (!name || name === 'all') return "All Collections";
        return name.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleRetry = () => setRetryCount(prev => prev + 1);

    const handleClearFilters = () => {
        const newSearchParams = new URLSearchParams();
        if (collection && collection !== 'all') {
            newSearchParams.set('collection', collection);
        }
        window.location.search = newSearchParams.toString();
    };

    return (
        <div className='flex flex-col lg:flex-row min-h-screen'>
            {/* Mobile filter button */}
            <button 
                onClick={toggleSidebar} 
                className="lg:hidden p-4 border-b flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
                <FaFilter className="mr-2" /> 
                {isSidebarOpen ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Sidebar */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}
            
            <div 
                ref={sidebarRef} 
                className={`
                    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
                    fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white overflow-y-auto 
                    transition-transform duration-300 ease-in-out lg:translate-x-0
                    shadow-lg lg:shadow-none
                `}
            >
                <FilterSideBar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Main Content */}
            <div className="flex-grow p-4 lg:p-6">
                <h2 className="text-2xl lg:text-3xl font-bold mb-6 uppercase text-gray-800">
                    {formatCollectionName(collection)}
                </h2>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center items-center py-8">
                        <FaSpinner className="animate-spin text-2xl text-blue-500 mr-2" />
                        <span>Loading products...</span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-bold">Error Loading Products</p>
                        <p>{error}</p>
                        <button 
                            onClick={handleRetry}
                            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && hasAttemptedInitialLoad && products.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 mb-6">
                        <div className="flex items-center">
                            <FaExclamationTriangle className="text-yellow-500 text-xl mr-3" />
                            <h3 className="text-lg font-medium text-yellow-800">No products found</h3>
                        </div>
                        <div className="mt-2 text-yellow-700">
                            <p>No products match your current filters. Try:</p>
                            <ul className="list-disc list-inside mt-2 pl-5">
                                <li>Broadening your search criteria</li>
                                <li>Checking for spelling errors</li>
                                <li>Removing some filters</li>
                            </ul>
                        </div>
                        <button
                            onClick={handleClearFilters}
                            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}

                {/* Products */}
                {!loading && !error && products.length > 0 && (
                    <>
                        <div className="mb-6 flex justify-between items-center">
                            <SortOption />
                            {metadata.totalProducts > 0 && (
                                <p className="text-sm text-gray-600">
                                    Showing {products.length} of {metadata.totalProducts} products
                                </p>
                            )}
                        </div>

                        <ProductGrid products={products} />
                    </>
                )}
            </div>
        </div>
    );
};

export default CollectionPage;
