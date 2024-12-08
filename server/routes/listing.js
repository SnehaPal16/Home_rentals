const express = require("express");
let db = require('../database.js');
const multer = require("multer");
const ObjectId = require('mongodb').ObjectId;

const router = express.Router();

const imageStorage = multer.diskStorage({
    destination: "public/uploads",
    filename : (req , file , cb) => {
        cb(null , Date.now() + "-" + file.originalname)
    }
});

const uploads = multer({
    storage : imageStorage,
    fileFilter(req , file , cb) {
        if(!file.originalname.match(/\.(jpg|png|jpeg|gif|pdf)$/)){
            return cb(new Error("Only jpg , png , gif , and pdf files are allowed!"));
        }
        cb(undefined , true);
    }
});

router.post("/create" , uploads.array("listingPhotos") , async(req , res) => {

    try{
        const {
            creator,
            category,
            type,
            streetAddress,
            aptSuite,
            city,
            province,
            country,
            guestCount,
            bedroomCount,
            bedCount,
            bathroomCount,
            amenities,
            title,
            description,
            highlight,
            highlightDesc,
            price
        } = req.body;

        const userCollection = db.collection("users");
        const objectId = new ObjectId(creator); 
        const listingCollection = db.collection("listing");
        const host = await userCollection.findOne({_id : objectId});


        const listingPhotos = req.files;
        if(!listingPhotos){
            return res.status(400).send("No File Uploaded");
        }

        const listingPhotoPath = listingPhotos.map((file) =>file.path);

        const listingData = {
            creator : new ObjectId(creator),
            hostFirstName : host.firstName,
            hostLasttName : host.lastName,
            hostProfileImagePath : host.profileImage,
            category : category,
            type : type,
            streetAddress : streetAddress,
            aptSuite : aptSuite,
            city : city,
            province : province,
            country : country,
            guestCount : guestCount,
            bedroomCount : bedroomCount,
            bedCount : bedCount,
            bathroomCount : bathroomCount,
            amenities : amenities,
            listingPhotoPath : listingPhotoPath,
            title : title,
            description : description,
            highlight : highlight,
            highlightDesc : highlightDesc,
            price : price 
        }

        const result = await listingCollection.insertOne(listingData);
        if(result.acknowledged){
            res.status(201).json({message : "Listing Created Successfully"});
        }
        else{
            res.status(500).json({message : "Failed To Create Listing"});
        }
    }
    catch(err){
        console.error(err);
        res.status(409).json({message : "Failed To Create Listing" , error : err.message});
    }
});

// GET LISTING BY CATEGORY
router.get("/" , async(req , res) => {
    const qCategory = req.query.category;
    try{
        const listingCollection = db.collection("listing");
        let listings;
        if(qCategory){
            listings = await listingCollection.find({category : qCategory}).toArray();
        }
        else{
            listings = await listingCollection.find().toArray();
        }

        res.status(200).json(listings)
    }
    catch(err){
        console.error(err);
        res.status(404).json({message : "Failed to fetch listing" , error : err.message});
    }
})
module.exports = router;


// GET LISTING BY SEARCH
router.get("/search/:search", async (req, res) => {
  const { search } = req.params;

  try {
    const listingCollection = db.collection("listing");
    let listings = [];

    if (search === "all") {
      listings = await listingCollection.find().toArray();
    } else {
      listings = await listingCollection
        .find({
          $or: [
            { category: { $regex: search, $options: "i" } },
            { title: { $regex: search, $options: "i" } },
          ],
        })
        .toArray();
    }

    if (listings.length === 0) {
      return res.status(404).json({ message: "No listings found" });
    }

    res.status(200).json(listings);
  } catch (err) {
    console.error("Error fetching listings:", err);
    res.status(500).json({ message: "Failed to fetch listings", error: err.message });
  }
});

// LISTING DETAILS

router.get("/:listingId" , async (req , res) => {
    try{
        const listingCollection = db.collection("listing");
        const {listingId} = req.params;
        const objectId = new ObjectId(listingId);
        const result = await listingCollection.findOne({_id : objectId});

        res.status(200).json(result);
    }
    catch(error){
        res.status(404).json({message : "Listing can not found!" , error:error});
    }
})