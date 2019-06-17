let BaseController = require('./BaseController');
let Organizer = require('../models/Organizer');
let User = require('../models/User');
let Competition = require('../models/Competition');
let Team = require('../models/Team');
let Feedback = require('../models/Feedback');
let Notification = require('../models/Notification');

module.exports = BaseController.extend({
    name: "AdminController",
    organizer_manage: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if (req.session.user.role !== 0) return res.render('404', {});
        let page_rows = 10;
        let total_length = await Organizer.find({role: 1}).countDocuments();
        let total_pages = Math.ceil(total_length / page_rows);
        Organizer.find({role: 1}).sort({identify: 1}).limit(page_rows).exec(
            function (err, organizers) {
                if (err) return res.render('admin/organizers',
                    {
                        session: req.session,
                        organizers: [],
                        pages: 1
                    });
                return res.render('admin/organizers',
                    {
                        session: req.session,
                        organizers: organizers,
                        pages: total_pages,
                        current: 1
                    });
            }
        );
    },
    organizer_identify: async function (req, res, next) {
        console.log(req.body);
        let id = req.body.account_id;
        let organizer = await Organizer.findOne({id: id});
        if (!organizer) return res.send({status: 'fail', message: '未定义的用户！'});
        let identify = parseInt(req.body.account_identify);
        if (identify === 2) {
            await organizer.updateOne({identify: 2});
            // notification
            let notification_data = {
                n_type: 2,
                n_title: '认证不通过消息',
                n_content: '很抱歉，您申请的主办方身份认证未通过',
                n_receiver: organizer.user_id,
                n_state: 1,
                created_at: this._utc_to_local(new Date()),
                updated_at: this._utc_to_local(new Date()),
            };
            console.log("organizer identify 2: ", notification_data);
            let notification_item = new Notification(notification_data);
            await notification_item.save();
            return res.send({status: 'success', message: '认证未通过'});
        } else if (identify === 1) {
            organizer.account_name = req.body.account_name;
            organizer.password = req.body.account_password;
            organizer.identify = 1;
            await organizer.save();
            // notification
            let notification_data = {
                n_type: 1,
                n_title: '认证通过消息',
                n_content: '您申请的主办方身份认证已通过',
                n_receiver: organizer.user_id,
                n_state: 1,
                created_at: this._utc_to_local(new Date()),
                updated_at: this._utc_to_local(new Date()),
            };
            console.log("organizer identify 1: ", notification_data);
            let notification_item = new Notification(notification_data);
            await notification_item.save();
            return res.send({status: 'success', message: '认证通过'});
        } else {
            return res.send({status: 'fail', message: 'Undefined Identify'});
        }
    },
    organizer_disable: async function (req, res, next) {
        let organizer = await Organizer.findOne({id: req.body.account_id});
        if (!organizer) return res.send({status: 'fail', message: 'Undefined Organizer'});
        let flag = req.body.flag;
        let disabledState = true;
        if (flag === 'false') disabledState = false;
        await organizer.updateOne({disabledState: disabledState});
        return res.send({status: 'success', message: '操作成功'});
    },
    reset_organizer_password: async function (req, res, next) {
        let id = req.body.account_id;
        let organizer = await Organizer.findOne({id: id});
        if (!organizer) return res.send({status: 'fail', message: '未定义的用户！'});
        organizer.account_name = req.body.account_name;
        organizer.password = req.body.account_password;
        await organizer.save();
        return res.send({status: 'success', message: '重设密码成功'});
    },
    team_manage: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if (req.session.user.role !== 0) return res.render('404', {});
        let page_rows = 10;
        let total_length = await Team.find({}).countDocuments();
        let total_pages = Math.ceil(total_length / page_rows);
        let teams = await Team.aggregate([
            {
                $lookup: {
                    from: 'applies',
                    localField: 'id',
                    foreignField: 'team_id',
                    as: 'apply'
                },
            },
            {
                $lookup: {
                    from: 'competitions',
                    localField: 'apply.competition_id',
                    foreignField: 'id',
                    as: 'competition'
                },
            },
            {
                $lookup: {
                    from: 'members',
                    let: {'pid': '$t_members'},
                    pipeline: [
                        {$match: {$expr: {$in: ['$id', '$$pid']}}}
                    ],
                    as: 'members'
                }
            },
            {"$unwind":"$members"},
            {$match: {'members.m_state': 1}}
        ]).limit(page_rows);
        let cities = await Team.aggregate([
            {
                $group: {
                    _id: '$t_city',
                    count: {$sum: 1}
                }
            }
        ]);
        if (!teams) return res.render('admin/teams',
            {
                session: req.session,
                teams: [],
                pages: 1,
                cities: []
            });
        else return res.render('admin/teams',
            {
                session: req.session,
                teams: teams,
                pages: total_pages,
                current: 1,
                cities: cities
            });
    },
    user_manage: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if (req.session.user.role !== 0) return res.render('404', {});
        let page_rows = 10;
        let total_length = await User.find({}).countDocuments();
        let total_pages = Math.ceil(total_length / page_rows);
        User.find({}).limit(page_rows).exec(
            function (err, users) {
                if (err) return res.render('admin/organizers',
                    {
                        session: req.session,
                        users: [],
                        pages: 1
                    });
                return res.render('admin/users',
                    {
                        session: req.session,
                        users: users,
                        pages: total_pages,
                        current: 1
                    });
            }
        );
    },
    user_disable: async function (req, res, next) {
        let user = await User.findOne({id: req.body.account_id});
        if (!user) return res.send({status: 'fail', message: 'Undefined user'});
        let flag = req.body.flag;
        let disabledState = true;
        if (flag === 'false') disabledState = false;
        await user.updateOne({disabledState: disabledState});
        return res.send({status: 'success', message: '操作成功'});
    },
    competition_manage: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if (req.session.user.role !== 0) return res.render('404', {});

        let page_rows = 10;
        let total_length = await Competition.find({c_state: {$ne: 0}}).countDocuments();
        let total_pages = Math.ceil(total_length / page_rows);
        let competitions = await Competition.aggregate([
            {$match: {c_state: {$ne: 0}}},
            { $lookup:
                    {
                        from: 'organizers',
                        localField: 'c_organizer_id',
                        foreignField: 'id',
                        as: 'organizer'
                    }
            }
        ]).sort({c_order: 1}).limit(page_rows);
        let provinces = await Competition.aggregate([
            {
                $group: {
                    _id: '$c_province',
                    count: {$sum: 1}
                }
            }
        ]);
        let cities = await Competition.aggregate([
            {
                $group: {
                    _id: '$c_city',
                    count: {$sum: 1}
                }
            }
        ]);
        if (!competitions) return res.render('admin/competitions',
            {
                title: '',
                session: req.session,
                competitions: [],
                provinces: [],
                cities: [],
                pages: 1,
            });
        return res.render('admin/competitions',
            {
                title: '',
                session: req.session,
                competitions: competitions,
                pages: total_pages,
                provinces: provinces,
                cities: cities,
                current: 1,
            });
    },
    change_competition_order: async function (req, res, next) {
        let c_id = req.body.c_id;
        let cItem = await Competition.findOne({id: c_id});
        if (!cItem) return res.send({status: 'fail', message: ''});
        let c_order = cItem.c_order === 1 ? 2 : 1;
        await cItem.updateOne({c_order: c_order});
        return res.send({status: 'success', message: '操作成功'});
    },
    feedback_manage: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if (req.session.user.role !== 0) return res.render('404', {});
        let page_rows = 10;
        let total_length = await Feedback.find({}).countDocuments();
        let total_pages = Math.ceil(total_length / page_rows);
        let feedbacks = await Feedback.find({}).sort({state: 1}).limit(page_rows);
        if (!feedbacks) return res.render('admin/feedback', {
            title: '',
            session: req.session,
            feedbacks: [],
            pages: 1,
        });
        return res.render('admin/feedback', {
            title: '',
            session: req.session,
            feedbacks: feedbacks,
            pages: total_pages,
            current: 1,
        })
    },
    change_feedback_state: async function (req, res, next) {
        let ids = req.body.ids;
        console.log(ids);
        await Feedback.updateMany({id: {$in: ids}}, {$set: {state: 2}});
        return res.send({status: 'success', message: '操作成功'});
    }
});

