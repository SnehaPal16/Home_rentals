const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const db = require("./database");

const authRoutes = require("./routes/auth.js");
const listingRoutes = require("./routes/listing.js");
const bookingRoutes = require("./routes/booking.js");
const userRoutes = require("./routes/user.js");
const feedbackRoutes = require("./routes/feedback.js");
const adminRoutes = require("./routes/admin.js"); // New admin routes

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Middleware to check for admin access
const isAdmin = async (req, res, next) => {
  const userId = req.header("userId");
  const user = await db.collection("users").findOne({ _id: userId });

  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  next();
};

// Routes
app.use("/auth", authRoutes);
app.use("/properties", listingRoutes);
app.use("/booking", bookingRoutes);
app.use("/user", userRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/admin", isAdmin, adminRoutes); // Secure admin routes

app.get("/", (req, res) => {
  res.status(200).send({ msg: "WELCOME TO REST-API SERVER" });
});

app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
