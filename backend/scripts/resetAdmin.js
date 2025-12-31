import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../src/config/mongodb.config.js";
import User from "../src/models/user.model.js";
import UserProfile from "../src/models/userProfile.model.js";

const run = async () => {
  try {
    await connectDB();

    const email = "admin@admin.com";
    const password = "Admin123";

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        fullName: "Admin User",
        email,
        password,
        role: "admin",
        isVerified: true,
        isBanned: false,
        profileCompleted: true,
        profileApprovalStatus: "approved",
        avatar:
          "https://res.cloudinary.com/demo/image/upload/v1/avatars/admin.jpg",
      });
    } else {
      user.fullName = user.fullName || "Admin User";
      user.role = "admin";
      user.isVerified = true;
      user.isBanned = false;
      user.profileCompleted = true;
      user.profileApprovalStatus = "approved";
      user.avatar =
        user.avatar ||
        "https://res.cloudinary.com/demo/image/upload/v1/avatars/admin.jpg";
      user.password = password; // will be hashed by pre-save hook
    }

    await user.save();

    // Ensure a profile exists
    const existingProfile = await UserProfile.findOne({ userId: user._id });
    if (!existingProfile) {
      await UserProfile.create({ userId: user._id });
    }

    console.log("✅ Admin user is set. Email:", email, "Password:", password);
    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ Failed to set admin user:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

run();
