const express = require("express");
const router = express.Router();
const db = require("../database");
const { ObjectId } = require("mongodb");

router.get('/properties/:listingId/feedbacks', async (req, res) => {
  const { listingId } = req.params;
  const feedbackCollection = db.collection("feedback");
  const userCollection = db.collection("users");

  try {
    const feedbacks = await feedbackCollection
      .find({ listingId: listingId })
      .toArray();

    const feedbacksWithUserDetails = await Promise.all(
      feedbacks.map(async (feedback) => {
        const user = await userCollection.findOne(
          { _id: new ObjectId(feedback.userId) },
          { projection: { firstName: 1, lastName: 1, profileImage: 1 } }
        );
        return {
          ...feedback,
          user,
        };
      })
    );

    res.json(feedbacksWithUserDetails);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).send({ message: "Error fetching feedbacks" });
  }
});

router.post("/:listingId/feedback", async (req, res) => {
  const { listingId } = req.params;
  const { userId, comment, rating } = req.body;

  if (!userId || !comment || !rating) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const listingCollection = db.collection("listing");
    const listing = await listingCollection.findOne({ _id: new ObjectId(listingId) });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.hostId.toString() === userId.toString()) {
      return res.status(400).json({ message: "You cannot add feedback to your own listing" });
    }

    const feedbackCollection = db.collection("feedback");

    const newFeedback = {
      listingId: listingId,
      userId: userId,
      comment,
      rating,
      createdAt: new Date(),
    };

    await feedbackCollection.insertOne(newFeedback);

    return res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return res.status(500).json({ message: "Failed to submit feedback" });
  }
});

module.exports = router;
