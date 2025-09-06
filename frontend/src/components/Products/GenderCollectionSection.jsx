// import React from 'react'
// import mensCollectionImage from "../../assets/mens-collection.webp"
// import womensCollectionImage from "../../assets/womens-collection.webp"
// import { Link } from 'react-router-dom'


// const GenderCollectionSection = () => {
//   return (
//     <section className='py-16 px-4 lg:px-0'>
//         <div className="container mx-auto flex flex-col md:flex-row gap-8">
//             {/* women's Collection */}

//             <div className='relative flex-1 '>
//                 <img src={womensCollectionImage} alt="Women's Collection" className='w-full h-[700px] object-cover'/>
//                 <div className=' absolute bottom-8 bg-white left-8 bg-opacity-90 p-4'>
//                 <h2 className='text-2xl font-bold text-gray-900 mb-3'> 
//                     Women's Collection
//                 </h2>
//                 <Link to="/collections/all?gender=Women" className='text-gray-900 underline'> Shop Now</Link>
//                 </div>
//             </div>

//             {/* Men's Collection */}
//             <div className='relative flex-1 '>
//                 <img src={mensCollectionImage} alt="Men's Collection" className='w-full h-[700px] object-cover'/>
//                 <div className=' absolute bottom-8 bg-white left-8 bg-opacity-90 p-4'>
//                 <h2 className='text-2xl font-bold text-gray-900 mb-3'> 
//                     Men's Collection
//                 </h2>
//                 <Link to="/collections/all?gender=Men" className='text-gray-900 underline'> Shop Now</Link>
//                 </div>
//             </div>
            
//         </div>

//     </section>
//   )
// }

// export default GenderCollectionSection

////////////////////////////////////////////////////////
import React, { useEffect, useState } from 'react';
import mensCollectionImage from "../../assets/mens-collection.webp";
import womensCollectionImage from "../../assets/womens-collection.webp";
import { Link, useLocation } from 'react-router-dom';

const GenderCollectionSection = () => {
  const location = useLocation();
  const [activeGender, setActiveGender] = useState('');

  // Update active gender based on URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const gender = searchParams.get('gender');
    if (gender) {
      // Normalize to lowercase for UI state
      setActiveGender(gender.toLowerCase());
    } else {
      setActiveGender('');
    }
  }, [location.search]);
  return (
    <section className='py-16 px-4 lg:px-0'>
      <div className="container mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Women's Collection */}
        <div className='relative flex-1'>
          <img 
            src={womensCollectionImage} 
            alt="Women's Collection" 
            className='w-full h-[700px] object-cover' 
          />
          <div className='absolute bottom-8 left-8 bg-white bg-opacity-90 p-4 rounded-md shadow'>
            <h2 className='text-2xl font-bold text-gray-900 mb-3'> 
              Women's Collection
            </h2>
            <Link 
              to="/collections/all?gender=women" 
              className={`text-gray-900 underline hover:text-black ${
                activeGender === 'women' ? 'font-bold text-blue-600' : ''
              }`}
              state={{ fromGenderCollection: true }}
              onClick={() => setActiveGender('women')}
            >
              Shop Now
            </Link>
          </div>
        </div>

        {/* Men's Collection */}
        <div className='relative flex-1'>
          <img 
            src={mensCollectionImage} 
            alt="Men's Collection" 
            className='w-full h-[700px] object-cover' 
          />
          <div className='absolute bottom-8 left-8 bg-white bg-opacity-90 p-4 rounded-md shadow'>
            <h2 className='text-2xl font-bold text-gray-900 mb-3'> 
              Men's Collection
            </h2>
            <Link 
              to="/collections/all?gender=men" 
              className={`text-gray-900 underline hover:text-black ${
                activeGender === 'men' ? 'font-bold text-blue-600' : ''
              }`}
              state={{ fromGenderCollection: true }}
              onClick={() => setActiveGender('men')}
            >
              Shop Now
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default GenderCollectionSection;