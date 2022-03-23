const express = require('express');
const { loadFont } = require('figlet');
const app = express();
const port = process.env.PORT || 8000;
const logger = require('./logger');
var businesses = require('./businesses');
var reviews = require('./reviews');
var photos = require('./photos');


app.use(express.json());
app.use(logger)
app.listen(port, () => {
    console.log("== server is listening on port", port);
})


//get info about all businesses
app.get('/businesses', (req, res, next) => {
    res.status(200).send(businesses);



});


//get detailed information about one business
app.get('/businesses/:id', (req, res, next) => {
    console.log("== req.params:", req.params);
    const id = req.params.id;
    const result = reviews.filter((reviews) => reviews.BusinessID == req.params.id)
    const result2 = photos.filter((photos) => photos.BusinessID == req.params.id)
    if(businesses[id]){
        res.status(200).send({BusinessInfo:businesses[id], Reviews:result, Photos: result2});
    }
    else{
        next();
    }
});


//get all businesses owned by a user
app.get('/user/:id/businesses', (req, res, next) => {
    console.log("== req.params:", req.params);
    const UserID = req.params.id; //this is the person making the request
    const ownedBusinesses = businesses.filter((businesses) => businesses.OwnerID == UserID) //check if the requester is the owner
    if(ownedBusinesses){
        res.status(200).send(ownedBusinesses);
    }
    else{
        next();
    }
});

//get all photos posted by a user
app.get('/user/:id/photos', (req, res, next) => {
    console.log("== req.params:", req.params);
    const UserID = req.params.id; //this is the person making the request
    const ownedPhotos = photos.filter((photos) => photos.UserID == UserID) //check if the requester is the owner
    if(ownedPhotos){
        res.status(200).send(ownedPhotos);
    }
    else{
        next();
    }
});

//get all reviews made by a user 
app.get('/user/:id/reviews', (req, res, next) => {
    console.log("== req.params:", req.params);
    const UserID = req.params.id; //this is the person making the request
    const ownedReviews = reviews.filter((reviews) => reviews.UserID == UserID) //get list of only reviews about this business
    if(ownedReviews){
        res.status(200).send(ownedReviews);
    }
    else{
        next();
    }
});


//post a business listing
app.post('/businesses', (req, res, next) => {
    console.log("== req.body:", req.body);
    if(req.body && req.body.UserID && req.body.Name && req.body.StreetAddress && req.body.City && req.body.State 
        && req.body.ZIPCode && req.body.Phone && req.body.Category && req.body.Subcategory){
        businesses.push({
            OwnerID: req.body.UserID,
            Name: req.body.Name,
            StreetAddress: req.body.StreetAddress,
            City: req.body.City,
            State: req.body.State,
            ZIPCode: req.body.ZIPCode,
            Phone: req.body.Phone,
            Category: req.body.Category,
            Subcategory: req.body.Subcategory,
            Website: req.body.Website,
            Email: req.body.Email
        });
        const id = businesses.length - 1;
        res.status(201).send({
            BusinessID: id
        });
    }
    else {
        res.status(400).send({
            err: "Invalid Request: missing field. Fields needed are: name, street addr, city, state, zip, phone, category, subcategory."
        });
    }
})

//post a review of a business
app.post('/businesses/:id/review', (req, res, next) => {
    console.log("== req.body:", req.body);
    const businessReviews = reviews.filter((reviews) => reviews.BusinessID == req.params.id) //get list of reviews of this business
    const alreadyReviewed = businessReviews.filter((businessReviews) => businessReviews.UserID == req.body.UserID)
    console.log(businessReviews)
    if(alreadyReviewed.length == 0 && businesses[req.params.id]){
        if(req.body && req.body.UserID && req.body.Stars && req.body.DollarSigns){
            reviews.push({
                UserID: req.body.UserID,
                BusinessID: req.params.id,
                Stars: req.body.Stars,
                DollarSigns: req.body.DollarSigns,
                MoreInformation: req.body.MoreInformation
            });
            res.status(201).send({Response: "Review posted."
            });
        }

        else {
            res.status(400).send({
                err: "Invalid Request: missing field. Fields needed are: UserID, Stars, Dollar Signs."
            });
        }
    }

    else{
        res.status(403).send({
            err: "You have already posted a review for this business or it does not exist. You cannot post another."
        })
    }
})

