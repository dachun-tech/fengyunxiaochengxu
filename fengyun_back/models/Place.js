let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let PlaceSchema = new Schema({
    id: String,
    organizer_id: String,
    place: String,
    state: Number,  // 1: un-publish, 2: publish
});
// Events
PlaceSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('places', PlaceSchema);