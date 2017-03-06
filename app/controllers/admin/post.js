var express = require('express'),
  router = express.Router(),
  slug = require('slug'),
  pinyin = require('pinyin'),
  mongoose = require('mongoose'),
  Post = mongoose.model('Post'),
  auth = require('./user'),
  User = mongoose.model('User');
  Category = mongoose.model('Category');

module.exports = function (app) {
  app.use('/admin/posts', router);
};

router.get('/', auth.requireLogin, function (req, res, next) {
  // sort 
  var sortby=req.query.sortby ? req.query.sortby : "created";
  var sortdir = req.query.sortdir ? req.query.sortdir : "desc";
  if(['title','category','author','created','published'].indexOf(sortby)===-1){
  	sortby="created";
  }
  if(['asc','desc'].indexOf(sortdir) === -1) {
  	sortdir = "desc";
  }

  var sortObj = {};
  sortObj[sortby]=sortdir;

  // condition
  var conditions = {};
  if(req.query.category){
    conditions.category = req.query.category.trim();
  }
  if(req.query.author){
    conditions.author = req.query.author.trim();
  }
  if(req.query.keyword){
    var regexp=new RegExp(req.query.keyword.trim(),'i');
    var orArr=[{title:regexp},{content:regexp}];
    conditions.$or=orArr; 
  }

  User.find({},function(err,authors){
    if(err) return next(err);

    Post.find(conditions)
      .sort(sortObj)
      .populate('author')
      .populate('category')
      .exec(function (err, posts) {
        if (err) return next(err);

        var pageNum=Math.abs(parseInt(req.query.page||1,10));
        var pageSize=10;
        var totalCount=posts.length;
        var pageCount=Math.ceil(totalCount/pageSize);
        if(pageNum>pageCount){
          pageNum=pageCount;
        }

        res.render('admin/post/index', {
          title: 'Node Blog Home',
          posts: posts.slice((pageNum-1)*pageSize,pageNum*pageSize),
          pageNum:pageNum,
          pageCount:pageCount,
          sortby:sortby,
          sortdir:sortdir,
          authors:authors,
          filter: {
            category: req.query.category||"",
            author: req.query.author||"",
            keyword:req.query.keyword||"",
          },
          pretty: true
        });
    });    
  })
});


router.get('/add', auth.requireLogin, function (req, res, next) {
  res.render('admin/post/add',{
    action:"/admin/posts/add",
    post: {
      _id:'',
      category:{
        _id:''
      }
    },
    pretty:true
  })
});

router.post('/add', auth.requireLogin, function (req, res, next) {

  //https://www.npmjs.com/package/express-validator api文档
  req.checkBody('title', '文章标题不能为空').notEmpty();
  req.checkBody('category', '必须指定文章分类').notEmpty();
  req.checkBody('content', '文章内容至少写几句').notEmpty();
  

  var title = req.body.title.trim();
  var category = req.body.category.trim();
  var content = req.body.content;

  var errors = req.validationErrors();
  if (errors) {
    var retPost={};
    //当校验失败，友好性返回用户之前的值
    retPost.title=title;
    retPost.content=content;
    retPost.slug=slug(py);
    return res.render('admin/post/add',{
        post:retPost,
        errors:errors
      });
  }


  var py=pinyin(title,{
      style:pinyin.STYLE_NORMAL,
      heteronym: false
    }).map(function(item){
      return item[0];
    }).join(' ');
  //从数据库用户表中找一个用户做 添加动作
  User.findOne({},function(err,author){
    if(err) return next(err);
    var post = new Post({
      title:title,
      slug: slug(py),
      category:category,
      content:content,
      author:author,
      published:true,
      meta:{
        favorates:0
      },
      comments: [],
      created: new Date()
    });
    post.save(function(err,post){
      if(err){
        req.flash('error','文章保存失败');
        return next(err);
      }
      req.flash('info','文章保存成功');
      res.redirect('/admin/posts');
    });
  });

});

router.get('/edit/:id',auth.requireLogin, getPostById, function (req, res, next) {
  var post=req.post;
  res.render('admin/post/add',{
    post:post,
    action:"/admin/posts/edit/"+post._id,
    pretty:true
  }) 
});

router.post('/edit/:id', auth.requireLogin, getPostById, function (req, res, next) {
  var post=req.post;

  var title = req.body.title.trim();
  var category = req.body.category.trim();
  var content = req.body.content;
  var py=pinyin(title,{
    style:pinyin.STYLE_NORMAL,
    heteronym: false
  }).map(function(item){
    return item[0];
  }).join(' ');

  //定义校验规则
  req.checkBody('title', '文章标题不能为空').notEmpty();
  req.checkBody('category', '必须指定文章分类').notEmpty();
  req.checkBody('content', '文章内容至少写几句').notEmpty();
  
  //验证校验规则
  var errors = req.validationErrors();
  if (errors) {
    var retPost=post;
    //当校验失败，友好性返回用户之前的值
    retPost.title=title;
    retPost.content=content;
    retPost.slug=slug(py);
    return res.render('admin/post/add',{
      post:retPost,
      errors:errors
    });
  }

  post.title=title;
  post.category=category;
  post.content=content;
  post.slug=slug(py);

  post.save(function(err,post){
    if(err){
      req.flash('error','文章编辑失败');
      res.redirect('/admin/posts/edit/' + post._id);
    }
    req.flash('info','文章编辑成功');
    res.redirect('/admin/posts');
  });
  
});
router.get('/delete/:id', auth.requireLogin, getPostById, function (req, res, next) {
  req.post.remove(function(err,rowsRemoved){
  	if(err){
  		return next(err);
  	}
  	if(rowsRemoved){
  		req.flash('success','文章删除成功');
  	}else{
  		req.flash('success','文章删除失败');
  	}
  	res.redirect('/admin/posts');
  });
});

function getPostById(req,res,next){
  if(!req.params.id){
    return next(new Error('no post id provided'));
  }
  Post.findOne({ _id:req.params.id })
    .populate('category')
    .populate('author')
    .exec(function(err,post){
    if(err) return next(err);
    if(!post){
      return next(new Error('post not found:',req.params.id));
    }
    req.post=post;
    next();
  });
}