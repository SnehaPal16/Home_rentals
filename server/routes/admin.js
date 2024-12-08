const express = require("express");
const router = express.Router();
const db = require("../database");
const ObjectId = require("mongodb").ObjectId;

// Get all user activities
router.get("/user-activities", async (req, res) => {
  try {
    const users = await db.collection("users").find().toArray();
    console.log(users);
    const activities = await Promise.all(users.map(async (user) => {
      const propertiesCount = await db.collection("listing").countDocuments({ creator: new ObjectId(user._id) });
      const bookingsCount = await db.collection("booking").countDocuments({ hostId: user._id });

      return {
        userId: user._id,
        email: user.email,
        propertiesCount,
        bookingsCount,
        status: user.status,
      };
    }));

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching user activities:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Block or unblock a user
router.put("/user/:id/block", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await db.collection("users").findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newStatus = user.status === "blocked" ? "active" : "blocked";
    await db.collection("users").updateOne({ _id: userId }, { $set: { status: newStatus } });

    res.status(200).json({ message: `User ${newStatus === "blocked" ? "blocked" : "unblocked"} successfully` });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
