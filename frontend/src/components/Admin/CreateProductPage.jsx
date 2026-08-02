import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createProduct } from '../../redux/slices/adminProductSlice';

const CreateProductPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: 0,
    countInstock: 0,
    sku: '',
    category: '',
    brand: '',
    sizes: [],
    colors: [],
    collections: '',
    material: '',
    gender: 'Unisex',
    images: [],
  });

  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setProductData((prev) => ({
        ...prev,
        images: [...(prev.images || []), { url: data.imageUrl, altText: '' }],
      }));
      setUploading(false);
    } catch (error) {
      console.error('Image upload failed:', error);
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...productData,
      sizes: Array.isArray(productData.sizes) ? productData.sizes : productData.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: Array.isArray(productData.colors) ? productData.colors : productData.colors.split(',').map((s) => s.trim()).filter(Boolean),
      images: productData.images.length ? productData.images : [],
    };

    dispatch(createProduct(payload))
      .unwrap()
      .then(() => {
        navigate('/admin/products');
      })
      .catch((err) => {
        console.error('Create product failed:', err);
        alert(err?.message || 'Failed to create product');
      });
  };

  return (
    <div className='max-w-5xl mx-auto p-6 shadow-md rounded-md bg-white'>
      <h2 className='text-3xl font-bold mb-6'>Create Product</h2>

      <form onSubmit={handleSubmit}>
        <div className='mb-6'>
          <label className='block font-semibold mb-2'>Product Name</label>
          <input
            type='text'
            name='name'
            value={productData.name}
            onChange={handleChange}
            className='w-full border border-gray-300 rounded-md p-2'
            required
          />
        </div>

        <div className='mb-6'>
          <label className='block font-semibold mb-2'>Description</label>
          <textarea
            name='description'
            value={productData.description}
            onChange={handleChange}
            className='w-full border border-gray-300 rounded-md p-2'
            rows={4}
            required
          />
        </div>

        <div className='mb-6'>
          <label className='block font-semibold mb-2'>Price</label>
          <input
            type='number'
            name='price'
            value={productData.price}
            onChange={handleChange}
            className='w-full border border-gray-300 rounded-md p-2'
            required
          />
        </div>

        <div className='mb-6'>
          <label className='block font-semibold mb-2'>Count in Stock</label>
          <input
            type='number'
            name='countInstock'
            value={productData.countInstock}
            onChange={handleChange}
            className='w-full border border-gray-300 rounded-md p-2'
            required
          />
        </div>

        <div className='mb-6'>
          <label className='block font-semibold mb-2'>SKU</label>
          <input
            type='text'
            name='sku'
            value={productData.sku}
            onChange={handleChange}
            className='w-full border border-gray-300 rounded-md p-2'
            required
          />
        </div>

        <div className='mb-6'>
          <label className='block font-semibold mb-2'>Category</label>
          <input
            type='text'
            name='category'
            value={productData.category}
            onChange={handleChange}
            className='w-full border border-gray-300 rounded-md p-2'
            required
          />
        </div>

        <div className='mb-6'>
          <label className='block font-semibold mb-2'>Brand</label>
          <input
            type='text'
            name='brand'
            value={productData.brand}
            onChange={handleChange}
            className='w-full border border-gray-300 rounded-md p-2'
          />
        </div>

        <div className='mb-6'>
          <label className='block font-semibold mb-2'>Sizes (comma-separated)</label>
          <input
            type='text'
            name='sizes'
            value={Array.isArray(productData.sizes) ? productData.sizes.join(', ') : productData.sizes}
            onChange={(e) => setProductData({ ...productData, sizes: e.target.value })}
            className='w-full border border-gray-300 rounded-md p-2'
            required
          />
        </div>

        <div className='mb-6'>
          <label className='block font-semibold mb-2'>Colors (comma-separated)</label>
          <input
            type='text'
            name='colors'
            value={Array.isArray(productData.colors) ? productData.colors.join(', ') : productData.colors}
            onChange={(e) => setProductData({ ...productData, colors: e.target.value })}
            className='w-full border border-gray-300 rounded-md p-2'
            required
          />
        </div>

        <div className='mb-6'>
          <label className='block font-semibold mb-2'>Collection</label>
          <input
            type='text'
            name='collections'
            value={productData.collections}
            onChange={handleChange}
            className='w-full border border-gray-300 rounded-md p-2'
            required
          />
        </div>

        <div className='mb-6'>
          <label className='block font-semibold mb-2'>Material</label>
          <input
            type='text'
            name='material'
            value={productData.material}
            onChange={handleChange}
            className='w-full border border-gray-300 rounded-md p-2'
          />
        </div>

        <div className='mb-6'>
          <label className='block font-semibold mb-2'>Gender</label>
          <select
            name='gender'
            value={productData.gender}
            onChange={handleChange}
            className='w-full border border-gray-300 rounded-md p-2'
          >
            <option value='Unisex'>Unisex</option>
            <option value='Men'>Men</option>
            <option value='Women'>Women</option>
          </select>
        </div>

        <div className='mb-6'>
          <label className='block font-semibold mb-2'>Upload Image</label>
          <input type='file' onChange={handleImageUpload} />
          {uploading && <p className='mt-2 text-sm text-gray-600'>Uploading image...</p>}

          <div className='flex gap-4 mt-4 flex-wrap'>
            {(productData.images || []).map((image, index) => (
              <img
                key={index}
                src={image.url}
                alt={image.altText || 'Product Image'}
                className='w-20 h-20 object-cover rounded-md shadow-md'
              />
            ))}
          </div>
        </div>

        <button
          type='submit'
          className='w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-semibold'
        >
          Create Product
        </button>
      </form>
    </div>
  );
};

export default CreateProductPage;
