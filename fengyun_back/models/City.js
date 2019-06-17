let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let CitySchema = new Schema({
    city_id: String,
    city: String,
    province_id: String,
    order: Number
});

module.exports = mongoose.model('cities', CitySchema);