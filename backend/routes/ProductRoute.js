const express = require("express");
const Product = require("../models/Product"); // Capitalized model name
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   POST /api/products
// @desc    Create a new Product
// @access  Private/Admin
router.post("/", protect, admin, async (req, res) => {
  try {
    // First check if body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Product data is required" });
    }

    const {
      name,
      description,
      price,
      discountprice,
      sizes,
      countInstock, 
      category,
      brand,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !countInstock || !category || !sizes || !colors || !collections || !sku) {
      return res.status(400).json({ 
        message: "Missing required fields: name, description, price, countInstock, category, sizes, colors, collections, or sku" 
      });
    }

    const newProduct = new Product({ // Changed variable name to avoid conflict
      name,
      description,
      price,
      discountprice: discountprice || null,
      sizes,
      countInstock,
      category,
      brand: brand || "",
      colors,
      collections,
      material: material || "",
      gender: gender || "Unisex",
      images: images || [],
      isFeatured: isFeatured || false,
      isPublished: isPublished !== undefined ? isPublished : true,
      tags: tags || [],
      dimensions: dimensions || {},
      weight: weight || null,
      sku,
      user: req.user._id
    });

    const createdProduct = await newProduct.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "SKU must be unique" });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin

router.put("/:id", protect, admin, async (req, res) => {
  try {
    // 1. Validate the request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Product update data is required" });
    }

    // 2. Extract fields from request body
    const {
      name,
      description,
      price,
      discountprice,
      sizes,
      countInstock,
      category,
      brand,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku
    } = req.body;

    // 3. Find the product to update
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 4. Update product fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.discountprice = discountprice !== undefined ? discountprice : product.discountprice;
    product.sizes = sizes || product.sizes;
    product.countInstock = countInstock || product.countInstock;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.colors = colors || product.colors;
    product.collections = collections || product.collections;
    product.material = material || product.material;
    product.gender = gender || product.gender;
    product.images = images || product.images;
    product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
    product.isPublished = isPublished !== undefined ? isPublished : product.isPublished;
    product.tags = tags || product.tags;
    product.dimensions = dimensions || product.dimensions;
    product.weight = weight || product.weight;
    product.sku = sku || product.sku;

    // 5. Save the updated product
    const updatedProduct = await product.save();
    
    // 6. Send response
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid product ID format" });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: "SKU must be unique" });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

//@ DELETE api/products:id
//@ desc Delete a product by ID
//@ access Private/Admin

router.delete("/:id",protect,admin, async (req,res,)=>{
    try {
        //Find the product by ID

        const product = Product.findById(req.params.id)

        if(product){
            //Remove the product from DB
            await product.deleteOne()
            res.json({message:"Product Removed "})
        }else{
            res.status(404).json({message:"Product not found"})
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error")
    }
})





router.get("/", async (req, res) => {
    try {
        const {
            collection,
            size,
            color,
            gender,
            minPrice,
            maxPrice,
            sortBy,
            search,
            category,
            material,
            brand,
            limit = 10, // default limit
            page = 1    // default page
        } = req.query;

        // Build the query object
        let query = {};

        // Collection filter
        if (collection && collection.toLowerCase() !== "all") {
            query.collections = { $regex: new RegExp(collection, 'i') };
        }

        // Size filter
        if (size) {
            query.sizes = { $in: Array.isArray(size) ? size : size.split(',') };
        }

        // Color filter
        if (color) {
            query.colors = { $regex: new RegExp(color, 'i') };
        }

        // Gender filter - case-insensitive matching with enum values
        if (gender) {
            console.log('Original gender from query:', gender);
            
            // Use regex for case-insensitive matching with the enum values
            query.gender = { 
                $regex: new RegExp(`^${gender}$`, 'i')
            };
            
            console.log('Using gender filter:', query.gender);
        }

        // PRICE RANGE FILTER - CORRECTED IMPLEMENTATION
        if (minPrice || maxPrice) {
            query.price = {};
            
            // Convert and validate minPrice
            if (minPrice) {
                const min = Number(minPrice);
                if (!isNaN(min)) {
                    query.price.$gte = min;
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'minPrice must be a valid number'
                    });
                }
            }
            
            // Convert and validate maxPrice
            if (maxPrice) {
                const max = Number(maxPrice);
                if (!isNaN(max)) {
                    query.price.$lte = max;
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'maxPrice must be a valid number'
                    });
                }
            }
            
            // Validate that minPrice isn't greater than maxPrice
            if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
                return res.status(400).json({
                    success: false,
                    message: 'minPrice cannot be greater than maxPrice'
                });
            }
        }

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: new RegExp(search, 'i') } },
                { description: { $regex: new RegExp(search, 'i') } },
                { brand: { $regex: new RegExp(search, 'i') } }
            ];
        }

        // Category filter
        if (category) {
            query.category = { $regex: new RegExp(category, 'i') };
        }

        // Material filter
        if (material) {
            query.material = { $regex: new RegExp(material, 'i') };
        }

        // Brand filter
        if (brand) {
            query.brand = { $regex: new RegExp(brand, 'i') };
        }

        // SORTING - CORRECTED IMPLEMENTATION
        let sort = { createdAt: -1 }; // Default sort
        if (sortBy) {
            const sortOptions = {
                'price-asc': { price: 1, createdAt: -1 },  // Low to high, then newest
                'price-desc': { price: -1, createdAt: -1 }, // High to low, then newest
                'newest': { createdAt: -1 },
                'oldest': { createdAt: 1 },
                'popular': { rating: -1, createdAt: -1 }
            };
            
            // Use specified sort or keep default
            sort = sortOptions[sortBy.toLowerCase()] || sort;
        }

        // Calculate skip for pagination
        const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
        const validatedLimit = Math.max(1, Number(limit));

        // Log the query being executed
        console.log('Executing query:', JSON.stringify(query, null, 2));
        
        // Execute query with pagination
        const products = await Product.find(query)
            .sort(sort)
            .skip(skip)
            .limit(validatedLimit)
            .lean();
            
        // Log the number of products found
        console.log(`Found ${products.length} products`);
        if (products.length > 0) {
            console.log('Sample product genders:', products.map(p => p.gender).slice(0, 5));
        }

        // Count total products for pagination info
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / validatedLimit);

        // Add min/max price info for the filtered results
        const priceStats = await Product.aggregate([
            { $match: query },
            { 
                $group: {
                    _id: null,
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" }
                }
            }
        ]);

        res.json({
            success: true,
            count: products.length,
            totalProducts,
            totalPages,
            currentPage: Number(page),
            priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0 },
            products
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching products',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Debug endpoint to check gender values in the database
router.get('/debug/genders', async (req, res) => {
    try {
        const genderCounts = await Product.aggregate([
            { $group: { _id: '$gender', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        // Get sample products for each gender
        const samples = await Promise.all(
            genderCounts.map(async ({ _id }) => ({
                gender: _id,
                sample: await Product.findOne({ gender: _id }, 'name gender').lean()
            }))
        );
        
        res.json({
            success: true,
            genderCounts,
            samples
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug error',
            error: error.message
        });
    }
});

//@ route GET /api/products/best-seller
//@ desc Retrieve the product with-highest rating
// @ access Public

router.get("/best-seller", async(req,res)=>{
try {
    const bestSeller = await Product.findOne().sort({rating: -1});
    if(bestSeller){
        res.json(bestSeller)
    }else{
        res.status(404).json("No best Seller found")
    }
} catch (error) {
    console.error(error)
    res.status(500).send("Server Error")
}
});

//@route GET /api/products/new-arrivals
// @desc Retrieve latest 8 products - Creation date
// @ access Public

router.get("/new-arrivals", async(req,res)=>{
    try {
        // Fetch latest 8 products
        const newArrivals = await Product.find().sort({createdAt: -1}).limit(8)
        res.json(newArrivals)
    } catch (error) {
        console.error(error)
        res.status(500).send("Server Error")
    }
})

//@ Get api/products/:ID
//@ desc Get a single product by ID
//@ access Public

router.get("/:id", async(req,res)=>{
    try {
        const product = await Product.findById(req.params.id);
        if(product){
            res.json(product)
        }else{
            res.status(404).json({message:"Product Not Found"})
        }
    } catch (error) {
        console.error(error)
        res.status(500).send("Server Error")
    }
})

//@ route GET api/products/similar/id
//@ desc Retrieve similar products based on the current product's gender and category
//@ access Public

// router.get("/similar/:id", async(req,res)=>{
//         const {id} = req.params;

//     try {
//         const product = await Product.findById(id)
        
//         if(!product){
//             res.status(404).json({message:"Product not found."})

//             const similarProducts = await Product.find({
//                 _id: {$ne: id},
//                 gender:product.gender,
//                 category: product.category
//             }).limit(4);
//             res.json(similarProducts)
//         }
//     } catch (error) {
//         console.error(error);
//          res.status(500).send("Server Error");
//     }
// })

router.get("/similar/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Find similar products (same category and gender, different ID)
    const similarProducts = await Product.find({
      _id: { $ne: id },
      gender: product.gender,
      category: product.category,
    }).limit(4);

    res.json(similarProducts);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});












module.exports = router;