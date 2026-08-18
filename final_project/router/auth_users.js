const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");

const regd_users = express.Router();

let users = [];

// Check whether username already exists
const isValid = (username) => {
  return users.some((user) => user.username === username);
};

// Check username and password
const authenticatedUser = (username, password) => {
  return users.some(
    (user) =>
      user.username === username &&
      user.password === password
  );
};

// Login
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required"
    });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({
      message: "Invalid username or password"
    });
  }

  const accessToken = jwt.sign(
    {
      username: username,
      password: password
    },
    "access"
  );

  req.session.authorization = {
    accessToken: accessToken
  };

  return res.status(200).json({
    message: "Login successful",
    token: accessToken
  });
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;

  if (!books[isbn]) {
    return res.status(404).json({
      message: "Book not found"
    });
  }

  if (!req.session.authorization) {
    return res.status(401).json({
      message: "User not logged in"
    });
  }

  const token = req.session.authorization.accessToken;

  try {
    const decoded = jwt.verify(token, "access");
    const username = decoded.username;

    if (!req.body.review) {
      return res.status(400).json({
        message: "Review is required"
      });
    }

    books[isbn].reviews[username] = req.body.review;

    return res.status(200).json({
      message: "Review successfully added/modified",
      reviews: books[isbn].reviews
    });

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
});

// Delete a review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;

  if (!books[isbn]) {
    return res.status(404).json({
      message: "Book not found"
    });
  }

  if (!req.session.authorization) {
    return res.status(401).json({
      message: "User not logged in"
    });
  }

  const token = req.session.authorization.accessToken;

  try {
    const decoded = jwt.verify(token, "access");
    const username = decoded.username;

    if (!books[isbn].reviews[username]) {
      return res.status(404).json({
        message: "Review not found"
      });
    }

    delete books[isbn].reviews[username];

    return res.status(200).json({
      message: "Review successfully deleted",
      reviews: books[isbn].reviews
    });

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;