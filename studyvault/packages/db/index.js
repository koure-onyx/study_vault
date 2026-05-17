const mongoose = require('mongoose');

const Program = require('./models/Program');
const Board = require('./models/Board');
const Book = require('./models/Book');
const Chapter = require('./models/Chapter');
const Topic = require('./models/Topic');
const User = require('./models/User');
const UserProgress = require('./models/UserProgress');
const Question = require('./models/Question');
const UserVault = require('./models/UserVault');
const Subscription = require('./models/Subscription');

module.exports = {
  Program,
  Board,
  Book,
  Chapter,
  Topic,
  User,
  UserProgress,
  Question,
  UserVault,
  Subscription,
};
