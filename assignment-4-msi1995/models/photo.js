/*
 * Photo schema and data accessor methods.
 */

const fs = require("fs");
const Jimp = require("jimp");
const { ObjectId, GridFSBucket } = require('mongodb')
const crypto = require('crypto');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
  businessid: { required: true },
  caption: { required: false }
};
exports.PhotoSchema = PhotoSchema;

/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo) {
  photo = extractValidFields(photo, PhotoSchema);
  photo.businessid = ObjectId(photo.businessid);
  const db = getDBReference();
  const collection = db.collection('photos');
  const result = await collection.insertOne(photo);
  return result.insertedId;
}
exports.insertNewPhoto = insertNewPhoto;

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {
  const db = getDBReference();
  const collection = db.collection('photos');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
}
exports.getPhotoById = getPhotoById;

/*
 * Executes a DB query to fetch all photos for a specified business, based
 * on the business's ID.  Returns a Promise that resolves to an array
 * containing the requested photos.  This array could be empty if the
 * specified business does not have any photos.  This function does not verify
 * that the specified business ID corresponds to a valid business.
 */
async function getPhotosByBusinessId(id) {
  const db = getDBReference();
  // const collection = db.collection('photos');
  const bucket = new GridFSBucket(db, {bucketName: 'images'});
  // if (!ObjectId.isValid(id)) {
  //   return [];
  // } else {
    // const results = await collection
    //   .find({ businessid: new ObjectId(id) })
    //   .toArray();
    const results = await bucket.find({"metadata.businessId": id})
    .toArray();
    return results;
}
exports.getPhotosByBusinessId = getPhotosByBusinessId;


exports.saveImageInfo = async function(image){
  const db = getDBReference()
  const collection = db.collection('images');
  const result = await collection.insertOne(image);
  return result.insertedId
}

exports.getImageInfoById = async function (id){
  const db = getDBReference()
  //const collection = db.collection('images');
  const bucket = new GridFSBucket(db, {bucketName: 'images'});
  if (!ObjectId.isValid(id)){
    return null;
  } else {
    // const results = await collection.find({_id: new ObjectId(id) })
    //   .toArray();
    const results = await bucket.find({_id: new ObjectId(id) })
      .toArray();
      return results[0];
  }
};

exports.getImageDownloadStreamByFilename = function(filename){
  const db = getDBReference()
  const bucket = new GridFSBucket(db, {bucketName: 'images'});
  return bucket.openDownloadStreamByName(filename);
};

exports.getImageDownloadStreamById = function(id){
  const db = getDBReference()
  const bucket = new GridFSBucket(db, {bucketName: 'images'});
  if(!ObjectId.isValid(id)){
    return null;
  } else {
  return bucket.openDownloadStream(new ObjectId(id));
  }
};

exports.updateImageDimensionsById = async function (id, dimensions){
  const db = getDBReference();
  const collection = db.collection('images.files');
  if(!ObjectId.isValid(id)){
    return null;
  } else {
    const result = await collection.updateOne(
      {_id: new ObjectId(id)},
      {$set: {"metadata.dimensions": dimensions}}
    )
    return result.matchedCount > 0;
}};


exports.resizePhoto = async function (image, largestDimension, id){
  const db = getDBReference();
  const collection = db.collection('images.files');
  const imageSizes = [128, 256, 640, 1024]
  filename = crypto.pseudoRandomBytes(16).toString('hex');

  Jimp.read(image, (err, newPhoto) => {
    if (err) throw err;
    for(i = 0; i < imageSizes.length; i++){
      if(largestDimension > imageSizes[i]){
      path = './uploads/' + filename + "-" + imageSizes[i].toString() +'.jpg';
      newPhoto.resize(imageSizes[i], Jimp.AUTO).write(path);
      }
    }
  })
  const result = await collection.updateMany(
    {_id: new ObjectId(id)},
    {$set: {"metadata.128px": filename + "-128", "metadata.256px": filename + "-256",
            "metadata.640px": filename + "-640","metadata.1024px": filename + "-1024"}}
  )
  return result.matchedCount > 0;
};

exports.saveImageFile = function (image){
  return new Promise((resolve, reject) => {
    const db = getDBReference();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });
    const metadata = {
      contentType: image.contentType,
      userId: image.userId,
      businessId: image.businessId,
      caption: image.caption
    };
    const uploadStream = bucket.openUploadStream(
      image.filename,
      { metadata: metadata}
    );
    fs.createReadStream(image.path).pipe(uploadStream)
      .on('error', (err) => {
        reject(err)
      })
      .on('finish', (result) => {
        resolve(result._id);
      });
      /* Remove file from file system here */
  });
};