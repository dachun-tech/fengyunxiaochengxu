// Base Controller
let _ = require('underscore');
let Organizer = require('../models/Organizer');
let Competition = require('../models/Competition');
let Game = require('../models/Game');
let tenpay = require('tenpay');
let config = require('../config')();

module.exports = {
    name: "base.controller",
    extend: function (child) {
        return _.extend({}, this, child);
    },
    index: function (req, res, next) {
        if (!req.session.login) {
            return res.redirect('/login');
        } else if (req.session.user.role === 0) return res.redirect('/admin-organizer');
        else return res.redirect('/organizer');
    },
    login: async function (req, res, next) {
        if (req.method === 'POST') {
            let name = req.body.name;
            let password = req.body.password;
            let user = await Organizer.findOne({account_name: name});
            if (!user) return res.send({status: 'fail', message: "未定义的用户！"});
            if (user.identify === 2) return res.send({status: 'fail', message: '认证不通过'});
            if (!user.verifyPassword(password)) return res.send({status: 'fail', message: "密码错误！"});
            if (user.role === 1 && user.disabledState) return res.send({status: 'fail', message: '您的账号已禁用'});

            req.session.login = true;
            req.session.user = user;
            if(user.role != 0) req.session.organizer = user;
            return res.send({status: "success", message: "登录成功！"});
        } else {
            if (req.session.login) {
                if (req.session.user.role === 0) return res.redirect('/admin-organizer');
                else return res.redirect('/organizer');
            }
            await this.check_admin(req, res, next);
            return res.render('login', {});
        }
    },
    logout: async function (req, res, next) {
        req.session.login = false;
        req.session.user = null;
        req.session.organizer = null;
        return res.redirect('/login');
    },
    check_admin: async function (req, res, next) {
        let admin_item = await Organizer.findOne({role: 0});
        if (!admin_item) {
            let new_admin = new Organizer({
                nickname: "administrator",
                account_name: "Administrator",
                password: "admin",
                name: "Admin",
                role: 0
            });
            await new_admin.save();
        }
    },
    change_password: async function (req, res,next) {
        if (!req.session.login) return res.redirect('/login');
        if (req.method === 'POST') {
            let user_id = req.body.user_id;
            if (user_id !== req.session.user.id) return res.send({status: 'fail', message: '您无法更改未知用户的密码！'});
            let current_password = req.body.current_password;
            let new_password = req.body.new_password;
            let user = await Organizer.findOne({id: user_id});
            if (!user) return res.send({status: 'fail', message: '未定义的用户！'});
            if (!user.verifyPassword(current_password)) return res.send({status: 'fail', message: '您的旧密码不正确。'});
            user.password = new_password;
            await user.save();
            return res.send({status: 'success', message: '您的密码已成功更改。'})
        } else {
            res.render('change-password', {
                session: req.session,
                user_id: req.session.user.id
            })
        }
    },
    _utc_to_local: function (utc) {
        let current_utc_time = new Date(utc);
        current_utc_time.setHours(current_utc_time.getHours() + 8);
        return new Date(current_utc_time);
    },
    _local_to_utc: function (local) {
        let current_local_time = new Date(local);
        current_local_time.setHours(current_local_time.getHours() - 8);
        return new Date(current_local_time);
    },
    filter_nickname: function (nickname) {
        if (nickname === '') return nickname;
        nickname = nickname.replace(/\xEE[\x80-\xBF][\x80-\xBF]|\xEF[\x81-\x83][\x80-\xBF]/g, '');
        nickname = nickname.replace(/xE0[x80-x9F][x80-xBF]‘.‘|xED[xA0-xBF][x80-xBF]/g, '?');
        nickname = nickname.replace(/#(\\ud[0-9a-f]{3})#ie/g, '');
        return nickname
    },

    weixin_order: async function (order_data) {
        console.log("=========== weixin order request ================");
        console.log(order_data);
        let api = new tenpay(config.payment_config);
        let result = await api.getPayParams(order_data);
        console.log(result);
        return result;
    },
    weixin_refund: async function (refund_data) {
        console.log("=========== weixin refund request ================");
        console.log(refund_data);
        let api = new tenpay(config.payment_config);
        let result = await api.refund(refund_data);
        console.log(result);
        return result;
    },
    weixin_withdraw: async function (withdraw_data) {
        console.log("=========== weixin refund request ================");
        console.log(withdraw_data);
        let api = new tenpay(config.payment_config);
        let result = await api.transfers(withdraw_data);
        console.log(result);
        return result;
    },
    // remove all games when change competition type
    remove_all_games: async function (competition_id) {
        let competition = await Competition.findOne({id: competition_id});
        if (!competition) return false;
        await Game.deleteMany({competition_id: competition_id});
        return true
    },
};