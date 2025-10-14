// backend/storage.js
// In-memory storage for demo purposes (replace with database in production)

const users = [];

const addUser = (user) => {
  users.push(user);
  return user;
};

const findUserByEmail = (email) => {
  return users.find(user => user.email === email);
};

const getAllUsers = () => {
  return users;
};

module.exports = {
  addUser,
  findUserByEmail,
  getAllUsers
};
