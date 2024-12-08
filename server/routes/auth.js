const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const db = require("../database");
const ObjectId = require("mongodb").ObjectId;

const router = express.Router();

const imageStorage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: imageStorage,
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|png|jpeg|gif)$/)) {
      return cb(new Error("Only jpg, png, jpeg, and gif files are allowed"));
    }
    cb(null, true);
  },
});

router.post("/registerSubmit", upload.single("profileImage"), async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role = "user" } = req.body;

    const userCollection = db.collection("users");

    const existingUser = await userCollection.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const profileImage = req.file;
    if (!profileImage) {
      return res.status(400).send("No profile image uploaded");
    }

    const salt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(password, salt);

    const userData = {
      firstName,
      lastName,
      email,
      password: encryptedPassword,
      role: role.toLowerCase() === "admin" ? "admin" : "user", 
      profileImage: profileImage.path,
      tripList: [],
      wishList: [],
      propertyList: [],
      reservationList: [],
      status: "active", 
    };

    const result = await userCollection.insertOne(userData);
    if (result.acknowledged) {
      res.status(201).json({ message: "User registered successfully" });
    } else {
      res.status(500).json({ message: "Failed to register user" });
    }
  } catch (err) {
    console.error("Error during registration", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userCollection = db.collection("users");

    const user = await userCollection.findOne({ email });
    if (!user) return res.status(409).json({ message: "User does not exist" });

    if (user.status === "blocked") {
      return res.status(403).json({ message: "Your account is blocked. Contact support for assistance." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(409).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET
    );
    delete user.password;

    res.status(200).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
