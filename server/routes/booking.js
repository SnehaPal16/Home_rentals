const express = require("express");
const router = express.Router();
let db = require('../database.js');
const ObjectId = require("mongodb").ObjectId;

router.post("/create", async (req, res) => {
    try {
        const { customerId, hostId, listingId, startDate, endDate, totalPrice } = req.body;

        if (customerId === hostId) {
            return res.status(400).json({ message: "You cannot book your own listing." });
        }

        const newBooking = {
            customerId: customerId,
            hostId: hostId,
            listingId: listingId,
            startDate: startDate,
            endDate: endDate,
            totalPrice: totalPrice
        };

        const bookingCollection = db.collection("booking");
        const usersCollection = db.collection("users");

        const result = await bookingCollection.insertOne(newBooking);

        await usersCollection.updateOne(
            { _id: new ObjectId(hostId) },
            { $push: { reservationList: newBooking } }
        );

        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: "Internal Server Error", error: err.message });
    }
});


module.exports = router;
