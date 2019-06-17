let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let ApplyingSchema = new Schema({
    id: String,
    user_id: String,
    competition_id: String,  // competition id
    team_id: String,  // team id
    a_name: String,
    a_phone: String,
    a_state: Number,  // 0: removed, 1: pending(待审核), 2: pass(审核通过), 3: non-pass(审核不通过)(after refund fee, it will be 0:removed state)
    a_reason: String,
    wallet_pay_price: Number,
    online_pay_price: Number,
    out_trade_no: String,
    out_refund_no: String,
    pay_state: Number,  // 1: pending, 2: success, 3: fail
    created_at: Date,
    updated_at: Date,
});
// Events
ApplyingSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('applies', ApplyingSchema);

// applying -> update a_state = 0, pay_state = 1 -> weixin-order
// cancel-applying -> update a_state = 3, pay_state = 1 -> refund order
// notify_url -> a_state = 1, pay_state = 2 || pay_state = 3
// refund is failed, pay_state = 3, a_state = 1
