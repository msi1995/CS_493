const express = require('express');
const mysqlPool = require ('./lib/mysqlPool');
const logger = require('./lib/logger');
const { validateAgainstSchema } = require('./lib/validation');
const {
  BusinessSchema,
  photoSchema,
  reviewSchema,
  getBusiness,
  getBusinessesPage,
  getUserBusinesses,
  getUserReviews,
  getUserPhotos,
  insertNewBusiness,
  insertNewReview,
  insertNewPhoto,
  deleteBusiness,
  deletePhoto,
  deleteReview,
  getPhotos,
  getReviews,
  updateBusiness,
  updateReview,
  updatePhoto
} = require('./models/business');

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(logger);



///////////////////////////
//// POST OPERATIONS //////
///////////////////////////

//post a new business
app.post('/businesses', async (req, res, next) => {
  console.log("  -- req.body:", req.body);
  if (validateAgainstSchema(req.body, BusinessSchema)) {
    try {
      const id = await insertNewBusiness(req.body);
      res.status(201).send({
        id: id
      });
    } catch (err) {
      console.error("  -- error:", err);
      res.status(500).send({
        err: "Error inserting business into DB.  Try again later."
      });
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid Business."
    });
  }
});

//post a business review
app.post('/businesses/:id/review', async (req, res, next) => {
  console.log("  -- req.body:", req.body);
  if (validateAgainstSchema(req.body, reviewSchema)) {
    try {
      const id = await insertNewReview(req.body);
      res.status(201).send({
        id: id
      });
    } catch (err) {
      console.error("  -- error:", err);
      res.status(500).send({
        err: "Error posting review. Try again later."
      });
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid review."
    });
  }
});

//post a business photo
app.post('/businesses/:id/postphoto', async (req, res, next) => {
  console.log("  -- req.body:", req.body);
  if (validateAgainstSchema(req.body, photoSchema)) {
    try {
      const id = await insertNewPhoto(req.body);
      res.status(201).send({
        PID: id
      });
    } catch (err) {
      console.error("  -- error:", err);
      res.status(500).send({
        err: "Error posting photo. Try again later."
      });
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid photo."
    });
  }
});



///////////////////////////
//// GET OPERATIONS //////
///////////////////////////

//get all businesses
app.get('/businesses', async (req, res) => {
  try {
    const BusinessesPage = await getBusinessesPage(
      parseInt(req.query.page) || 1
    );
    res.status(200).send(BusinessesPage);
  } catch (err) {
    console.error("  -- error:", err);
    res.status(500).send({
      err: "Error fetching businesses page from DB.  Try again later."
    });
  }
});


//get detailed information about one business
app.get('/businesses/:id', async (req, res, next) => {
  console.log("== req.params:", req.params);
  try{
    const businesses = await getBusiness(parseInt(req.params.id))
    const photos = await getPhotos(parseInt(req.params.id))
    const reviews = await getReviews(parseInt(req.params.id))
    res.status(200).send({BusinessInfo:businesses, Reviews: reviews, Photos: photos});
    } catch (err){
      console.error(" -- error:", err);
      res.status(500).send({
        err: "Error fetching business details... try again later."
      })
    }
  })


  //get all businesses owned by a user
app.get('/user/:id/businesses', async (req, res, next) => {
  console.log("== req.params:", req.params);
  try{
    const userID = req.params.id; //this is the person making the request
    const ownedBusinesses = await getUserBusinesses(userID)
    res.status(200).send(ownedBusinesses);
    } catch (err){
      console.error(" -- error:", err);
      res.status(500).send({
      err: "Error fetching user's businesses."
    })
  }
})

  //get all reviews owned by a user
  app.get('/user/:id/reviews', async (req, res, next) => {
    console.log("== req.params:", req.params);
    try{
      const userID = req.params.id; //this is the person making the request
      const ownedReviews = await getUserReviews(userID)
      res.status(200).send(ownedReviews);
      } catch (err){
        console.error(" -- error:", err);
        res.status(500).send({
        err: "Error fetching user's reviews."
      })
    }
  })

  
    //get all photos owned by a user
app.get('/user/:id/photos', async (req, res, next) => {
  console.log("== req.params:", req.params);
  try{
    const userID = req.params.id; //this is the person making the request
    const ownedPhotos = await getUserPhotos(userID)
    res.status(200).send(ownedPhotos);
    } catch (err){
      console.error(" -- error:", err);
      res.status(500).send({
      err: "Error fetching user's photos."
    })
  }
})



app.put('/lodgings/:id', (req, res, next) => {
  const id = req.params.id;
  if (lodgings[id]) {
    if (validateAgainstSchema(req.body, LodgingSchema)) {
      lodgings[id] = req.body;
      res.status(204).send();
    } else {
      res.status(400).send({
        err: "Request body does not contain a valid Lodging."
      });
    }
  } else {
    next();
  }
});



///////////////////////////
/// PATCH/PUT OPERATIONS //
///////////////////////////

//patch a business
app.put('/businesses/:id', async (req, res, next) => {
if (validateAgainstSchema(req.body, BusinessSchema)) {
  try {
    const updateSuccessful = await
      updateBusiness(parseInt(req.params.id), req.body);
    if (updateSuccessful) {
      res.status(200).send({});
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to update business."
    });
  }
} else {
  res.status(400).send({
    err: "Request body does not contain a valid business."
  });
}
})

//patch a review by RID
app.put('/reviews/:id', async (req, res, next) => {
  if (validateAgainstSchema(req.body, reviewSchema)) {
    try {
      const updateSuccessful = await
        updateReview(parseInt(req.params.id), req.body);
      if (updateSuccessful) {
        res.status(200).send({});
      } else {
        next();
      }
    } catch (err) {
      res.status(500).send({
        error: "Unable to update review."
      });
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid review."
    });
  }
  })


  //patch a photo by PID
  app.put('/photos/:id', async (req, res, next) => {
    if (validateAgainstSchema(req.body, photoSchema)) {
      try {
        const updateSuccessful = await
          updatePhoto(parseInt(req.params.id), req.body);
        if (updateSuccessful) {
          res.status(200).send({});
        } else {
          next();
        }
      } catch (err) {
        res.status(500).send({
          error: "Unable to update photo."
        });
      }
    } else {
      res.status(400).send({
        err: "Request body does not contain a valid photo."
      });
    }
    })


///////////////////////////
//// DELETE OPERATIONS ////
///////////////////////////


//delete a business listing. 
app.delete('/businesses/:id', async (req, res, next) => {
  try {
    const deleteSuccessful = await
      deleteBusiness(parseInt(req.params.id));
    if (deleteSuccessful) {
       res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete business."
    });
  }
});


//delete a photo of a business using the photo id.
app.delete('/photos/:id', async (req, res, next) => {
  try {
    const deleteSuccessful = await
      deletePhoto(parseInt(req.params.id));
    if (deleteSuccessful) {
       res.status(200).send('photo deleted');
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete photo."
    });
  }
});


//delete a review of a business using the review id.
app.delete('/reviews/:id', async (req, res, next) => {
  try {
    const deleteSuccessful = await
      deleteReview(parseInt(req.params.id));
    if (deleteSuccessful) {
       res.status(200).send('review deleted');
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete review."
    });
  }
});






app.use('*', (req, res, next) => {
  res.status(404).send({
    err: "The path " + req.originalUrl + " doesn't exist"
  });
});

app.listen(port, () => {
  console.log("== Server is listening on port:", port);
});
