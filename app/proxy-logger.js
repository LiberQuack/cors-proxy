"use strict";

let db = require('lowdb')('proxy-records.db.json');

db.defaults({data: []}).write();

module.exports = {

    write: function(perfs) {
        try {
            db.get('data').push(perfs).write();
        } catch (err) {
            console.error('Could not write logs', err);
        }
    }

};