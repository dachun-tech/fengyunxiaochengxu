let cron = require("node-cron");
let express = require("express");
let mongoose = require('mongoose');

const Competition = require('./models/Competition');
const Game = require('./models/Game');
let Applying = require('./models/Applying');
let Organizer = require('./models/Organizer');

function _utc_to_local(utc) {
    let current_utc_time = new Date(utc);
    current_utc_time.setHours(current_utc_time.getHours() + 8);
    return new Date(current_utc_time);
}
function _local_to_utc(local) {
    let current_local_time = new Date(local);
    current_local_time.setHours(current_local_time.getHours() - 8);
    return new Date(current_local_time);
}
cron.schedule("* * * * *", async () => {
    // check competition state
    let cur_time = _utc_to_local(new Date());
    console.log(cur_time);
    let competitions = await Competition.find({c_state: {$in: [1,2,3,4,5]}});
    competitions.forEach(async function (competition) {
        let c_state = 1;
        if (cur_time > new Date(competition.c_applying_start_time) && cur_time < new Date(competition.c_applying_end_time)) c_state = 2;
        else if (cur_time > new Date(competition.c_applying_end_time) && cur_time < new Date(competition.c_start_time)) c_state = 3;
        else if (cur_time > new Date(competition.c_start_time) && cur_time < new Date(competition.c_end_time)) c_state = 4;
        else if (cur_time > new Date(competition.c_end_time)) c_state = 5;
        if (c_state !== 1) await competition.updateOne({c_state: c_state});
    });

    // check game state
    let games = await Game.find({g_state: 1});
    let current_time_for_game = new Date();
    games.forEach(async function (game) {
        let g_date = game.g_date;
        let g_time = game.g_time;
        let gds = g_date.split('-');
        let gts = g_time.split(':');
        let g_datetime = new Date(gds[0], parseInt(gds[1]) - 1, gds[2], gts[0], gts[1]);
        if (current_time_for_game > g_datetime) await game.updateOne({g_state: 2});
    });
});
// user wallet from competition time
cron.schedule("0 17 * * *", async () => {
    let competitions = await Competition.find({c_state: {$in: [4, 5, 6, 7]}});
    let cur_time = _utc_to_local(new Date());
    for (let i = 0; i < competitions.length; i++) {
        let c_start_time = new Date(competitions[i].c_start_time);
        let organizer_id = competitions[i].c_organizer_id;
        let c_fee = competitions[i].c_fee;
        let move_amount = 0;
        if (cur_time > c_start_time) {
            let applies = await Applying.find({a_state: 2, pay_state: 2});
            for (let j = 0; j < applies.length; j++) {
                move_amount += c_fee;
                await applies[i].updateOne({pay_state: 4});
            }
        }
        if (move_amount !== 0) {
            let organizer = await Organizer.findOne({id: organizer_id});
            if (!organizer) continue;
            let pending = organizer.amount_pending;
            let available = organizer.amount_withdraw;
            if (pending < move_amount) continue;
            let new_pending = pending - move_amount;
            let new_available = available + move_amount;
            await organizer.updateOne({amount_pending: new_pending, amount_withdraw: new_available});
        }
    }
});

app = express();
let config = require('./config')();

mongoose.connect('mongodb://localhost:' + config.mongo.port + '/' + config.mongo.dbname , {useCreateIndex: true, useNewUrlParser: true,}, function(err, db) {
    if (err) console.log("MongoDB Server is not running ...");
    else {
        app.listen(config.cron_port, function () {
            console.log("Cron Job Server is running: 127.0.0.1:" + config.cron_port);
        })
    }
});
