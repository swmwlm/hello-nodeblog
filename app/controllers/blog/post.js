var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Post = mongoose.model('Post'),
  Category = mongoose.model('Category');

module.exports = function (app) {
  app.use('/posts', router);
};

router.get('/', function (req, res, next) {
  var conditions = { published:true };
  if(req.query.keyword){
    /**
    * 模糊搜索：主要用到了query.$or和query.$regex这两个find参数。
    * 示例：
    * query.or([{ color: 'red' }, { status: 'emergency' }])
    * query.$regex用于实现模糊查询
    *   { <field>: { $regex: /pattern/, $options: '<options>' } }
    *   { <field>: /pattern/<options> }
    *
    * const keyword = this.params.keyword //从URL中传来的 keyword参数
    * const reg = new RegExp(keyword, 'i') //不区分大小写
    * const result = yield User.find(
              {
                  $or : [ //多条件，数组
                      {nick : {$regex : reg}},
                      {email : {$regex : reg}}
                  ]
              },
              {
                  password : 0
              },
              {
                  sort : { _id : -1 },
                  limit : 100
              }
        )
    *
    */

    var regexp=new RegExp(req.query.keyword.trim(),'i');
    var orArr=[{title:regexp},{content:regexp}];
    conditions.$or=orArr; 
  }

  Post.find(conditions)
    .sort('-created')
    .populate('author')
    .populate('category')
    .exec(function (err, posts) {
      if (err) return next(err);
      console.log(conditions);

      var pageNum=Math.abs(parseInt(req.query.page||1,10));
      var pageSize=10;
      var totalCount=posts.length;
      var pageCount=Math.ceil(totalCount/pageSize);
      if(pageNum>pageCount){
        pageNum=pageCount;
      }
      console.log(posts.length);

      res.render('blog/index', {
        title: 'Node Blog Home',
        posts: posts.slice((pageNum-1)*pageSize,pageNum*pageSize),
        pageNum:pageNum,
        pageCount:pageCount,
        pretty: true,
        keyword:req.query.keyword
      });
  });
});
router.get('/view/:id', function (req, res, next) {
  if(!req.params.id){
    return next(new Error('no post id provided'));
  }
  var conditions={};
  // 支持slug访问
  try{
    conditions._id=mongoose.Types.ObjectId(req.params.id);
  }catch(err){
    conditions.slug=req.params.id;
  }
  Post.findOne(conditions)
      .populate('category')
      .populate('author')
      .exec(function(err,post){
        if(err){
          return next(err);
        }
        res.render('blog/view',{
          post:post,
          pretty:true
        })
      });
});

router.get('/favorite/:id', function (req, res, next) {
  if(!req.params.id){
    return next(new Error('no post id provided'));
  }
  var conditions={};
  try{
    conditions._id=mongoose.Types.ObjectId(req.params.id);
  }catch(err){
    conditions.slug=req.params.id;
  }
  Post.findOne(conditions)
      .populate('category')
      .populate('author')
      .exec(function(err,post){
        if(err){
          return next(err);
        }
        post.meta.favorates=post.meta.favorates ? post.meta.favorates+1:1;
        post.markModified('meta');
        post.save(function(err){
          res.redirect('/posts/view/'+post.slug);
        });

        
      });
});
router.get('/category/:name', function (req, res, next) {
  Category.findOne({name:req.params.name}).exec(function(err,category){
    if(err){
      return next(err);
    }

    Post.find({category:category,published:true})
        .sort('created')
        .populate('category')
        .populate('author')
        .exec(function(err,posts){
          if(err){
            return next(err);
          }
          res.render('blog/category', {
            posts: posts,
            category: category,
            pretty: true
          });
        });

  });
});

router.post('/comment/:id', function (req, res, next) {
  if(!req.body.email){
    return next(new Error('no email provided form commenter'));
  }
  if(!req.body.content){
    return next(new Error('no content provided form commenter'));
  }


  if(!req.params.id){
    return next(new Error('no post id provided'));
  }
  var conditions={};
  try{
    conditions._id=mongoose.Types.ObjectId(req.params.id);
  }catch(err){
    conditions.slug=req.params.id;
  }
  Post.findOne(conditions)
      .exec(function(err,post){
        if(err){
          return next(err);
        }
        var comment = {
          email: req.body.email,
          content: req.body.content,
          created:new Date
        };
        post.comments.unshift(comment);
        post.markModified('comments');
        post.save(function(err,post){
          req.flash('info','评论添加成功');
          res.redirect('/posts/view/'+post.slug);
        });
        // res.render('blog/view',{
        //   post:post,
        //   pretty:true
        // })
      });
});