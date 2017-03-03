var express = require('express'),
  router = express.Router();
  // mongoose = require('mongoose'),
  // Post = mongoose.model('Post');


module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  // Post.find().populate('author').populate('category').exec(function (err, posts) {
  //   if (err) return next(err);
  //   res.render('blog/index', {
  //     title: 'Node Blog Admin Home',
  //     posts: posts,
  //     pretty: true
  //   });
  // });
  res.redirect('/posts');
});
router.get('/about', function (req, res, next) {
  res.render('blog/about', {
      title: 'About me',
      pretty: true
    });
});
router.get('/contact', function (req, res, next) {
  res.render('blog/contact', {
      title: 'Contact me',
      pretty: true
    });
});