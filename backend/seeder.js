const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product");
const User = require("./models/User");
const Cart = require("./models/Cart");

const products = require("./data/products");

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Function to seed data
const seedData = async () => {
  try {
    // Clear existing data
    await Product.deleteMany();
    await User.deleteMany();
    await Cart.deleteMany();


    // Create a default admin User
    const createdUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",  // Fixed email format (added @)
      password: "123456",
      role: "admin"
    });

    // Assign the default User ID to each product
    const userID = createdUser._id;
    
    const sampleProducts = products.map((product) => {
      return { ...product, user: userID };  // Changed userID to user to match schema
    });

    // Insert the products into the database
    await Product.insertMany(sampleProducts);

    console.log("Data seeded successfully");
    console.log(`${sampleProducts.length} products inserted`);
    console.log(`Admin user created with ID: ${userID}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

// Execute the seed function
seedData();