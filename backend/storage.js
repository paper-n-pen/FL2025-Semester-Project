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

// Update user password
const updateUserPassword = (email, hashedPassword) => {
  const userIndex = users.findIndex(u => u.email === email);
  if (userIndex !== -1) {
    users[userIndex].password = hashedPassword;
    return true;
  }
  return false;
};

module.exports = {
  addUser,
  findUserByEmail,
  getAllUsers,
  updateUserPassword
};
