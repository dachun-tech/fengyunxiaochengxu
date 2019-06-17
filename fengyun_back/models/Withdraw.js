let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let WithdrawSchema = new Schema({
    id: String,
    user: String,
    amount: Number,
    partner_trade_no: String,
    w_state: Number,  // 1: pending, 2: success, 3: fail
    created_at: Date,
    updated_at: Date,
});
// event
WithdrawSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('withdraws', WithdrawSchema);