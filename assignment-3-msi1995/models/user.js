/*
 * User schema and data accessor methods.
 */

const mysqlPool = require('../lib/mysqlPool');
const bcrypt = require('bcryptjs');

const { extractValidFields } = require('../lib/validation');

/*
 * Schema for a User.
 */
const UserSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
};
exports.UserSchema = UserSchema;


const UserSchemaAdmin = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  admin: {required: true}
};
exports.UserSchemaAdmin = UserSchemaAdmin;

/*
 * Insert a new User into the DB.
 */
exports.insertNewUser = async function (user) {
  const userToInsert = extractValidFields(user, UserSchema);
  console.log("  -- userToInsert before hashing:", userToInsert);
  userToInsert.password = await bcrypt.hash(userToInsert.password, 8);
  console.log("  -- userToInsert after hashing:", userToInsert);
  const [ result ] = await mysqlPool.query(
    'INSERT INTO users SET ?',
    userToInsert
  );
  return result.insertId;
};


exports.insertNewAdmin = async function (user) {
  const userToInsert = extractValidFields(user, UserSchemaAdmin);
  console.log("  -- userToInsert before hashing:", userToInsert);
  userToInsert.password = await bcrypt.hash(userToInsert.password, 8);
  console.log("  -- userToInsert after hashing:", userToInsert);
  const [ result ] = await mysqlPool.query(
    'INSERT INTO users SET ?',
    userToInsert
  );
  return result.insertId;
};


/*
 * Fetch a user from the DB based on user id.
 */
async function getUserById (id, includePassword) {
  if(includePassword === true){
    const [results] = await mysqlPool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    )
    return results[0];
  }
  else{
    const [results] = await mysqlPool.query(
      'SELECT id, name, email, admin FROM users WHERE id = ?',
      [id]
    )
    return results[0];
  }
  
};
exports.getUserById = getUserById;

exports.validateUser = async function (id, password) {
  const user = await getUserById(id, true);
  console.log(password)
  console.log("== user password", user.password)
  return user && await bcrypt.compare(password, user.password);
}


async function adminCheck (id){
  const [results] = await mysqlPool.query(
    'SELECT admin FROM users WHERE id = ?',
    [id]
  )
  return results[0];
}

exports.adminCheck = adminCheck;