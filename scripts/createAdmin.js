
const mongoose = require("mongoose");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/growwe");

    const email = "admin@growwe";
    const userName = "growwe-admin";
    const password = "Gw!Admin#2026_X9pL@72";

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isAdmin) {
        console.log("Admin account already exists.");
      } else {
        console.log(
          "This email belongs to a normal user. No changes made."
        );
      }

      return;
    }

    // Check username
    const existingUsername = await User.findOne({ userName });

    if (existingUsername) {
      console.log("Username already exists.");
      return;
    }

    const admin = new User({
      userName,
      email,
      password,

      phone: "0000000000",
      address: "Growwe Administration",
      country: "Egypt",
      city: "Cairo",
      area: "Administration",

      isAdmin: true,
    });

    // User.js automatically hashes the password
    await admin.save();

    console.log("--------------------------------");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("--------------------------------");
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
