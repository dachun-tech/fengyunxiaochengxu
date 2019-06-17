let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let ProvinceSchema = new Schema({
    province_id: String,
    province: String,
    order: Number
});

module.exports = mongoose.model('provinces', ProvinceSchema);