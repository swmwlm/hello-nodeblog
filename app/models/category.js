// Category model
// slug attibute : 对应title的英文
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var CategorySchema = new Schema({
  name: { type:String, required:true},
  slug: { type:String, required:true},
  created:{type:Date}
});

// CategorySchema.virtual('date')
//   .get(function(){
//     return this._id.getTimestamp();
//   });

mongoose.model('Category', CategorySchema);

