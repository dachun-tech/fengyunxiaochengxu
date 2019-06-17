let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let FavoriteSchema = new Schema({
    id: String,
    f_type: Number,  // 1: team favorite, 2: competition favorite
    user_id: String,
    fav_id: String,  // team id or competition id
});
// Events
FavoriteSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('favorites', FavoriteSchema);