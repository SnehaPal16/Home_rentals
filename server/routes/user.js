const express = require("express");
const router = express.Router();
let db = require("../database.js");
const ObjectId = require("mongodb").ObjectId;

// ADDING TO TRIPLIST------------>
router.get("/:userId/trips", async (req, res) => {
  try {
    const { userId } = req.params;

    const bookingCollection = db.collection("booking");
    const userCollection = db.collection("users");

    const trips = await bookingCollection
      .find({ customerId: userId })
      .toArray();

    if (trips.length > 0) {
      await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { tripList: trips } }
      );
      res.status(200).json(trips);
    } else res.status(400).json({ message: "No trips found for thios user" });
  } catch (err) {
    res.status(400).json({ message: "trip failed", error: err.message });
  }
});

// ADDING TO wishList----------->
router.post("/:userId/:listingId", async (req, res) => {
  try {
    const { userId, listingId } = req.params;
    const userCollection = db.collection("users");
    const listingCollection = db.collection("listing");

    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    const listing = await listingCollection.findOne({
      _id: new ObjectId(listingId),
    });

    console.log("user: ", user);
    console.log("listing: ", listing);

    if (!user || !listing) {
      return res.status(404).json({ message: "user or listing not found" });
    }

    const favouriteListing = user.wishList.find(
      (item) => item.toString() === new ObjectId(listingId).toString()
    );

    if (favouriteListing) {
      await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { wishList: new ObjectId(listingId) } }
      );

      const updateUser = await userCollection.findOne({
        _id: new ObjectId(userId),
      });
      res
        .status(200)
        .json({
          message: "Listing is removed from wishList",
          wishList: updateUser.wishList,
        });
    } else {
      await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $addToSet: { wishList: new ObjectId(listingId) } }
      );
      const updateUser = await userCollection.findOne({
        _id: new ObjectId(userId),
      });
      res
        .status(200)
        .json({
          message: "Listing is added from wishList",
          wishList: updateUser.wishList,
        });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// FETCHING TO PROPERTY------------>
router.get("/:userId/properties", async (req, res) => {
  try {
    const { userId } = req.params;
    const propertiesCollection = db.collection("listing");
    const usersCollection = db.collection("users");
    const properties = await propertiesCollection
      .find({ creator: new ObjectId(userId) })
      .toArray();

    if (properties.length > 0) {
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { propertyList: properties } }
      );
      res.status(200).json(properties);
    } else {
      res.status(404).json({ message: "No trips found for this user." });
    }
  } catch (err) {
    console.error("Error fetching properties:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


// FETCHING TO RESERvATION LIST------------>
router.get("/:userId/reservations", async (req, res) => {
  try {
    const { userId } = req.params;
    const bookingCollection = db.collection("booking");
    const reservations = await bookingCollection
      .find({ hostId: new ObjectId(userId) })
      .toArray();

    if (reservations.length > 0) {
      res.status(200).json(reservations);
    } else {
      res.status(404).json({ message: "No reservation found for this user." });
    }
  } catch (err) {
    console.error("Error fetching reservations:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
