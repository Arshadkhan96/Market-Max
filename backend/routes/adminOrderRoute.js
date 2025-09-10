// // const express = require("express")
// // const Order = require("../models/Order")
// // const {protect,admin} = require("../middleware/authMiddleware")

// // const router = express.Router()

// // //@route GET api/admin/only
// // //@desc Get all order(Admin only)
// // //@access Private/Admin

// // router.get("/",protect,admin,async(req,res)=>{
// //     try {
// //         const orders = await Order.find({}).populate("user","name email")
// //         res.json(orders)
// //     } catch (error) {
// //         console.error(error)
// //         res.status(500).json({message:"Server Error"})
// //     }
// // })

// // //@route PUT api/admin/orders/
// // //@desc Update order status
// // //@access Private/Admin

// // router.put("/:id", protect, admin, async (req, res) => {
// //   try {
// //     const order = await Order.findById(req.params.id).populate("user","name");

// //     if (!order) {
// //       return res.status(404).json({ message: "Order not found" });
// //     }

// //     order.status = req.body.status || order.status;
// //     if (req.body.status === "Delivered") {
// //       order.isDelivered = true;
// //       order.deliveredAt = Date.now();
// //     }

// //     const updatedOrder = await order.save({ validateBeforeSave: false });
// //     res.json(updatedOrder);
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ message: "Server Error" });
// //   }
// // });

// // //@route DELETE api/admin/orders/:id
// // //@route Delete an order
// // //@access Private/Admin

// // router.delete("/:id",protect,admin,async(req,res)=>{
// //     try {
// //         const order = await Order.findById(req.params.id)
// //         if(order){
// //             await order.deleteOne()
// //             res.json({message:"Order removed"})
// //         }else{
// //             res.status(404).json({message:"Order not found"})
// //         }
// //     } catch (error) {
// //         console.error(error)
// //         res.status(500).json({message:"Server Error"})
// //     }
// // })


// // module.exports = router;



// const express = require("express");
// const User = require("../models/User");
// const { protect, admin } = require("../middleware/authMiddleware");

// const router = express.Router();

// //@route GET api/admin/users
// //@desc Get all users (Admin only)
// //@access Private/Admin
// router.get("/", protect, admin, async (req, res) => {
//   try {
//     const users = await User.find({}).select("-password"); // Exclude passwords
//     res.json(users);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

// //@route POST api/admin/users
// //@desc Create a new user (Admin only)
// //@access Private/Admin
// router.post("/", protect, admin, async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     // Check if user already exists
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // Create new user
//     const user = await User.create({
//       name,
//       email,
//       password,
//       role: role || "customer",
//     });

//     if (user) {
//       res.status(201).json({
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       });
//     } else {
//       res.status(400).json({ message: "Invalid user data" });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

// //@route PUT api/admin/users/:id
// //@desc Update user role
// //@access Private/Admin
// router.put("/:id", protect, admin, async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     user.role = req.body.role || user.role;
//     if (req.body.name) user.name = req.body.name;
//     if (req.body.email) user.email = req.body.email;

//     const updatedUser = await user.save();
//     res.json({
//       _id: updatedUser._id,
//       name: updatedUser.name,
//       email: updatedUser.email,
//       role: updatedUser.role,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

// //@route DELETE api/admin/users/:id
// //@desc Delete a user
// //@access Private/Admin
// router.delete("/:id", protect, admin, async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
    
//     if (user) {
//       // Prevent admin from deleting themselves
//       if (user._id.toString() === req.user._id.toString()) {
//         return res.status(400).json({ message: "Cannot delete your own account" });
//       }
      
//       await user.deleteOne();
//       res.json({ message: "User removed", userId: user._id });
//     } else {
//       res.status(404).json({ message: "User not found" });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

// module.exports = router;
//////////////////////////////////////////////////
const express = require("express");
const Order = require("../models/Order");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

//@route GET /api/admin/orders
//@desc Get all orders (Admin only)
//@access Private/Admin
router.get("/", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "name email");
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

//@route PUT /api/admin/orders/:id
//@desc Update order status
//@access Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = req.body.status || order.status;
    if (req.body.status === "Delivered") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save({ validateBeforeSave: false });
    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

//@route DELETE /api/admin/orders/:id
//@desc Delete an order
//@access Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.deleteOne();
      res.json({ message: "Order removed" });
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;