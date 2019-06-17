let BaseController = require('./BaseController');
const fs = require('fs');
const path = require('path');
let config = require('../config')();
const Province = require('../models/Province');
const City = require('../models/City');
const Organizer = require('../models/Organizer');
let User = require('../models/User');
const Competition = require('../models/Competition');
const Place = require('../models/Place');
const Advertise = require('../models/Advertise');
const Vote = require('../models/Vote');
const Voting = require('../models/Voting');
const Applying = require('../models/Applying');
const Feedback = require('../models/Feedback');
const Game = require('../models/Game');
const Team = require('../models/Team');
const Member = require('../models/Member');
let Transaction = require('../models/Transaction');
let Notification = require('../models/Notification');

module.exports = BaseController.extend({
    name: "OrganizerController",
    index: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if (req.session.user.role === 0) return res.redirect('/admin-competition');
        if (req.session.user.role !== 1) return res.render('404', {});
        if (req.session.organizer.disabledState) return res.redirect('/logout');

        let page_rows = 10;
        let organizerID = req.session.organizer.id;
        let total_length = await Competition.find({c_organizer_id: organizerID, c_state: {$ne: 0}}).countDocuments();
        let total_pages = Math.ceil(total_length / page_rows);
        let competitions = await Competition.find({c_organizer_id: organizerID, c_state: {$ne: 0}}).limit(page_rows);
        if (!competitions) competitions = [];
        let provinces = await Province.find({});
        let cities = await City.find({});

        res.render('organizer/home', {
            title: '',
            session: req.session,
            competitions: competitions,
            provinces: provinces,
            cities: cities,
            pages: total_pages,
            current: 1
        })
    },
    // change is_published of competition
    change_competition_state: async function (req, res, next) {
        let is_published = req.body.is_published;
        let c_id = req.body.c_id;
        let c_item = await Competition.findOne({id: c_id});
        if (!c_item) return res.send({status: 'fail', message: '操作失败'});
        await c_item.updateOne({is_published: is_published});
        return res.send({status: 'success', message: "操作成功"});
    },
    add_competition: async function (req, res, next) {
        let that = this;
        if (!req.session.login) return res.redirect('/login');
        if (req.session.user.role !== 1) return res.render('404', {});
        if (req.session.organizer.disabledState) return res.redirect('/logout');

        let user_id = req.session.organizer.id;
        let public_path = path.resolve('public');
        let userFolderPath = public_path + "/uploads/" + user_id;
        let provinces = await Province.find({}).sort({order: 1});
        let cities = await City.find({province_id: '230000'}).sort({order: 1});
        let all_competitions = await Competition.find({c_organizer_id: user_id});

        if (req.method === 'POST') {
            if (!fs.existsSync(userFolderPath)) {
                fs.mkdirSync(userFolderPath);
            }
            let logo_image_path = '';
            let milliseconds = new Date().getTime().toString();
            if (req.body.c_logo.length > 1000) {
                let logoImgData = req.body.c_logo.replace(/^data:image\/\w+;base64,/, "");
                let file_extension = '.png';
                if (logoImgData.charAt(0) === '/') file_extension = '.jpg';
                else if (logoImgData.charAt(0) === 'R') file_extension = '.gif';
                let logo_image_upload_path = userFolderPath + "/logo_" + milliseconds + file_extension;
                logo_image_path = "/uploads/" + user_id + "/logo_" + milliseconds + file_extension;
                fs.writeFileSync(logo_image_upload_path, logoImgData, 'base64');
            } else {
                logo_image_path = req.body.c_logo;
            }
            let intro_images = req.body.c_helper_images;
            let c_helper_images = [];
            if (intro_images) {
                for (let intro_index = 0; intro_index < intro_images.length; intro_index++) {
                    let intro_image_path = '';
                    if (intro_images[intro_index].length > 1000) {
                        let introImgData = intro_images[intro_index].replace(/^data:image\/\w+;base64,/, "");
                        let file_extension = '.png';
                        if (introImgData.charAt(0) === '/') file_extension = '.jpg';
                        else if (introImgData.charAt(0) === 'R') file_extension = '.gif';
                        let intro_file_name = "/intro" + intro_index.toString() + "_" + milliseconds + file_extension;
                        let intro_image_upload_path = userFolderPath + intro_file_name;
                        intro_image_path = "/uploads/" + user_id + intro_file_name;
                        fs.writeFileSync(intro_image_upload_path, introImgData, 'base64');
                        c_helper_images.push(intro_image_path);
                    } else c_helper_images.push(intro_images[intro_index]);
                }
            }
            let province = await Province.findOne({province_id: req.body.c_province});
            let city = await City.findOne({city_id: req.body.c_city});
            let c_intro_competition = JSON.stringify(req.body.c_intro_competition);
            let c_intro_progress = JSON.stringify(req.body.c_intro_progress);
            let c_intro_helper = JSON.stringify(req.body.c_intro_helper);
            let data = {
                c_organizer_id: user_id,
                c_logo: logo_image_path,
                c_active_type: req.body.c_active_type,  // 1: 足球
                c_name: req.body.c_name,
                c_system: req.body.c_system,  // competition system(how many persons will be added)
                c_season: req.body.c_season,
                c_type: req.body.c_type,     // 1: league(single), 2: league(double), 3: group(single), 4: group(double), 5: cup
                c_start_time: req.body.c_start_time,
                c_end_time: req.body.c_end_time,
                c_applying_start_time: req.body.c_applying_start_time,
                c_applying_end_time: req.body.c_applying_end_time,
                c_fee: req.body.c_fee,
                c_payment_type: req.body.c_payment_type,  // 1: wechat payment, 2: offline payment
                c_place: req.body.c_place,
                c_province: province,
                c_city: city,
                c_organizer: req.body.c_organizer || [],
                c_organizer_phone: req.body.c_organizer_phone,
                c_manager: req.body.c_manager || [],
                c_cooperator: req.body.c_cooperator || [],
                c_helper: req.body.c_helper || [],
                c_helper_images: c_helper_images,
                c_intro_competition: c_intro_competition,
                c_intro_progress: c_intro_progress,
                c_intro_helper: c_intro_helper,
                is_published: req.body.is_published,  // 1: un-publish 2: publish
                c_order: 2,
                c_state: 1,
                created_at: that._utc_to_local(new Date()),
                updated_at: that._utc_to_local(new Date()),
            };
            let newCompetition = new Competition(data);
            await newCompetition.save();
            if (req.body.c_place) {
                let checkPlace = await Place.findOne({place: req.body.c_place});
                if (!checkPlace) {
                    let newPlace = new Place({
                        organizer_id: user_id,
                        place: req.body.c_place,
                        state: 2
                    });
                    await newPlace.save();
                }
            }
            return res.send({status: 'success', message: '成功'});
        }
        return res.render('organizer/competition', {
            title: '/ 新增赛事',
            session: req.session,
            provinces: provinces,
            cities: cities,
            all_competitions: all_competitions,
            isEdit: false
        })
    },
    edit_competition: async function (req, res, next) {
        let that = this;
        if (!req.session.login) return res.redirect('/login');
        if(req.params.u_id){
            req.session.organizer = await Organizer.findOne({id: req.params.u_id});
        }
        if (req.session.organizer.role !== 1) return res.render('404', {});
        if (req.session.user.role === 1 && req.session.organizer.disabledState) return res.redirect('/logout');

        let user_id = req.session.organizer.id;
        let public_path = path.resolve('public');
        let userFolderPath = public_path + "/uploads/" + user_id;
        let competition = await Competition.findOne({id: req.params.id});
        let all_competitions = await Competition.find({c_organizer_id: user_id});
        if (req.method === 'POST' && !competition) return res.send({status: 'fail', message: '未知的赛事'});
        if (!competition) return res.render('404', {});
        let provinces = await Province.find({}).sort({order: 1});
        let cities = await City.find({province_id: competition.c_province.province_id});
        if (req.method === 'POST') {
            let prev_c_type = competition.c_type;
            let post_c_type = req.body.c_type;
            if (prev_c_type != post_c_type) {
                console.log('remove prev games all');
                await that.remove_all_games(competition.id);
            }
            let logo_image_path = competition.c_logo;
            if (req.body.c_logo.length > 1000) {
                // let logoImgData = req.body.c_logo.replace(/^data:image\/png;base64,/, "");
                let logoImgData = req.body.c_logo.replace(/^data:image\/\w+;base64,/, "");
                let file_extension = '.png';
                if (logoImgData.charAt(0) === '/') file_extension = '.jpg';
                else if (logoImgData.charAt(0) === 'R') file_extension = '.gif';
                let milliseconds = new Date().getTime().toString();
                let logo_image_upload_path = userFolderPath + "/logo_" + milliseconds + file_extension;
                logo_image_path = "/uploads/" + user_id + "/logo_" + milliseconds + file_extension;
                fs.writeFileSync(logo_image_upload_path, logoImgData, 'base64');
            }
            let intro_images = req.body.c_helper_images;
            let c_helper_images = [];
            let milliseconds = new Date().getTime().toString();
            if (intro_images) {
                for (let intro_index = 0; intro_index < intro_images.length; intro_index++) {
                    if (intro_images[intro_index].length > 1000) {
                        let introImgData = intro_images[intro_index].replace(/^data:image\/\w+;base64,/, "");
                        let file_extension = '.png';
                        if (introImgData.charAt(0) === '/') file_extension = '.jpg';
                        else if (introImgData.charAt(0) === 'R') file_extension = '.gif';
                        let intro_file_name = "/intro" + intro_index.toString() + "_" + milliseconds + file_extension;
                        let intro_image_upload_path = userFolderPath + intro_file_name;
                        let intro_image_path = "/uploads/" + user_id + intro_file_name;
                        fs.writeFileSync(intro_image_upload_path, introImgData, 'base64');
                        c_helper_images.push(intro_image_path);
                    } else {
                        c_helper_images.push(intro_images[intro_index]);
                    }
                }
            }
            let province = await Province.findOne({province_id: req.body.c_province});
            let city = await City.findOne({city_id: req.body.c_city});
            let c_intro_competition = JSON.stringify(req.body.c_intro_competition);
            let c_intro_progress = JSON.stringify(req.body.c_intro_progress);
            let c_intro_helper = JSON.stringify(req.body.c_intro_helper);
            await competition.updateOne({
                c_logo: logo_image_path,
                c_active_type: req.body.c_active_type,  // 1: 足球
                c_name: req.body.c_name,
                c_system: req.body.c_system,  // competition system(how many persons will be added)
                c_season: req.body.c_season,
                c_type: req.body.c_type,     // 1: league(single), 2: league(double), 3: group(single), 4: group(double), 5: cup
                c_start_time: req.body.c_start_time,
                c_end_time: req.body.c_end_time,
                c_applying_start_time: req.body.c_applying_start_time,
                c_applying_end_time: req.body.c_applying_end_time,
                c_fee: req.body.c_fee,
                c_payment_type: req.body.c_payment_type,  // 1: wechat payment, 2: offline payment
                c_place: req.body.c_place,
                c_province: province,
                c_city: city,
                c_organizer: req.body.c_organizer || [],
                c_organizer_phone: req.body.c_organizer_phone,
                c_manager: req.body.c_manager || [],
                c_cooperator: req.body.c_cooperator || [],
                c_helper: req.body.c_helper || [],
                c_helper_images: c_helper_images,
                c_intro_competition: c_intro_competition,
                c_intro_progress: c_intro_progress,
                c_intro_helper: c_intro_helper,
                is_published: req.body.is_published,  // 1: un-publish 2: publish
                updated_at: that._utc_to_local(new Date()),
            });
            if (req.body.c_place) {
                let checkPlace = await Place.findOne({place: req.body.c_place});
                if (!checkPlace) {
                    let newPlace = new Place({
                        organizer_id: user_id,
                        place: req.body.c_place,
                        state: 2
                    });
                    await newPlace.save();
                }
            }
            return res.send({status: 'success', message: '更新成功'});
        }
        return res.render('organizer/competition', {
            title: '/ 编辑赛事',
            session: req.session,
            provinces: provinces,
            cities: cities,
            all_competitions: all_competitions,
            competition: competition,
            isEdit: true
        })
    },
    delete_competition: async function (req, res, next) {
        console.log("delete competition ...");
        if (!req.session.login) return res.send({status: 'fail', message: '你没有登录'});
        if (req.session.user.role !== 0 && req.session.user.role !== 1) return res.send({status: 'fail', message: '未定义的用户!'});
        if (req.session.user.role === 1 && req.session.organizer.disabledState) return res.redirect('/logout');

        let that = this;
        let c_id = req.body.c_id;
        let competition = await Competition.findOne({id: c_id, c_state: {$ne: 0}});
        if (!competition) return res.send({status: 'fail', message: 'Unknown Competition'});
        let c_start_date = competition.c_start_time;
        let c_split = c_start_date.split('-');
        let current_time = that._utc_to_local(new Date()).getTime();
        let c_time = new Date(c_split[0], parseInt(c_split[1])-1, c_split[2]).getTime();

        let applies = await Applying.find({competition_id: c_id, a_state: {$in: [1, 2]}});
        for (let i = 0; i < applies.length; i++) {
            let apply = applies[i];
            let teams = await Team.aggregate([
                {$match: {id: applies[i].team_id}},

                {
                    $lookup: {
                        from: 'members',
                        let: {'pid': '$t_members'},
                        pipeline: [
                            {'$match': {'$expr': {'$in': ['$id', '$$pid']}}}
                        ],
                        as: 'members'
                    }
                }
            ]);
            let amount = applies[i].online_pay_price;
            if (current_time < c_time && amount > 0) {
                let out_refund_no = config.payment_config.mchid + Date.now();
                let out_trade_no = applies[i].out_trade_no;
                let refund_data = {
                    out_trade_no: out_trade_no,
                    out_refund_no: out_refund_no,
                    total_fee: amount * 100,
                    refund_fee: amount * 100
                };
                console.log(refund_data);
                let refund_res = await that.weixin_refund(refund_data);
                if (refund_res.result_code === 'SUCCESS' && refund_res.return_code === 'SUCCESS') {
                    let transItem = new Transaction({
                        user: applies[i].user_id,
                        amount: amount,
                        type: 2,
                        competition_id: applies[i].competition_id,
                        apply_id: applies[i].id,
                        created_at: that._utc_to_local(new Date()),
                        updated_at: that._utc_to_local(new Date()),
                    });
                    await transItem.save();
                    let organizer = await Organizer.findOne({id: competition.c_organizer_id});
                    let organizer_wallet = organizer.amount_pending - amount;
                    await organizer.updateOne({amount_pending: organizer_wallet});
                    // notification for delete competition
                    let n_content = '赛事主办方取消了' + competition.c_name + '，报名费用已原路返还，请注意查看您的微信钱包，如有疑问，请联系主办方';
                    let notification_data = {
                        n_type: 10,
                        n_title: '赛事取消消息',
                        n_content: n_content,
                        n_receiver: apply.user_id,
                        n_state: 1,
                        created_at: that._utc_to_local(new Date()),
                        updated_at: that._utc_to_local(new Date()),
                    };
                    console.log("delete competition notification: ", notification_data);
                    let notification_item = new Notification(notification_data);
                    await notification_item.save();
                }
            } else {
                // notification for delete competition
                let n_content = '赛事主办方取消了' + competition.c_name + '，如有疑问，请联系主办方';
                let notification_data = {
                    n_type: 10,
                    n_title: '赛事取消消息',
                    n_content: n_content,
                    n_receiver: apply.user_id,
                    n_state: 1,
                    created_at: that._utc_to_local(new Date()),
                    updated_at: that._utc_to_local(new Date()),
                };
                console.log("delete competition notification: ", notification_data);
                let notification_item = new Notification(notification_data);
                await notification_item.save();
            }
            for (let j = 0; j < teams.length; j++) {
                let team = teams[j];
                let members = team.members;
                for (let k = 0; k < members.length; k++) {
                    if (members[k].m_state !== 0) {
                        // notification for delete competition
                        let n_content = '赛事主办方取消了' + team.t_full_name + '，如有疑问，请联系主办方';
                        let notification_data = {
                            n_type: 14,
                            n_title: '赛事取消消息',
                            n_content: n_content,
                            n_receiver: members[k].user_id,
                            n_state: 1,
                            created_at: this._utc_to_local(new Date()),
                            updated_at: this._utc_to_local(new Date()),
                        };
                        console.log("delete competition notification: ", notification_data);
                        let notification_item = new Notification(notification_data);
                        await notification_item.save();
                    }
                }
                // release team to non - used
                await Team.updateOne({id: team.id}, {$set: {t_state: 1}});
            }
        }
        await competition.updateOne({c_state: 0});
        return res.send({status: 'success', message: '操作成功'});
    },
    applying: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if(req.params.u_id){
            req.session.organizer = await Organizer.findOne({id: req.params.u_id});
        }
        if (req.session.organizer.role !== 1) return res.render('404', {});
        if (req.session.user.role === 1 && req.session.organizer.disabledState) return res.redirect('/logout');

        let c_id = req.params.id;
        let competition = await Competition.findOne({id: c_id});
        let total_len = await Applying.find({competition_id: c_id, a_state: {$in: [1, 2, 3]}}).countDocuments();
        let pending_len = await Applying.find({competition_id: c_id, a_state: 1}).countDocuments();
        let pass_len = await Applying.find({competition_id: c_id, a_state: 2}).countDocuments();
        let non_pass_len = await Applying.find({competition_id: c_id, a_state: 3}).countDocuments();
        let applies = await Applying.aggregate([
            {$match: {competition_id: c_id, a_state: {$in: [1, 2, 3]}}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'team_id',
                    foreignField: 'id',
                    as: 'team'
                }
            }
        ]).sort({a_state: 1, created_at: -1});
        return res.render('organizer/applying', {
            title: ' - 报名管理—俱乐部',
            session: req.session,
            total_len: total_len,
            pending_len: pending_len,
            pass_len: pass_len,
            non_pass_len: non_pass_len,
            applies: applies,
            competition: competition
        })
    },
    applying_edit: async function (req, res, next) {
        let that = this;
        if (!req.session.login) return res.redirect('/login');
        if (req.session.organizer.role !== 1) return res.render('404', {});

        let a_id = req.params.id;
        let apply_item = await Applying.aggregate([
            {$match: {id: a_id}},
            {
                $lookup: {
                    from: 'competitions',
                    localField: 'competition_id',
                    foreignField: 'id',
                    as: 'competition'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'team_id',
                    foreignField: 'id',
                    as: 'team'
                }
            },
            {$unwind: '$competition'},
            {$unwind: '$team'},
            {
                '$lookup': {
                    'from': 'members',
                    'let': {'pid': '$team.t_members'},
                    'pipeline': [
                        {'$match': {'$expr': {'$in': ['$id', '$$pid']}}}
                    ],
                    'as': 'members'
                }
            }
        ]);
        // console.log(apply);
        if (!apply_item) return res.render('404', {});
        if (req.method === 'POST') {
            let apply = await Applying.findOne({id: req.body.a_id});
            if (!apply) return res.send({status: 'fail', message: '操作失败'});
            let competition = await Competition.findOne({id: apply.competition_id});
            if (!competition) return res.send({status: 'fail', message: '退款失败'});
            let a_state = req.body.a_state;
            let data = {};
            if (a_state === 'true') {
                data = {a_state: 2, updated_at: that._utc_to_local(new Date())};
                await apply.updateOne(data);
                // notification for applying success
                let n_content = '您已经成功报名' + apply_item[0].competition.c_name;
                let notification_data = {
                    n_type: 7,
                    n_title: '赛事报名成功',
                    n_content: n_content,
                    n_receiver: apply.user_id,
                    n_state: 1,
                    created_at: this._utc_to_local(new Date()),
                    updated_at: this._utc_to_local(new Date()),
                };
                console.log("applying success notification: ", notification_data);
                let notification_item = new Notification(notification_data);
                await notification_item.save();
            } else {
                if (apply.online_pay_price !== 0) {
                    let out_refund_no = config.payment_config.mchid + Date.now();
                    let out_trade_no = apply.out_trade_no;
                    let amount = apply.online_pay_price;
                    let refund_data = {
                        out_trade_no: out_trade_no,
                        out_refund_no: out_refund_no,
                        total_fee: amount * 100,
                        refund_fee: amount * 100
                    };
                    let refund_res = await this.weixin_refund(refund_data);
                    data = {a_state: 3, a_reason: req.body.a_reason, out_refund_no: out_refund_no, pay_state: 2,
                        updated_at: that._utc_to_local(new Date())};
                    if (refund_res.result_code === 'SUCCESS' && refund_res.return_code === 'SUCCESS') {
                        await apply.updateOne(data);
                        console.log('refund success -> update applying data ....');
                        let transItem = new Transaction({
                            user: apply.user_id,
                            amount: amount,
                            type: 2,
                            competition_id: apply.competition_id,
                            apply_id: apply.id,
                            created_at: that._utc_to_local(new Date()),
                            updated_at: that._utc_to_local(new Date()),
                        });
                        await transItem.save();
                        // update user wallet

                        let organizer = await Organizer.findOne({id: competition.c_organizer_id});
                        let organizer_wallet = organizer.amount_pending - amount;
                        await organizer.updateOne({amount_pending: organizer_wallet});
                    }
                } else {
                    data = {a_state: 3, a_reason: req.body.a_reason, pay_state: 2, updated_at: that._utc_to_local(new Date())};
                    await apply.updateOne(data);
                }
                await Team.updateOne({id: apply.team_id}, {$set: {t_state: 1}});
                // notification for applying success
                let n_content = '很抱歉，您报名的' + competition.c_name +'，没有通过主办方审核，原因是' + data.a_reason;
                let notification_data = {
                    n_type: 8,
                    n_title: '赛事报名未通过审核',
                    n_content: n_content,
                    n_receiver: apply.user_id,
                    n_state: 1,
                    created_at: this._utc_to_local(new Date()),
                    updated_at: this._utc_to_local(new Date()),
                };
                console.log("applying success notification: ", notification_data);
                let notification_item = new Notification(notification_data);
                await notification_item.save();
            }
            return res.send({status: 'success', message: '操作成功'});
        } else {
            return res.render('organizer/applying_edit', {
                title: ' - 报名管理—俱乐部',
                session: req.session,
                apply: apply_item[0],
            })
        }
    },
    cancel_applying: async function (req, res, next) {
        if (!req.session.login) return res.send({status: 'fail', message: '你没有登录'});
        if (req.session.organizer.role !== 1) return res.send({status: 'fail', message: '未定义的用户!'});

        let that = this;
        let a_id = req.body.a_id;
        let apply = await Applying.findOne({id: a_id, a_state: {$in: [1, 2]}});
        if (!apply) return res.send({status: 'fail', message: 'Unknown Apply'});
        let team = await Team.findOne({id: apply.team_id});
        let competition = await Competition.findOne({id: apply.competition_id});
        let c_start_date = competition.c_start_time;
        let c_split = c_start_date.split('-');
        let current_time = that._utc_to_local(new Date()).getTime();
        let c_time = new Date(c_split[0], parseInt(c_split[1])-1, c_split[2]).getTime();
        console.log("current_time: ", current_time);
        console.log("c_time: ", c_time);
        if (current_time < c_time && competition.c_payment_type === 1 && competition.c_fee !== 0) {
            let out_refund_no = config.payment_config.mchid + Date.now();
            let out_trade_no = apply.out_trade_no;
            let amount = apply.online_pay_price;
            let refund_data = {
                out_trade_no: out_trade_no,
                out_refund_no: out_refund_no,
                total_fee: amount * 100,
                refund_fee: amount * 100
            };
            let refund_res = await this.weixin_refund(refund_data);
            if (refund_res.result_code === 'SUCCESS' && refund_res.return_code === 'SUCCESS') {
                let data = {a_state: 0, a_reason: '取消报名', out_refund_no: out_refund_no, pay_state: 2, updated_at: that._utc_to_local(new Date())};
                await apply.updateOne(data);
                console.log('refund success -> update applying data ....');
                let transItem = new Transaction({
                    user: apply.user_id,
                    amount: amount,
                    type: 2,
                    competition_id: apply.competition_id,
                    apply_id: apply.id,
                    created_at: that._utc_to_local(new Date()),
                    updated_at: that._utc_to_local(new Date()),
                });
                await transItem.save();
                // update user wallet
                let organizer = await Organizer.findOne({id: competition.c_organizer_id});
                let organizer_wallet = organizer.amount_pending - amount;
                await organizer.updateOne({amount_pending: organizer_wallet});
                // notification for applying success
                let n_content = '很抱歉，' + competition.c_name + '的赛事主办方取消了您的报名，报名费用已原路返还，请注意查看您的微信钱包，如有疑问，请联系主办方';
                let notification_data = {
                    n_type: 9,
                    n_title: '赛事报名取消消息',
                    n_content: n_content,
                    n_receiver: team.user_id,
                    n_state: 1,
                    created_at: this._utc_to_local(new Date()),
                    updated_at: this._utc_to_local(new Date()),
                };
                console.log("applying cancel notification: ", notification_data);
                let notification_item = new Notification(notification_data);
                await notification_item.save();
            } else {
                return res.send({status: 'fail', message: '退款失败'});
            }
        } else {
            await apply.updateOne({a_state: 0, pay_state: 2, updated_at: that._utc_to_local(new Date())});
            // notification for cancel applying
            let n_content = '很抱歉，' + competition.c_name + '的赛事主办方取消了您的报名，如有疑问，请联系主办方';
            let notification_data = {
                n_type: 9,
                n_title: '赛事报名取消消息',
                n_content: n_content,
                n_receiver: team.user_id,
                n_state: 1,
                created_at: this._utc_to_local(new Date()),
                updated_at: this._utc_to_local(new Date()),
            };
            console.log("applying cancel notification: ", notification_data);
            let notification_item = new Notification(notification_data);
            await notification_item.save();
        }
        await team.updateOne({t_state: 1});
        for (let i = 0; i < team.t_members.length; i++) {
            let member = await Member.findOne({id: team.t_members[i]});
            if (member && member.m_state !== 0) {
                // notification for applying success
                let n_content = '很抱歉，' + competition.c_name + '的赛事主办方取消了您的报名，如有疑问，请联系主办方';
                let notification_data = {
                    n_type: 13,
                    n_title: '赛事报名取消消息',
                    n_content: n_content,
                    n_receiver: member.user_id,
                    n_state: 1,
                    created_at: this._utc_to_local(new Date()),
                    updated_at: this._utc_to_local(new Date()),
                };
                console.log("applying cancel notification: ", notification_data);
                let notification_item = new Notification(notification_data);
                await notification_item.save();
            }
        }
        return res.send({status: 'success', message: '操作成功'});
    },
    game_management: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if(req.params.u_id){
            req.session.organizer = await Organizer.findOne({id: req.params.u_id});
        }
        if (req.session.organizer.role !== 1) return res.render('404', {});
        if (req.session.user.role === 1 && req.session.organizer.disabledState) return res.redirect('/logout');

        let organizerID = req.session.organizer.id;
        let c_id = req.params.id;
        let competition = await Competition.findOne({id: c_id});
        let sort_queries = {};
        if (competition.c_type === 3 || competition.c_type === 4) sort_queries = {group_name: 1, g_round: 1};
        else if (competition.c_type === 1 || competition.c_type === 2) sort_queries = {g_round: 1};
        else if (competition.c_type === 5) sort_queries = {g_stage_order: 1};
        let games = await Game.aggregate([
            {$match: {competition_id: c_id, g_state: {$ne: 0}}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team1',
                    foreignField: 'id',
                    as: 'team1'
                }
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "g_team2",
                    foreignField: "id",
                    as: "team2"
                }
            },
            {$unwind: "$team1"},
            {$unwind: "$team2"}
        ]).sort(sort_queries);
        let applied_teams = await Applying.aggregate([
            {$match: {competition_id: c_id, a_state: 2}},
            {
                $lookup: {
                    from: "teams",
                    localField: "team_id",
                    foreignField: "id",
                    as: "team"
                }
            },
            {$unwind: "$team"}
        ]);
        let places = await Place.find({organizer_id: organizerID, state: 2});
        return res.render('organizer/games', {
            title: ' - 比赛管理',
            session: req.session,
            competition: competition,
            games: games,
            applied_teams: applied_teams,
            team_groups: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'],
            places: places,
        })
    },
    add_games: async function (req, res, next) {
        if (!req.session.login) return res.send({status: 'fail', message: '操作失败'});
        if (req.session.organizer.role !== 1) return res.send({status: 'fail', message: '操作失败'});

        let organizerID = req.session.organizer.id;
        let c_id = req.params.id;
        let g_type = parseInt(req.body.g_type);
        if (g_type === 2) {
            let g_team_ids = req.body.g_team_ids;
            let g_team_group_names = req.body.g_team_group_names;
            if (g_team_ids.length !== g_team_group_names.length) return res.send({status: 'fail', message: '未定义所有团队组名称'});
            for (let g = 0; g < g_team_ids.length; g++) {
                await Team.updateOne({id: g_team_ids[g]}, {$set: {t_group_name: g_team_group_names[g]}});
            }
        }
        let games = JSON.parse(req.body.games);
        let prev_id_objs = await Game.aggregate([
            {$match: {competition_id: c_id, g_type: g_type, g_state: {$ne: 0}}},
            {
                $project: {
                    "id": 1,
                    "_id": 0
                }
            }
        ]);
        let prev_ids = [];
        for (let id_index = 0; id_index < prev_id_objs.length; id_index++) {
            prev_ids.push(prev_id_objs[id_index].id);
        }
        for (let i = 0; i < games.length; i++) {
            let data = {};
            let state_names = ['决赛', '半决赛', '1/4决赛', '1/8决赛', '1/16决赛', '1/32决赛', '1/64决赛', '1/128决赛'];
            let index = 0;
            let row_id = games[i][index];
            index++;
            if (g_type === 2) {
                data.group_name = games[i][index];
                index++;
            }
            if (g_type === 3) {
                data.g_stage = games[i][index];
                data.g_stage_order = state_names.indexOf(games[i][index]);
            } else {
                data.g_round = games[i][index];
            }
            data.g_date = games[i][index + 1];
            data.g_time = games[i][index + 2];
            // console.log(games[i][index+3]);
            let get_team1 = await Team.findOne({t_full_name: games[i][index + 3]});
            if (!get_team1) return res.send({status: 'fail', message: '未知的主队'});
            data.g_team1 = get_team1.id;
            if (games[i][index + 4] === "") {
                data.team1_total_score = "";
                data.team2_total_score = "";
                data.team1_sub_score = "";
                data.team2_sub_score = "";
            } else {
                let scores = JSON.parse(games[i][index + 4]);
                data.team1_total_score = scores[0];
                data.team2_total_score = scores[1];
                data.team1_sub_score = scores[2];
                data.team2_sub_score = scores[3];
            }
            let get_team2 = await Team.findOne({t_full_name: games[i][index + 5]});
            if (!get_team2) return res.send({status: 'fail', message: '未知的客队'});
            data.g_team2 = get_team2.id;
            data.g_place = games[i][index + 6];
            // check and add new place
            let post_place = games[i][index + 6];
            if (post_place !== "") {
                let check_place = await Place.findOne({organizer_id: organizerID, place: post_place});
                if (!check_place) {
                    let new_post_place = new Place({
                        organizer_id: organizerID,
                        place: post_place,
                        state: 2
                    });
                    await new_post_place.save();
                }
            }
            if (games[i][index + 7] === "") data.team_structure = [];
            else data.team_structure = JSON.parse(games[i][index + 7]);
            if (games[i][index + 8] === "") data.g_situation = [];
            else data.g_situation = JSON.parse(games[i][index + 8]);
            data.g_state = ['未开赛', '待更新结果', '已结束'].indexOf(games[i][index + 9]) + 1;
            data.g_stream = games[i][index + 10];
            data.g_type = g_type;
            data.competition_id = c_id;
            if (prev_ids.indexOf(row_id) === -1) {
                // console.log("--------- game new data -----------------");
                // console.log(data);
                let new_game = new Game(data);
                await new_game.save();
            } else {
                // console.log("==== row id ===== :", row_id);
                // console.log(prev_ids);
                await Game.updateOne({id: row_id}, {$set: data});
                let id_index = prev_ids.indexOf(row_id);
                // console.log(id_index);
                prev_ids.splice(id_index, 1);
                // console.log(prev_ids)
            }
        }
        // for (let j = 0; j < prev_ids.length; j++) {
        //     await Game.updateOne({id: prev_ids[j]}, {$set: {g_state: 0}});
        // }
        await Game.deleteMany({id: {$in: prev_ids}});
        return res.send({status: 'success', message: '操作成功'});
    },
    ranking: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if(req.params.u_id){
            req.session.organizer = await Organizer.findOne({id: req.params.u_id});
        }
        if (req.session.organizer.role !== 1) return res.render('404', {});
        if (req.session.user.role === 1 && req.session.organizer.disabledState) return res.redirect('/logout');

        let c_id = req.params.id;
        let competition = await Competition.findOne({id: c_id});
        if (!competition || competition.c_type === 5) {
            if (req.params.u_id) return res.redirect('/admin-competition');
            else return res.redirect('/organizer');
        }
        let applied_teams = await Applying.aggregate([
            {$match: {competition_id: c_id, a_state: 2}},
            {
                $lookup: {
                    from: "teams",
                    localField: "team_id",
                    foreignField: "id",
                    as: "team"
                }
            },
            {$unwind: "$team"}
        ]);
        let applied_team_ids = [];
        let applied_team_names = [];
        for (let i = 0; i < applied_teams.length; i++) {
            applied_team_ids.push(applied_teams[i].team_id);
            applied_team_names.push(applied_teams[i].team.t_full_name);
        }
        let title = ' - 积分榜—联赛';
        if (competition.c_type === 3 || competition.c_type === 4) title = ' - 积分榜—小组赛';
        let rankings = [];
        // if (competition.c_ranking.length === 0) {
            if (competition.c_type === 1 || competition.c_type === 2) {
                let one_group = {group_name: 'none', group_data: []};
                for (let j = 0; j < applied_team_ids.length; j++) {
                    let ranking = {group_name: 'none'};
                    ranking.team_id = applied_team_ids[j];
                    let total_count = 0, win_count = 0, draw_count = 0, lose_count = 0, win_score = 0, lose_score = 0;
                    let games1 = await Game.aggregate([
                        {$match: {g_team1: applied_team_ids[j], g_state: 3, g_type: 1}}
                    ]);
                    let games2 = await Game.aggregate([
                        {$match: {g_team2: applied_team_ids[j], g_state: 3, g_type: 1}}
                    ]);
                    if (games1.length === 0 && games2.length === 0) continue;
                    for (let k = 0; k < games1.length; k++) {
                        if (games1[k].team1_total_score == null || games1[k].team2_total_score == null) continue;
                        if (games1[k].team1_total_score > games1[k].team2_total_score) win_count += 1;
                        else if (games1[k].team1_total_score < games1[k].team2_total_score) lose_count += 1;
                        else if (games1[k].team1_total_score === games1[k].team2_total_score) draw_count += 1;
                        win_score += parseInt(games1[k].team1_total_score);
                        lose_score += parseInt(games1[k].team2_total_score);
                        total_count += 1;
                    }
                    for (let k = 0; k < games2.length; k++) {
                        if (games2[k].team1_total_score == null || games2[k].team1_total_score === undefined
                            || games2[k].team2_total_score == null || games2[k].team2_total_score === undefined) continue;
                        if (games2[k].team1_total_score < games2[k].team2_total_score) win_count += 1;
                        else if (games2[k].team1_total_score > games2[k].team2_total_score) lose_count += 1;
                        else if (games2[k].team1_total_score === games2[k].team2_total_score) draw_count += 1;
                        win_score += parseInt(games2[k].team2_total_score);
                        lose_score += parseInt(games2[k].team1_total_score);
                        total_count += 1;
                    }
                    ranking.total_count = total_count;
                    ranking.win_count = win_count;
                    ranking.draw_count = draw_count;
                    ranking.lose_count = lose_count;
                    ranking.win_score = win_score;
                    ranking.lose_score = lose_score;
                    one_group.group_data.push(ranking);
                }
                rankings.push(one_group);
            } else if (competition.c_type === 3 || competition.c_type === 4) {
                let game_groups = await Game.aggregate([
                    {$match: {competition_id: c_id, g_state: {$in: [1, 2, 3]}, g_type: 2}},
                    {
                        $group: {
                            _id: '$group_name',
                            games: {$push: '$$ROOT'}
                        }
                    }
                ]);
                for (let k = 0; k < game_groups.length; k++) {
                    let group_name = game_groups[k]._id;
                    let group_games = game_groups[k].games;
                    if (group_games.length === 0) continue;
                    let group_team_ids = [];
                    let group_ranking = {group_name: group_name, group_data: []};
                    for (let i = 0; i < group_games.length; i++) {
                        let game = group_games[i];
                        if (game.team1_total_score == null || game.team2_total_score == null) continue;
                        let index1 = group_team_ids.indexOf(game.g_team1);
                        let index2 = group_team_ids.indexOf(game.g_team2);
                        if (index1 === -1) {
                            group_team_ids.push(game.g_team1);
                            let new_ranking1 = {
                                group_name: group_name, team_id: game.g_team1, total_count: 1, win_count: 0, draw_count: 0,
                                lose_count: 0, win_score: game.team1_total_score, lose_score: game.team2_total_score
                            };
                            if (game.team1_total_score > game.team2_total_score) new_ranking1.win_count = 1;
                            else if (game.team1_total_score < game.team2_total_score) new_ranking1.lose_count = 1;
                            else if (game.team1_total_score === game.team2_total_score) new_ranking1.draw_count = 1;
                            group_ranking.group_data.push(new_ranking1);
                        } else {
                            group_ranking.group_data[index1].win_score += game.team1_total_score;
                            group_ranking.group_data[index1].lose_score += game.team2_total_score;
                            group_ranking.group_data[index1].total_count += 1;
                            if (game.team1_total_score > game.team2_total_score) group_ranking.group_data[index1].win_count += 1;
                            else if (game.team1_total_score < game.team2_total_score) group_ranking.group_data[index1].lose_count += 1;
                            else if (game.team1_total_score === game.team2_total_score) group_ranking.group_data[index1].draw_count += 1;
                        }
                        if (index2 === -1) {
                            group_team_ids.push(game.g_team2);
                            let new_ranking2 = {
                                group_name: group_name, team_id: game.g_team2, total_count: 1, win_count: 0, draw_count: 0,
                                lose_count: 0, win_score: game.team2_total_score, lose_score: game.team1_total_score
                            };
                            if (game.team1_total_score < game.team2_total_score) new_ranking2.win_count = 1;
                            else if (game.team1_total_score > game.team2_total_score) new_ranking2.lose_count = 1;
                            else if (game.team1_total_score === game.team2_total_score) new_ranking2.draw_count = 1;
                            group_ranking.group_data.push(new_ranking2);
                        } else {
                            group_ranking.group_data[index2].win_score += game.team2_total_score;
                            group_ranking.group_data[index2].lose_score += game.team1_total_score;
                            group_ranking.group_data[index2].total_count += 1;
                            if (game.team1_total_score < game.team2_total_score) group_ranking.group_data[index2].win_count += 1;
                            else if (game.team1_total_score > game.team2_total_score) group_ranking.group_data[index2].lose_count += 1;
                            else if (game.team1_total_score === game.team2_total_score) group_ranking.group_data[index2].draw_count += 1;
                        }
                    }
                    rankings.push(group_ranking);
                }
            }
        // } else rankings = competition.c_ranking;

        for (let m = 0; m < rankings.length; m++) {
            for (let n = 0; n < rankings[m].group_data.length; n++) {
                let get_t_full_name = await Team.findOne({id: rankings[m].group_data[n].team_id});
                if (!get_t_full_name) continue;
                rankings[m].group_data[n].t_full_name = get_t_full_name.t_full_name;
            }
        }
        console.log(rankings);
        rankings = rankings.sort(function (a,b) {
            return a.group_name > b.group_name?1:-1;
        });
        return res.render('organizer/ranking', {
            title: title,
            session: req.session,
            competition: competition,
            rankings: rankings,
            applied_team_ids: applied_team_ids,
            applied_team_names: applied_team_names,
        })
    },
    add_ranking: async function (req, res, next) {
        let c_id = req.params.id;
        let competition = await Competition.findOne({id: c_id});
        if (!competition) return res.send({status: 'fail', message: '操作失败'});
        let id = parseInt(req.body.id);
        let table_data = req.body.table_data;
        let c_rankings = competition.c_ranking;
        c_rankings[id] = table_data;
        await competition.updateOne({c_ranking: c_rankings});
        return res.send({status: 'success', message: '操作成功'})
    },
    shooter: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if(req.params.u_id){
            req.session.organizer = await Organizer.findOne({id: req.params.u_id});
        }
        if (req.session.organizer.role !== 1) return res.render('404', {});
        if (req.session.user.role === 1 && req.session.organizer.disabledState) return res.redirect('/logout');

        let c_id = req.params.id;
        let competition = await Competition.findOne({id: c_id});
        if (!competition) return res.redirect('/organizer');

        let shooters = [];
        // make shooters data
        if (competition.c_shooter === undefined || competition.c_shooter.length === 0) {
            let matched_games = await Game.aggregate([
                {$match: {competition_id: c_id, g_state: 3}},
                {$project: {'g_situation': 1, '_id': 0}},
            ]);
            let all_situations = [];
            for (let i = 0; i < matched_games.length; i++) {
                all_situations.push(...matched_games[i].g_situation);
            }
            let s_member_ids = [];
            for (let j = 0; j < all_situations.length; j++) {
                let s_item = all_situations[j];
                let shooter_item = {};
                if (s_member_ids.indexOf(s_item[0]) === -1 && s_item[2] === '进球') {
                    shooter_item.m_id = s_item[0];
                    shooter_item.total_score = 1;
                    shooter_item.sub_score = 0;
                    s_member_ids.push(s_item[0]);
                    shooters.push(shooter_item);
                } else if (s_member_ids.indexOf(s_item[0]) === -1 && s_item[2] === '点球') {
                    shooter_item.m_id = s_item[0];
                    shooter_item.total_score = 0;
                    shooter_item.sub_score = 1;
                    s_member_ids.push(s_item[0]);
                    shooters.push(shooter_item);
                } else if (s_member_ids.indexOf(s_item[0]) !== -1 && s_item[2] === '进球') {
                    shooters[s_member_ids.indexOf(s_item[0])].total_score = shooters[s_member_ids.indexOf(s_item[0])].total_score + 1;
                } else if (s_member_ids.indexOf(s_item[0]) !== -1 && s_item[2] === '点球') {
                    shooters[s_member_ids.indexOf(s_item[0])].sub_score = shooters[s_member_ids.indexOf(s_item[0])].sub_score + 1;
                }
            }
        } else shooters = competition.c_shooter;
        let all_shooters = [];
        for (let k = 0; k < shooters.length; k++) {
            let member = await Member.aggregate([
                {$match: {id: shooters[k].m_id}},
                {
                    $lookup: {
                        from: 'teams',
                        localField: 'team_id',
                        foreignField: 'id',
                        as: 'team'
                    }
                },
                {$unwind: '$team'}
            ]);
            if (member.length === 0) continue;
            shooters[k].m_name = member[0].m_name;
            shooters[k].m_number = member[0].m_number;
            shooters[k].t_full_name = member[0].team.t_full_name;
            all_shooters.push(shooters[k]);
        }
        // make all member data
        let applied_teams = await Applying.aggregate([
            {$match: {competition_id: c_id, a_state: 2}},
            {
                $lookup: {
                    from: "teams",
                    localField: "team_id",
                    foreignField: "id",
                    as: "team"
                }
            },
            {$unwind: "$team"}
        ]);
        let total_members = [];  // included removed members
        for (let m = 0; m < applied_teams.length; m++) {
            let t_full_name = applied_teams[m].team.t_full_name;
            let t_members = applied_teams[m].team.t_members;
            for (let n = 0; n < t_members.length; n++) {
                let memberItem = {};
                memberItem.t_full_name = t_full_name;
                memberItem.m_id = t_members[n];
                let member = await Member.findOne({id: t_members[n]});
                if (!member || member.m_state === 3) continue;
                memberItem.m_name = member.m_name;
                memberItem.m_number = member.m_number;
                total_members.push(memberItem);
            }
        }
        // console.log(total_members);
        return res.render('organizer/shooter', {
            title: ' - 射手榜',
            session: req.session,
            competition: competition,
            shooters: all_shooters,
            total_members: total_members,
        })
    },
    add_shooter: async function (req, res, next) {
        if (!req.session.login) return res.send({status: 'fail', message: '未定义的用户！'});
        if (req.session.organizer.role !== 1) return res.send({status: 'fail', message: '未定义的用户！'});

        let c_id = req.body.competition_id;
        let competition = await Competition.findOne({id: c_id});
        if (!competition) return res.send({status: 'fail', message: '操作失败'});
        let shooter_array = req.body.shooter_array;
        await competition.updateOne({c_shooter: shooter_array});
        return res.send({status: 'success', message: '操作成功'});
    },
    advertise: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if(req.params.u_id){
            req.session.organizer = await Organizer.findOne({id: req.params.u_id});
        }
        if (req.session.organizer.role !== 1) return res.render('404', {});
        if (req.session.user.role === 1 && req.session.organizer.disabledState) return res.redirect('/logout');

        let c_id = req.params.id;
        let competition = await Competition.findOne({id: c_id});
        if (!competition) return res.redirect('/organizer');
        let page_rows = 10;
        let total_length = await Advertise.find({competition_id: c_id, ad_state: {$ne: 0}}).countDocuments();
        let total_pages = Math.ceil(total_length / page_rows);
        let advertises = await Advertise.find({competition_id: c_id, ad_state: {$ne: 0}}).limit(page_rows);
        if (!advertises) advertises = [];
        return res.render('organizer/advertise', {
            title: ' - 公告管理',
            session: req.session,
            competition: competition,
            advertises: advertises,
            pages: total_pages,
            current: 1
        })
    },
    advertise_add_delete: async function (req, res, next) {
        let that = this;
        if (!req.session.login) return res.redirect('/login');
        if (req.session.organizer.role !== 1) return res.render('404', {});

        let organizerID = req.session.organizer.id;
        let com_id = req.params.com_id;
        if (req.method === 'POST') {
            if (req.body.method_type === 'add') {
                let ad_intro = JSON.stringify(req.body.ad_intro);
                let newAdvertise = new Advertise({
                    organizer_id: organizerID,
                    ad_title: req.body.ad_title,
                    competition_id: req.body.c_id,
                    ad_poster_name: req.body.ad_poster_name,
                    ad_intro: ad_intro,
                    ad_post_time: this._utc_to_local(new Date()),
                    ad_state: 1,  // 1: un-publish, 2: publish
                    ad_read_count: 0,
                    created_at: that._utc_to_local(new Date()),
                    updated_at: that._utc_to_local(new Date()),
                });
                await newAdvertise.save();
                return res.send({status: 'success', message: '操作成功'});
            } else if (req.body.method_type === 'delete') {
                let ad_id = req.body.ad_id;
                let adItem = await Advertise.findOne({id: ad_id});
                if (!adItem) return res.send({status: 'fail', message: '操作失败'});
                await adItem.updateOne({ad_state: 0});
                return res.send({status: 'success', message: '操作成功'});
            } else {
                return res.send({status: 'fail', message: '操作失败'});
            }
        }
        let competitions = await Competition.find({c_organizer_id: organizerID});
        return res.render('organizer/advertise_add_edit', {
            title: ' - 公告管理',
            session: req.session,
            competitions: competitions,
            com_id: com_id,
            isEdit: false,
        })
    },
    advertise_edit: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if (req.session.organizer.role !== 1) return res.render('404', {});
        if (req.session.user.role === 1 && req.session.organizer.disabledState) return res.redirect('/logout');

        let organizerID = req.session.organizer.id;
        let competitions = await Competition.find({c_organizer_id: organizerID});
        let ad_id = req.params.id;
        let advertise = await Advertise.findOne({id: ad_id});
        if (req.method === 'POST') {
            if (!advertise) return res.send({status: 'fail', message: "Unknown Advertise ID"});
            let ad_intro = JSON.stringify(req.body.ad_intro);
            await advertise.updateOne({
                ad_title: req.body.ad_title,
                c_id: req.body.c_id,
                ad_poster_name: req.body.ad_poster_name,
                ad_intro: ad_intro,
            });
            return res.send({status: 'success', message: '操作成功'});
        }
        if (!advertise) return res.redirect('/');
        let competition = await Competition.findOne({id: advertise.competition_id});
        return res.render('organizer/advertise_add_edit', {
            title: ' - 公告管理',
            session: req.session,
            competitions: competitions,
            advertise: advertise,
            com_id: competition.id,
            isEdit: true
        })
    },
    change_advertise_state: async function (req, res, next) {
        let ad_state = req.body.ad_state;
        let ad_id = req.body.ad_id;
        let adItem = await Advertise.findOne({id: ad_id});
        if (!adItem) return res.send({status: 'fail', message: '操作失败'});
        await adItem.updateOne({ad_state: ad_state});
        return res.send({status: 'success', message: '操作成功'})
    },
    voting: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if(req.params.u_id){
            req.session.organizer = await Organizer.findOne({id: req.params.u_id});
        }
        if (req.session.organizer.role !== 1) return res.render('404', {});
        if (req.session.user.role === 1 && req.session.organizer.disabledState) return res.redirect('/logout');

        let c_id = req.params.id;
        let competition = await Competition.findOne({id: c_id});
        if (!competition) return res.redirect('/organizer');
        let page_rows = 10;
        let total_length = await Vote.find({competition_id: c_id, v_state: {$ne: 0}}).countDocuments();
        let total_pages = Math.ceil(total_length / page_rows);
        let votes = await Vote.find({competition_id: c_id, v_state: {$ne: 0}}).limit(page_rows);
        return res.render('organizer/voting', {
            title: ' - 赛事投票',
            session: req.session,
            competition: competition,
            votes: votes,
            pages: total_pages,
            current: 1
        })
    },
    vote_add_delete: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if (req.session.organizer.role !== 1) return res.render('404', {});
        if (req.session.user.role === 1 && req.session.organizer.disabledState) return res.redirect('/logout');

        let organizerID = req.session.organizer.id;
        let com_id = req.params.com_id;
        let public_path = path.resolve('public');
        let userFolderPath = public_path + "/uploads/" + organizerID;
        if (req.method === 'POST') {
            if (req.body.method_type === 'add') {
                if (!fs.existsSync(userFolderPath)) {
                    fs.mkdirSync(userFolderPath);
                }
                let v_start_date = req.body.v_start_date;
                let v_end_date = req.body.v_end_date;
                let v_start_time = new Date(parseInt(v_start_date.split('-')[0]), parseInt(v_start_date.split('-')[1])-1, parseInt(v_start_date.split('-')[2]),
                    parseInt(req.body.v_start_hours), parseInt(req.body.v_start_minutes));
                let v_end_time = new Date(parseInt(v_end_date.split('-')[0]), parseInt(v_end_date.split('-')[1])-1, parseInt(v_end_date.split('-')[2]),
                    parseInt(req.body.v_end_hours), parseInt(req.body.v_end_minutes));
                let intro_images = req.body.v_images;
                let c_helper_images = [];
                let milliseconds = new Date().getTime().toString();
                for (let intro_index = 0; intro_index < intro_images.length; intro_index++) {
                    let intro_image_path = '';
                    if (intro_images[intro_index].length > 1000) {
                        let introImgData = intro_images[intro_index].replace(/^data:image\/\w+;base64,/, "");
                        let file_extension = '.png';
                        if (introImgData.charAt(0) === '/') file_extension = '.jpg';
                        else if (introImgData.charAt(0) === 'R') file_extension = '.gif';
                        let intro_file_name = "/intro" + intro_index.toString() + "_" + milliseconds + file_extension;
                        let intro_image_upload_path = userFolderPath + intro_file_name;
                        intro_image_path = "/uploads/" + organizerID + intro_file_name;
                        fs.writeFileSync(intro_image_upload_path, introImgData, 'base64');
                        c_helper_images.push(intro_image_path);
                    } else c_helper_images.push(intro_images[intro_index]);
                }
                let v_method_type = 1;
                let v_method_text = '每个微信号一共可以投';
                let v_method_value = 1000;
                if (parseInt(req.body.v_method_type) === 1) {
                    v_method_value = parseInt(req.body.v_method_value);
                } else {
                    v_method_type = 2;
                    v_method_text = '每个微信号每天可以投';
                    v_method_value = parseInt(req.body.v_method_value);
                }
                let data = {
                    organizer_id: organizerID,
                    v_title: req.body.v_title,
                    competition_id: req.body.c_id,
                    v_start_time: this._utc_to_local(v_start_time),
                    v_end_time: this._utc_to_local(v_end_time),
                    v_method: {
                        method_type: v_method_type,
                        method_text: v_method_text,
                        method_value: v_method_value,
                    },
                    v_images: c_helper_images,
                    v_intro: JSON.stringify(req.body.v_intro),
                    v_teams: req.body.v_teams,
                    v_state: 1,
                    created_at: this._utc_to_local(new Date()),
                    updated_at: this._utc_to_local(new Date())
                };
                let newVote = new Vote(data);
                await newVote.save();
                return res.send({status: 'success', message: '保存成功'});
            } else if (req.body.method_type === 'delete') {
                let v_id = req.body.v_id;
                let deleteItem = await Vote.findOne({id: v_id});
                if (!deleteItem) return res.send({status: 'fail', message: '操作失败'});
                await deleteItem.updateOne({v_state: 0});
                return res.send({status: 'success', message: '操作成功'});
            } else return res.send({status: 'fail', message: '操作失败'});
        } else {
            let competitions = await Competition.find({c_organizer_id: organizerID, c_state: {$ne: 0}});
            return res.render('organizer/voting_add_edit', {
                title: ' - 赛事投票',
                session: req.session,
                competitions: competitions,
                com_id: com_id,
                isEdit: false,
            })
        }
    },
    vote_edit: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if (req.session.organizer.role !== 1) return res.render('404', {});
        if (req.session.user.role === 1 && req.session.organizer.disabledState) return res.redirect('/logout');

        let organizerID = req.session.organizer.id;
        let public_path = path.resolve('public');
        let userFolderPath = public_path + "/uploads/" + organizerID;
        let v_id = req.params.id;
        let vote = await Vote.findOne({id: v_id});
        if (req.method === 'POST') {
            let v_start_date = req.body.v_start_date;
            let v_end_date = req.body.v_end_date;
            let v_start_time = new Date(parseInt(v_start_date.split('-')[0]), parseInt(v_start_date.split('-')[1])-1, parseInt(v_start_date.split('-')[2]),
                parseInt(req.body.v_start_hours), parseInt(req.body.v_start_minutes));
            let v_end_time = new Date(parseInt(v_end_date.split('-')[0]), parseInt(v_end_date.split('-')[1])-1, parseInt(v_end_date.split('-')[2]),
                parseInt(req.body.v_end_hours), parseInt(req.body.v_end_minutes));
            let intro_images = req.body.v_images;
            let c_helper_images = [];
            let milliseconds = new Date().getTime().toString();
            for (let intro_index = 0; intro_index < intro_images.length; intro_index++) {
                let intro_image_path = '';
                if (intro_images[intro_index].length > 1000) {
                    let introImgData = intro_images[intro_index].replace(/^data:image\/\w+;base64,/, "");
                    let file_extension = '.png';
                    if (introImgData.charAt(0) === '/') file_extension = '.jpg';
                    else if (introImgData.charAt(0) === 'R') file_extension = '.gif';
                    let intro_file_name = "/intro" + intro_index.toString() + "_" + milliseconds + file_extension;
                    let intro_image_upload_path = userFolderPath + intro_file_name;
                    intro_image_path = "/uploads/" + organizerID + intro_file_name;
                    fs.writeFileSync(intro_image_upload_path, introImgData, 'base64');
                    c_helper_images.push(intro_image_path);
                } else c_helper_images.push(intro_images[intro_index]);
            }
            let v_method_type = 1;
            let v_method_text = '每个微信号一共可以投';
            let v_method_value = 1000;
            if (parseInt(req.body.v_method_type) === 1) {
                v_method_value = parseInt(req.body.v_method_value);
            } else {
                v_method_type = 2;
                v_method_text = '每个微信号每天可以投';
                v_method_value = parseInt(req.body.v_method_value);
            }
            let data = {
                organizer_id: organizerID,
                v_title: req.body.v_title,
                competition_id: req.body.c_id,
                v_start_time: this._utc_to_local(v_start_time),
                v_end_time: this._utc_to_local(v_end_time),
                v_method: {
                    method_type: v_method_type,
                    method_text: v_method_text,
                    method_value: v_method_value,
                },
                v_images: c_helper_images,
                v_intro: JSON.stringify(req.body.v_intro),
                v_teams: req.body.v_teams,
                updated_at: this._utc_to_local(new Date())
            };
            await vote.updateOne(data);
            return res.send({status: 'success', message: '保存成功'});
        } else {
            let competitions = await Competition.find({c_organizer_id: organizerID, c_state: {$ne: 0}});
            let applies = await Applying.aggregate([
                {$match: {competition_id: vote.competition_id, a_state: {$in: [1, 2, 3]}}},
                {
                    $lookup:
                        {
                            from: 'teams',
                            localField: 'team_id',
                            foreignField: 'id',
                            as: 'team'
                        }
                }
            ]);
            let competition = await Competition.findOne({id: vote.competition_id});
            return res.render('organizer/voting_add_edit', {
                title: ' - 赛事投票',
                session: req.session,
                competitions: competitions,
                vote: vote,
                applies: applies,
                com_id: competition.id,
                isEdit: true,
            })
        }
    },
    vote_view: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if (req.session.organizer.role !== 1) return res.render('404', {});
        if (req.session.user.role === 1 && req.session.organizer.disabledState) return res.redirect('/logout');

        let v_id = req.params.id;
        let vote = await Vote.aggregate([
            {$match: {id: v_id, v_state: {$ne: 0}}},
            {
                $lookup: {
                    from: 'teams',
                    let: {'pid': '$v_teams'},
                    pipeline: [
                        {'$match': {'$expr': {'$in': ['$id', '$$pid']}}}
                    ],
                    as: 'teams'
                }
            }
        ]);
        if (vote.length === 0) return res.render('404', {});
        vote = vote[0];
        let votings = [];
        for (let i = 0; i < vote.v_teams.length; i++) {
            let item = {team: vote.teams[i].t_full_name};
            item.numbers = await Voting.find({vote_id: v_id, team_id: vote.v_teams[i]}).countDocuments();
            votings.push(item);
        }

        return res.render('organizer/voting_view', {
            title: ' - 赛事投票',
            session: req.session,
            vote: vote,
            votings: votings,
        })
    },
    change_vote_state: async function (req, res, next) {
        let v_state = req.body.v_state;
        let v_id = req.body.v_id;
        let vItem = await Vote.findOne({id: v_id});
        if (!vItem) return res.send({status: 'fail', message: '操作失败'});
        await vItem.updateOne({v_state: v_state});
        return res.send({status: 'success', message: '操作成功'})
    },
    place_management: async function (req, res, next) {
        if (!req.session.login) return res.redirect('/login');
        if (req.session.organizer.role !== 1) return res.render('404', {});
        let places = await Place.find({organizer_id: req.session.organizer.id});
        return res.render('organizer/places', {
            title: ' - 场地管理',
            session: req.session,
            places: places,
        })
    },
    place_add_delete: async function (req, res, next) {
        if (!req.session.login) return res.send({status: 'fail', message: '未定义的用户！'});
        if (req.session.organizer.role !== 1) return res.send({status: 'fail', message: '未定义的用户！'});
        let method_type = req.body.method_type;
        if (method_type === 'add') {
            let newPlace = new Place({
                organizer_id: req.session.organizer.id,
                place: req.body.place_name,
                state: 2
            });
            await newPlace.save();
            return res.send({status: 'success', message: '操作成功'})
        } else if (method_type === 'delete') {
            await Place.deleteMany({id: {$in: req.body.ids}});
            return res.send({status: 'success', message: '操作成功'})
        } else {
            return res.send({status: 'fail', message: '操作失败'})
        }
    },
    change_place_state: async function (req, res, next) {
        let place_id = req.body.place_id;
        let place_state = req.body.place_state;
        let place = await Place.findOne({id: place_id});
        if (!place) return res.send({status: 'fail', message: '操作失败'});
        await place.updateOne({state: place_state});
        return res.send({status: 'success', message: '操作成功'});
    },
    add_feedback: async function (req, res, next) {
        if (!req.session.login) return res.send({status: 'fail', message: '未定义的用户！'});
        if (req.session.organizer.role !== 1) return res.send({status: 'fail', message: '未定义的用户！'});

        let organizer_id = req.session.organizer._id.toString();
        let email = req.body.email;
        if (!email) return res.send({status: 'fail', message: '请输入您的邮箱！'});
        let content = req.body.content;
        if (!content) return res.send({status: 'fail', message: '请输入内容'});
        let data = {
            organizer_id: organizer_id,
            email: email,
            content: content,
            state: 1,
            created_at: this._utc_to_local(new Date()),
            updated_at: this._utc_to_local(new Date()),
        };
        let new_feedback = new Feedback(data);
        await new_feedback.save();
        return res.send({status: 'success', message: '您成功发送了反馈信息。'});
    },

});