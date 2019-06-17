let express = require('express');
let router = express.Router();

let BaseController = require('../controllers/BaseController');
let AdminController = require('../controllers/AdminController');
let OrganizerController = require('../controllers/OrganizerController');

router.get('/', function (req, res, next) {
    BaseController.index(req, res, next);
});
router.get('/login', function (req, res, next) {
    BaseController.login(req, res, next);
});
router.post('/login', function (req, res, next) {
    BaseController.login(req, res, next);
});
router.get('/logout', function (req, res, next) {
    BaseController.logout(req, res, next);
});
router.get('/change-password', function (req, res, next) {
    BaseController.change_password(req, res, next);
});
router.post('/change-password', function (req, res, next) {
    BaseController.change_password(req, res, next);
});

/***************************************
 * Admin Routes
 *************************************** */

//===================== organizer page ======================
router.get('/admin-organizer', function (req, res, next) {
    AdminController.organizer_manage(req, res, next);
});
router.post('/admin-identify-organizer', function (req, res, next) {
    AdminController.organizer_identify(req, res, next);
});
router.post('/admin-organizer-disable', function (req, res, next) {
    AdminController.organizer_disable(req, res, next);
});
router.post('/admin-reset-organizer', function (req, res, next) {
    AdminController.reset_organizer_password(req, res, next);
});

//===================== team page ==========================
router.get('/admin-team', function (req, res, next) {
    AdminController.team_manage(req, res, next);
});
//======================= user page ========================
router.get('/admin-user', function (req, res, next) {
    AdminController.user_manage(req, res, next);
});
router.post('/admin-user-disable', function (req, res, next) {
    AdminController.user_disable(req, res, next);
});
// ======================= competitions page ======================
router.get('/admin-competition', function (req, res, next) {
    AdminController.competition_manage(req, res, next);
});
router.post('/admin-change-competition-order', function (req, res, next) {
    AdminController.change_competition_order(req, res, next);
});
// ==================== feedback page ==========================
router.get('/admin/feedback', function (req, res, next) {
    AdminController.feedback_manage(req, res, next);
});
router.post('/admin/change-feedback-state', function (req, res, next) {
    AdminController.change_feedback_state(req, res, next);
});

/*********************************************
 * Organizer Routes
 ******************************************* */

router.get('/organizer', function (req, res, next) {
    OrganizerController.index(req, res, next);
});
//------------------------------- competition ----------------------------------------//
router.post('/organizer/change-competition-state', function (req, res, next) {
    OrganizerController.change_competition_state(req, res, next);
});
router.get('/organizer/add-competition', function (req, res, next) {
    OrganizerController.add_competition(req, res, next);
});
router.post('/organizer/delete-competition/:u_id?', function (req, res, next) {
    OrganizerController.delete_competition(req, res, next);
});
router.post('/organizer/add-competition', function (req, res, next) {
    OrganizerController.add_competition(req, res, next);
});
router.get('/organizer/edit-competition/:id/:u_id?', function (req, res, next) {
    OrganizerController.edit_competition(req, res, next);
});
router.post('/organizer/edit-competition/:id', function (req, res, next) {
    OrganizerController.edit_competition(req, res, next);
});
//--------------------------------- applying -----------------------------------------//
router.get('/organizer/applying/:id/:u_id?', function (req, res, next) {
    OrganizerController.applying(req, res, next);  // id: competition id
});
router.get('/organizer/edit-applying/:id', function (req, res, next) {
    OrganizerController.applying_edit(req, res, next); // id: applying id
});
router.post('/organizer/edit-applying/:id', function (req, res, next) {
    OrganizerController.applying_edit(req, res, next);  // id: applying id
});
router.post('/organizer/cancel-applying', function (req, res, next) {
    OrganizerController.cancel_applying(req, res, next);
});

// ------------------------------- games ---------------------------------------------//
router.get('/organizer/games/:id/:u_id?', function (req, res, next) {
    OrganizerController.game_management(req, res, next);  // id: competition id
});
router.post('/organizer/add-games/:id', function (req, res, next) {
    OrganizerController.add_games(req, res, next);
});

// ------------------------------ ranking ------------------------------------------- //
router.get('/organizer/ranking/:id/:u_id?', function (req, res, next) {
    OrganizerController.ranking(req, res, next);
});
router.post('/organizer/ranking/:id', function (req, res, next) {
    OrganizerController.add_ranking(req, res, next);
});

// ------------------------------ shooter ------------------------------------------ //
router.get('/organizer/shooter/:id/:u_id?', function (req, res, next) {
    OrganizerController.shooter(req, res, next);
});
router.post('/organizer/add-shooter', function (req, res, next) {
    OrganizerController.add_shooter(req, res, next);
});

//-------------------------------- advertising --------------------------------------//
router.get('/organizer/advertise/:id/:u_id?', function (req, res, next) {
    OrganizerController.advertise(req, res, next);
});
router.get('/organizer/add-delete-advertise/:com_id', function (req, res, next) {
    OrganizerController.advertise_add_delete(req, res, next);
});
router.post('/organizer/add-delete-advertise/:com_id', function (req, res, next) {
    OrganizerController.advertise_add_delete(req, res, next);
});
router.get('/organizer/edit-advertise/:id', function (req, res, next) {
    OrganizerController.advertise_edit(req, res, next);
});
router.post('/organizer/edit-advertise/:id', function (req, res, next) {
    OrganizerController.advertise_edit(req, res, next);
});
router.post('/organizer/change-advertise-state', function (req, res, next) {
    OrganizerController.change_advertise_state(req, res, next);
});
//------------------------------ voting --------------------------------------------//
router.get('/organizer/voting/:id/:u_id?', function (req, res, next) {
    OrganizerController.voting(req, res, next);
});
router.get('/organizer/add-delete-vote/:com_id', function (req, res, next) {
    OrganizerController.vote_add_delete(req, res, next);
});
router.post('/organizer/add-delete-vote/:com_id', function (req, res, next) {
    OrganizerController.vote_add_delete(req, res, next);
});
router.get('/organizer/edit-vote/:id', function (req, res, next) {
    OrganizerController.vote_edit(req, res, next);
});
router.post('/organizer/edit-vote/:id', function (req, res, next) {
    OrganizerController.vote_edit(req, res, next);
});
router.get('/organizer/view-vote/:id', function (req, res, next) {
    OrganizerController.vote_view(req, res, next);  // id: vote id
});
router.post('/organizer/change-vote-state', function (req, res, next) {
    OrganizerController.change_vote_state(req, res, next);
});
// ------------------------------- places ---------------------------------- //
router.get('/organizer/place-management', function (req, res, next) {
    OrganizerController.place_management(req, res, next);
});
router.post('/organizer/change-place-state', function (req, res, next) {
    OrganizerController.change_place_state(req, res, next);
});
router.post('/organizer/place-add-delete', function (req, res, next) {
    OrganizerController.place_add_delete(req, res, next);
});
// ------------------------------ feedback -------------------------------- //
router.post('/organizer/add-feedback', function (req, res, next) {
    OrganizerController.add_feedback(req, res, next);
});

module.exports = router;
