const express = require("express")
const User = require("../models/User")
const { protect, admin } = require("../middleware/authMiddleware")

const router = express.Router()

// route GET /api/admin/users
//desc Get all users(Admin only)
//access Private/Admin

router.get("/",protect,admin,async(req,res)=>{
    try {
        const users = await User.find({})
        res.json(users) 
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Server Error"})
    }
})


// //@route POST /api/admin/users
// //@desc Add new user (Admin only)
// //@acces Private/Admin

router.post("/",protect,admin,async (req,res)=>{
    const {name,email,password,role} = req.body;
    try {
      let user = await User.findOne({email})
      if(user){
        return res.status(400).json({message:"User already exits"})
      }  
        
      user = new User({
        name,
        email,
        password,
        role:role || "customer",
      });

      await user.save()
      res.status(200).json({message:"User created successfully"})
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Server Error"})
    }
})

//@route PUT api/admin/users/:id
//@desc Update user Info (admin only)-Name, email and role
//@access Private Admin only

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    const updatedUser = await user.save();
    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

//@route DELETE api/admin/users/:id
//@desc DELETE a user
//@access Private/Admin

//@route DELETE api/admin/users/:id
//@desc Delete a user
//@access Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    console.log("DELETE USER REQUEST RECEIVED:");
    console.log("User ID:", req.params.id);
    console.log("Authenticated User:", req.user ? req.user._id : "No user");
    
    const user = await User.findById(req.params.id);
    
    if (user) {
      console.log("User found:", user._id, user.email);
      
      // Prevent admin from deleting themselves
      if (user._id.toString() === req.user._id.toString()) {
        console.log("Attempt to delete own account blocked");
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await user.deleteOne();
      console.log("User successfully deleted");
      res.json({ message: "User removed", userId: user._id });
    } else {
      console.log("User not found with ID:", req.params.id);
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});


module.exports = router;