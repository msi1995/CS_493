/*
 * API sub-router for businesses collection endpoints.
 */

const router = require('express').Router();
const { generateAuthToken, requireAuthentication } = require('../lib/auth');

const { validateAgainstSchema } = require('../lib/validation');
const {
  BusinessSchema,
  getBusinessesPage,
  insertNewBusiness,
  getBusinessById,
  getBusinessDetailsById,
  replaceBusinessById,
  deleteBusinessById,
  getBusinessesByOwnerdId,
  adminCheck
} = require('../models/business');
const { getUserById } = require('../models/user');

/*
 * Route to return a paginated list of businesses.
 */
router.get('/', async (req, res) => {
  try {
    /*
     * Fetch page info, generate HATEOAS links for surrounding pages and then
     * send response.
     */
    const businessPage = await getBusinessesPage(parseInt(req.query.page) || 1);
    businessPage.links = {};
    if (businessPage.page < businessPage.totalPages) {
      businessPage.links.nextPage = `/businesses?page=${businessPage.page + 1}`;
      businessPage.links.lastPage = `/businesses?page=${businessPage.totalPages}`;
    }
    if (businessPage.page > 1) {
      businessPage.links.prevPage = `/businesses?page=${businessPage.page - 1}`;
      businessPage.links.firstPage = '/businesses?page=1';
    }
    res.status(200).send(businessPage);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Error fetching businesses list.  Please try again later."
    });
  }
});

/*
 * Route to create a new business.
 */
router.post('/', requireAuthentication, async (req, res) => {
  if (validateAgainstSchema(req.body, BusinessSchema)) {
    if (req.user != req.body.id) {
      res.status(403).send({
        error: "Unauthorized to access the specified resource"
      });
    } else {
      try {
        const id = await insertNewBusiness(req.body);
        res.status(201).send({
          id: id,
          links: {
            business: `/businesses/${id}`
          }
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Error inserting business into DB.  Please try again later."
        });
      }
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid business object."
    });
  }
});

/*
 * Route to fetch info about a specific business.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const business = await getBusinessDetailsById(parseInt(req.params.id));
    if (business) {
      res.status(200).send(business);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch business.  Please try again later."
    });
  }
});

/*
 * Route to replace data for a business.
 */
router.put('/:id', async (req, res, next) => {
  if (validateAgainstSchema(req.body, BusinessSchema)) {
    try {
      const id = parseInt(req.params.id)
      const updateSuccessful = await replaceBusinessById(id, req.body);
      if (updateSuccessful) {
        res.status(200).send({
          links: {
            business: `/businesses/${id}`
          }
        });
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to update specified business.  Please try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid business object"
    });
  }
});

/*
 * Route to delete a business, verifies user is who they say they are
   as well as checking for admin status/ownership.
 */
router.delete('/:id', requireAuthentication, async (req, res, next) => {

    const userInfo = await getUserById(req.user)
    const businessinfo = await getBusinessById(req.params.id)
    if(userInfo.admin == 1 || req.user == businessinfo.ownerid ){
      try {
        const deleteSuccessful = await deleteBusinessById(parseInt(req.params.id));
        if (deleteSuccessful) {
          res.status(204).end();
        } else {
          next();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Unable to delete business.  Please try again later."
        });
      }
    }
    else{
      res.status(403).send({
        error: "You are not the owner of this business and cannot delete it."
      })
    }
});

module.exports = router;
