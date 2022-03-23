/*
 * API sub-router for businesses collection endpoints.
 */

const router = require('express').Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require("fs");
const {connectToRabbitMQ, getChannel} = require('../lib/rabbitmq');

const { validateAgainstSchema } = require('../lib/validation');
const {
  PhotoSchema,
  insertNewPhoto,
  getPhotoById,
  saveImageInfo,
  saveImageFile,
  getImageInfoById
} = require('../models/photo');
const { response } = require('express');
const { fstat } = require('fs');

const acceptedFileTypes = {
  'image/jpeg': 'jpg',
  'image/png' : 'png',
}

const upload = multer({
  storage: multer.diskStorage({
    destination: `./uploads`,
    filename: (req, file, callback) => {
      const filename = crypto.pseudoRandomBytes(16).toString('hex');
      const extension = acceptedFileTypes[file.mimetype];
      callback(null, `${filename}.${extension}`)
    }
  }),
  fileFilter: (req, file, callback) => {
    callback(null, !!acceptedFileTypes[file.mimetype])
  }
});



/*
 * Route to create a new photo.
 */
router.post('/', upload.single('image'), async (req, res, next) => {
  console.log("== req.file:", req.file)
  if(req.file && req.body && req.body.userId){
    const image = {
      contentType: req.file.mimetype,
      filename: req.file.filename,
      path: req.file.path,
      userId: req.body.userId,
      businessId: req.body.businessId,
      caption: req.body.caption
    };
    try{
      const id = await saveImageFile(image);

      const channel = getChannel();
      channel.sendToQueue('images', Buffer.from(id.toString()))
      res.status(200).send({
        id: id
      });
    } catch(err) {
      next(err)
    }
  } else{
    res.status(400).send({
      error: "Request didn't contain correct params"
      });
    }
  // if (validateAgainstSchema(req.body, PhotoSchema)) {
  //   try {
  //     const id = await insertNewPhoto(req.body);
  //     res.status(201).send({
  //       id: id,
  //       links: {
  //         photo: `/photos/${id}`,
  //         business: `/businesses/${req.body.businessid}`
  //       }
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).send({
  //       error: "Error inserting photo into DB.  Please try again later."
  //     });
  //   }
  // } else {
  //   res.status(400).send({
  //     error: "Request body is not a valid photo object"
  //   });
  // }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const image = await getImageInfoById(req.params.id);
    if (image) {
      // delete image.path
      // image.url = `/media/images/${image.filename}`;
      const responseBody = {
        _id: image._id,
        filename: image.filename,
        url: `/media/images/${image.filename}`,
        contentType: image.metadata.contentType,
        userId: image.metadata.userId,
        dimensions: image.metadata.dimensions
      };
      res.status(200).send(responseBody);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch image.  Please try again later."
    });
  }
});

router.use("*", (err, req, res, next) => {
  console.error(err);
  res.status(500).send({
    error: "An error occurred. Try again later. Not sure why."
  })

})

module.exports = router;

