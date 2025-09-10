import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const SortOption = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortValue, setSortValue] = useState(searchParams.get("sortBy") || "")

  const handleSortChange = (e) => {
    const sortBy = e.target.value
    setSortValue(sortBy)
    
    if (sortBy) {
      searchParams.set("sortBy", sortBy)
    } else {
      searchParams.delete("sortBy")
    }
    setSearchParams(searchParams)
  }

  return (
    <div className='mb-4 flex items-center justify-end'>
      <select 
        id='sort' 
        value={sortValue}
        onChange={handleSortChange}
        className='border p-2 rounded-md focus:outline-none'
      >
        <option value="">Default</option>
        <option value="priceAsc">Price: Low to high</option>
        <option value="priceDesc">Price: High to low</option>
        <option value="popularity">Popularity</option>
      </select>
    </div>
  )
}

export default SortOption