// Post model
var md5 = require('md5');

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UserSchema = new Schema({
  name: { type:String, required:true},
  email: { type:String, required:true},
  password: { type:String, required:true},
  created:{type:Date}
});

// UserSchema.virtual('date')
//   .get(function(){
//     return this._id.getTimestamp();
//   });

UserSchema.methods.verifyPassword = function (password) {
	var isMatch = md5(password) === this.password;
	console.log('UserSchema.methods.verifyPassword:', password, this.password, isMatch);
	return isMatch;
}

mongoose.model('User', UserSchema);