//post a photo on a business page
app.post('/businesses/:id/postphoto', (req, res, next) => {
    console.log("== req.body:", req.body);
    if(req.body && req.body.UserID && req.body.PhotoURL){
        photos.push({
            UserID: req.body.UserID,
            BusinessID: req.params.id,
            PhotoURL: req.body.PhotoURL,
            PhotoCaption: req.body.PhotoCaption
        });
        const id = photos.length - 1;
        res.status(201).send({
            PhotoID: id
        });
    }
    else {
        res.status(400).send({
            err: "Invalid Request: missing field. Fields needed are: Photo URL, Photo caption."
        });
    }
})


app.patch('/businesses/:id', (req, res, next) => {
console.log("== req.body:", req.body);
id = req.params.id

//verify the patch request is from the owner of the listing
if(req.body.UserID == businesses[id].OwnerID){
//i couldn't think of a better way to do this. very redundant
    if(req.body.Name != null){
        businesses[id].Name = req.body.Name
    }
    if(req.body.StreetAddress != null){
        businesses[id].StreetAddress = req.body.StreetAddress
    }
    if(req.body.City != null){
        businesses[id].City = req.body.City
    }
    if(req.body.State != null){
        businesses[id].State = req.body.State
    }
    if(req.body.ZIPCode != null){
        businesses[id].ZIPCode = req.body.ZIPCode
    }
    if(req.body.Phone != null){
        businesses[id].Phone = req.body.Phone
    }
    if(req.body.Category != null){
        businesses[id].Category = req.body.Category
    }
    if(req.body.Subcategory != null){
        businesses[id].Subcategory = req.body.Subcategory
    }
    if(req.body.Website != null){
        businesses[id].Website = req.body.Website
    }
    if(req.body.Email != null){
        businesses[id].Email = req.body.Email
    }
res.status(200).send({})
}
else{
    res.status(403).send({err: "You don't own this business. Why would you think you could do that?"})
}
})


app.patch('/reviews/:id', (req, res, next) => {
    console.log("== req.body:", req.body);
    id = req.params.id
    
    //verify the patch request is from the owner of the review
    if(req.body.UserID == reviews[id].UserID){
    //i couldn't think of a better way to do this. very redundant
        if(req.body.Stars != null){
            reviews[id].Stars = req.body.Stars
        }
        if(req.body.DollarSigns != null){
            reviews[id].DollarSigns = req.body.DollarSigns
        }
        if(req.body.MoreInformation != null){
            reviews[id].MoreInformation = req.body.MoreInformation
        }
    res.status(200).send({})
    }
    else{
        res.status(403).send({err: "You don't own this review. Why would you think you could do that?"})
    }
})


app.patch('/photos/:id', (req, res, next) => {
    console.log("== req.body:", req.body);
    id = req.params.id
    
    //verify the patch request is from the owner of the photo
    if(req.body.UserID == photos[id].UserID){
    //i couldn't think of a better way to do this. very redundant
        if(req.body.PhotoCaption != null){
            photos[id].PhotoCaption = req.body.PhotoCaption
        }
    res.status(200).send({})
    }
    else{
        res.status(403).send({err: "You don't own this photo. Why would you think you could do that?"})
    }
})



// delete a business entry. verifies that the user is the owner before deletion
app.delete('/businesses/:id', (req, res, next) => {
    console.log("== req.body:", req.body);
    id = req.params.id
    intID = parseInt(id)
    if(req.body.UserID == businesses[intID].OwnerID){
         businesses.splice(intID, 1);
        res.status(200).send({Response: "Business deleted."})

    }
    else{
        res.status(403).send({
            err:"You cannot delete this listing. It's owned by another user. Your ID is " + req.body.UserID + "."
        })
    }
})


// delete a photo. verifies that the user is the owner before deletion
app.delete('/photos/:photo_id', (req, res, next) => {
    console.log("== req.body:", req.body);
    photo_id = req.params.photo_id
    intID = parseInt(photo_id)

    if(req.body.UserID == photos[photo_id].UserID){
            photos.splice(photo_id, 1)
            res.status(200).send({Response: "Photo deleted."})
    }

    else{
        res.status(403).send({
            err:"You cannot delete this photo. It's owned by another user. Your ID is " + req.body.UserID + "."
        })
    }
})


// delete a review. verifies that the user is the owner before deletion
app.delete('/reviews/:review_id', (req, res, next) => {
    console.log("== req.body:", req.body);
    review_id = req.params.review_id
    intID = parseInt(review_id)

    if(req.body.UserID == reviews[review_id].UserID){
            reviews.splice(review_id, 1)
            res.status(200).send({Response: "Review deleted."})
    }

    else{
        res.status(403).send({
            err:"You cannot delete this review. It's owned by another user. Your ID is " + req.body.UserID + "."
        })
    }
})



app.use('*', (req, res, next) => {

    res.status(404).send({
        err: "The requested resource does not exist: " + req.originalUrl
    });

});



