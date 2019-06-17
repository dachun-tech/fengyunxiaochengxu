let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let bcrypt = require('bcryptjs');

let OrganizerSchema = new Schema({
    id: String,
    user_id: String,
    avatar: String,
    nickname: String,
    password: String,
    name: String,
    phone: String,
    account_name: String,
    amount_pending: Number,
    amount_withdraw: Number,
    disabledState: Boolean,
    id_time: Date,          // time when submit organizer info by user
    identify: Number,    // 0: 认证中, 1: 认证通过, 2: 认证不通过
    role: Number,       // 0: admin, 1: organizer, 2: users
});
// Events
OrganizerSchema.pre('save', function (next) {
    this.id = this._id.toString();
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(this.password, salt, (err, hash) => {
            this.password = hash;
            next();
        })
    });
});
// Methods
OrganizerSchema.methods.verifyPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};
module.exports = mongoose.model('organizers', OrganizerSchema);