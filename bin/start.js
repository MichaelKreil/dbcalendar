var fs = require('fs');
var async = require('async');
var cal = new (require('../lib/calendar_google.js'))();
var server = require('../lib/server.js');
var dbcalendar = require('../lib/dbcalendar.js');
server.setCalendar(dbcalendar);

var calPlaces = 'dqm37ap277t193itjkl3pp6ebg@group.calendar.google.com';
var calTravel = '5ea73020rbf03jtbtv8qj0ujs4@group.calendar.google.com';

//cal.listCalendars((cals) => {
//	console.dir(cals, {colors:true});
//})

var q = async.queue(function (task, callback) {
	task(callback);
}, 1);

q.drain = function() {
	console.log('all items have been processed');
}

q.push((cb) => {
	console.log('calendar "places" ...')
	cal.listEvents(calPlaces, (res) => {
		console.log('calendar "places" loaded')
		dbcalendar.setPlaces(res.items);
		cb();
	})
});

q.push((cb) => {
	console.log('calendar "travel" ...')
	cal.listEvents(calTravel, (res) => {
		console.log('calendar "travel" loaded')
		dbcalendar.setRoutes(res.items);
		cb();
	})
});
