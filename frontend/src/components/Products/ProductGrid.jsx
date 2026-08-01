import React from 'react';
import { Link } from 'react-router-dom';

const fallbackProductImage =
  'https://via.placeholder.com/800x1000?text=No+Image+Available';

const getProductImageUrl = (product) => {
  const firstImage = Array.isArray(product?.images) ? product.images[0] : null;

  if (!firstImage) return fallbackProductImage;
  if (typeof firstImage === 'string') return firstImage;
  return firstImage.url || fallbackProductImage;
};

const getProductImageAlt = (product) => {
  const firstImage = Array.isArray(product?.images) ? product.images[0] : null;
  return firstImage?.altText || product?.name || 'Product image';
};

const ProductGrid = ({ products,loading,error})=>{

  if(loading){
    return <p>loading..</p>
  }

  if(error){
    return <p>Error: {error}</p>
  }
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7'>
      {products.map((product, index) => (

        <Link key={product?._id || `${product?.name}-${index}`} to={`/product/${product._id}`} className='block'>
          <div className='bg-white p-4 rounded-lg shadow-md'>
            <div className='w-full h-96 mb-4'>

              <img
                src={getProductImageUrl(product)}
                alt={getProductImageAlt(product)}
                className='w-full h-full object-cover rounded-lg'
              />
            </div>
            <h3 className="text-sm mb-2">{product.name}</h3>
            <p className="font-medium text-gray-500 tracking-tighter text-sm">${product.price}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ProductGrid;
