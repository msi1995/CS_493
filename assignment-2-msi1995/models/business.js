const mysqlPool = require('../lib/mysqlPool');

const { extractValidFields } = require('../lib/validation');

/*
 * Schemas
 */
const BusinessSchema = {
  ownerID: { required: true },
  Name: { required: true },
  StreetAddress: { required: true },
  City: { required: true },
  State: { required: true },
  ZIPCode: { required: true },
  Phone: { required: true },
  Category: { required: true },
  Subcategory: { required: true },
  Website: { required: false },
  Email: { required: false }
};
exports.BusinessSchema = BusinessSchema;

const reviewSchema = {
  UserID: { required: true },
  BusinessID: { required: true },
  Stars: { required: true },
  DollarSigns: { required: true },
  moreInfo: { required: false }
};
exports.reviewSchema = reviewSchema;

const photoSchema = {
  UserID: { required: true },
  BusinessID: { required: true },
  PhotoURL: { required: true },
  PhotoCaption: { required: false }
};
exports.photoSchema = photoSchema;



// functions //

/*
 * SELECT COUNT(*) FROM business;
 */
async function getBusinessCount() {
  const [ results ] = await mysqlPool.query(
    "SELECT COUNT(*) AS count FROM businesses"
  );
  console.log("  -- results:", results);
  return results[0].count;
}
exports.getBusinessCount = getBusinessCount;

/*
 * SELECT * FROM business ORDER BY id LIMIT <offset>,<pageSize>
 */
async function getBusinessesPage(page) {
  const count = await getBusinessCount();
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  /*
   * offset = "; DROP TABLES *;"
   */
  const [ results ] = await mysqlPool.query(
    "SELECT * FROM businesses ORDER BY id LIMIT ?,?",
    [ offset, pageSize ]
  );

  return {
    businesses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };
}
exports.getBusinessesPage = getBusinessesPage;



/*
 * INSERT INTO lodgings SET ...;
 */
async function insertNewBusiness(business) {
  business = extractValidFields(business, BusinessSchema);
  const [ result ] = await mysqlPool.query(
    "INSERT INTO businesses SET ?",
    business
  );
  return result.insertId;
}
exports.insertNewBusiness = insertNewBusiness;


//post a review of a business
async function insertNewReview(review) {
  review = extractValidFields(review, reviewSchema);
  const [ result ] = await mysqlPool.query(
    "INSERT INTO reviews SET ?",
    review
  );
  return result.insertId;
}
exports.insertNewReview = insertNewReview;


//add a photo of a business
async function insertNewPhoto(photo) {
  photo = extractValidFields(photo, photoSchema);
  const [ result ] = await mysqlPool.query(
    "INSERT INTO photos SET ?",
    photo
  );
  return result.insertId;
}
exports.insertNewPhoto = insertNewPhoto;


//delete a business
async function deleteBusiness(businessID){
  const [ results ] = await mysqlPool.query(
    "DELETE FROM businesses WHERE id = ?",
    [businessID]
  );
  return result.affectedRows > 0;
}
exports.deleteBusiness = deleteBusiness;


//delete a photo
async function deletePhoto(photoID){
  const [ results ] = await mysqlPool.query(
    "DELETE FROM photos WHERE PID = ?",
    [photoID]
  );
  return result.affectedRows > 0;
}
exports.deletePhoto = deletePhoto;


//delete a review
async function deleteReview(reviewID){
  const [ results ] = await mysqlPool.query(
    "DELETE FROM reviews WHERE RID = ?",
    [reviewID]
  );
  return result.affectedRows > 0;
}
exports.deleteReview = deleteReview;



//get specific business
async function getBusiness(businessID){
  const [results] = await mysqlPool.query(
    "SELECT * FROM businesses WHERE id = ?",
    [businessID]
  );

  return{
    business: results
  }
}

exports.getBusiness = getBusiness;

//get reviews for business
async function getReviews(businessID){
  const [results] = await mysqlPool.query(
    "SELECT * FROM reviews WHERE businessID = ?",
    [businessID]
  );

  return{
    reviews: results
  }
}

exports.getReviews = getReviews;

//get photos for business
async function getPhotos(businessID){
  const [results] = await mysqlPool.query(
    "SELECT * FROM photos WHERE businessID = ?",
    [businessID]
  );

  return{
    photos: results
  }
}
exports.getPhotos = getPhotos;


//get businessed owned by a user
async function getUserBusinesses(userID){
  const [results] = await mysqlPool.query(
    "SELECT * FROM businesses WHERE OwnerID = ?",
    [userID]
  );
  return{
    results
  }
}
exports.getUserBusinesses = getUserBusinesses;

//get photos owned by a user
async function getUserPhotos(userID){
  const [results] = await mysqlPool.query(
    "SELECT * FROM photos WHERE UserID = ?",
    [userID]
  );
  return{
    results
  }
}
exports.getUserPhotos = getUserPhotos;

//get reviews owned by a user
async function getUserReviews(userID){
  const [results] = await mysqlPool.query(
    "SELECT * FROM reviews WHERE UserID = ?",
    [userID]
  );
  return{
    results
  }
}
exports.getUserReviews = getUserReviews;


//patch a business
async function updateBusiness(businessID, business) {
  const validatedBusiness = extractValidFields(
    business,
    BusinessSchema
  );
  const [ result ] = mysqlPool.query(
    'UPDATE businesses SET ? WHERE id = ?',
    [ validatedBusiness, businessID ]
  );
  return result.affectedRows > 0;
}
exports.updateBusiness = updateBusiness;


//patch a photo
async function updatePhoto(PID, photo) {
  const validatedPhoto = extractValidFields(
    photo,
    photoSchema
  );
  const [ result ] = mysqlPool.query(
    'UPDATE photos SET ? WHERE PID = ?',
    [ validatedPhoto, PID ]
  );
  return result.affectedRows > 0;
}
exports.updatePhoto = updatePhoto;


//patch a review
async function updateReview(RID, review) {
  const validatedReview = extractValidFields(
    review,
    reviewSchema
  );
  const [ result ] = mysqlPool.query(
    'UPDATE reviews SET ? WHERE RID = ?',
    [ validatedReview, RID ]
  );
  return result.affectedRows > 0;
}
exports.updateReview = updateReview;


