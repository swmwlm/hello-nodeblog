var express = require('express'),
  router = express.Router(),
  slug = require('slug'),
  pinyin = require('pinyin'),
  mongoose = require('mongoose'),
  auth = require('./user'),
  Post = mongoose.model('Post'),
  Category = mongoose.model('Category');

module.exports = function (app) {
  app.use('/admin/categories', router);
};

router.get('/', auth.requireLogin, function (req, res, next) {
  res.render('admin/category/index', {
    pretty: true
  });
});
router.get('/add', auth.requireLogin, function (req, res, next) {
  res.render('admin/category/add', {
    action:"/admin/categories/add",
    pretty: true,
    category: {
      _id:''
    },
  });
});
router.post('/add', auth.requireLogin, function (req, res, next) {
  req.checkBody('name', '分类名称不能为空').notEmpty();

  var name = req.body.name.trim();
  var errors = req.validationErrors();
  if (errors) {
    var retCategory={};
    retCategory.name=name;

    return res.render('admin/category/add',{
      category:retCategory,
      errors:errors
    });
  }

  var py=pinyin(name,{
      style:pinyin.STYLE_NORMAL,
      heteronym: false
    }).map(function(item){
      return item[0];
    }).join(' ');
  
  var category = new Category({
    name:name,
    slug: slug(py),
    created: new Date()
  });
  category.save(function(err,category){
    if(err){
      req.flash('error','分类保存失败');
      res.redirect('/admin/categories/add')
      return next(err);
    }
    req.flash('info','分类保存成功');
    res.redirect('/admin/categories');
  });
});
router.get('/edit/:id', auth.requireLogin, getCategoryById, function (req, res, next) {
  var category=req.category;
  res.render('admin/category/add',{
    category:category,
    action:"/admin/categories/edit/"+category._id,
    pretty:true
  })   
});

router.post('/edit/:id', auth.requireLogin, getCategoryById, function (req, res, next) {  
  var category=req.category;

  var name = req.body.name.trim();
  var py=pinyin(name,{
    style:pinyin.STYLE_NORMAL,
    heteronym: false
  }).map(function(item){
    return item[0];
  }).join(' ');

  //定义校验规则
  req.checkBody('name', '分类名称不能为空').notEmpty();
  
  //验证校验规则
  var errors = req.validationErrors();
  if (errors) {
    var retCategory=category;
    //当校验失败，友好性返回用户之前的值
    retCategory.name=name;
    return res.render('admin/category/add',{
      category:retCategory,
      errors:errors
    });
  }

  category.name=name;
  category.slug=slug(py);

  category.save(function(err,category){
    if(err){
      req.flash('error','分类编辑失败');
      res.redirect('/admin/categories/edit/' + category._id);
    }
    req.flash('info','分类编辑成功');
    res.redirect('/admin/categories');
  }); 
});
router.get('/delete/:id', auth.requireLogin, getCategoryById, function (req, res, next) {
  req.category.remove(function(err,rowsRemoved){
    if(err){
      return next(err);
    }
    if(rowsRemoved){
      req.flash('success','分类删除成功');
    }else{
      req.flash('success','分类删除失败');
    }
    res.redirect('/admin/categories');
  });
});
function getCategoryById(req,res,next){
  if(!req.params.id){
    return next(new Error('no category id provided'));
  }
  
  Category.findOne({ _id:req.params.id })
    .exec(function(err,category){
    if(err) return next(err);
    if(!category){
      return next(new Error('category not found:',req.params.id));
    }
    req.category=category;
    next();
  });
}