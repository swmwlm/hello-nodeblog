var passport= require('passport');
var LocalStrategy= require('passport-local').Strategy;
var mongoose =require('mongoose');
var User = mongoose.model('User');

module.exports.init = function (){
	// 策略配置
	console.log('passport.local.init');
	passport.use(new LocalStrategy({
		    usernameField: 'email',
		    passwordField: 'password'
	  	},function(username, password, done) {
			console.log('passport.local.find:',username);
		    User.findOne({ email: username }, function (err, user) {
				console.log('passport.local.find:',user,err);
				if (err) { return done(err); }
				if (!user) { return done(null, false); }
				if (!user.verifyPassword(password)) { return done(null, false); }
				return done(null, user);
		    });
	  }));

	// sessions config 加密解密
	passport.serializeUser(function(user, done) {
		console.log('passport.local.serializeUser',user);
		done(null, user._id);
	});
	passport.deserializeUser(function(id, done) {
		console.log('passport.local.deserializeUser',id);
		User.findById(id, function (err, user) {
		done(err, user);
		});
	});
}
