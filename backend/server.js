const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoute");
const productRoutes = require("./routes/ProductRoute");
const cartRoutes = require("./routes/cartRoute");
const checkoutRoutes = require("./routes/checkoutRoute");
const orderRoutes = require("./routes/OrderRoute");
const uploadRoutes = require("./routes/uploadRoute");
const subscribeRoutes = require("./routes/subscribeRoute");
const adminRoutes = require("./routes/adminRoute");
const productAdminRoutes = require("./routes/productAdminRoute");
const orderAdminRoutes = require("./routes/adminOrderRoute");

dotenv.config(); // ✅ Load .env variables

const app = express();

// ✅ Middleware (CORRECT ORDER)
app.use(cors());
app.use(express.json()); // Parses application/json

// Custom JSON parser that skips DELETE requests
app.use((req, res, next) => {
  if (req.method === 'DELETE') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// URL-encoded parser (only for non-DELETE requests)
app.use((req, res, next) => {
  if (req.method === 'DELETE') {
    next();
  } else {
    express.urlencoded({ extended: true })(req, res, next);
  }
});




// ✅ Connect MongoDB
connectDB();

// ✅ Serve static files in production
if (process.env.NODE_ENV === 'production') {
   app.get("/", (req, res) => {
        res.send("Hello World from Market Max API (Development Mode)");
    });
} else {
    app.get("/", (req, res) => {
        res.send("Hello World from Market Max API (Development Mode)");
    });
}


app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
// app.use("/api/carts", cartRoutes);
app.use("/api/cart", cartRoutes);

app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/subscribe", subscribeRoutes);

//Admin
app.use("/api/admin/users", adminRoutes);
app.use("/api/admin/products", productAdminRoutes);
app.use("/api/admin/orders", orderAdminRoutes);




// ✅ Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
