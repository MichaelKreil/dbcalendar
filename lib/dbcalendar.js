var geocoder = require('./geocoder.js');
var flixbus = require('./flixbus.js');


var places = [];
var routes = [];


function setPlaces(val) {
	places = val;
	places.forEach(function (place) {
		geocoder.geocode(place.location, (result) => {
			place.locationData = result;
			place.station = flixbus.findStation(place.locationData.lat, place.locationData.lon);
			place.startStation = place.station;
			place.endStation = place.station;
		});
	})
	fixEntries(places, 'place');
}

function setRoutes(val) {
	routes = val;
	fixEntries(routes, 'route');
}

function fixEntries(entries, type) {
	entries.forEach(entry => {
		if (!entry.dayStart ) entry.dayStart  = entry.start.dateTime.substr(0,10);
		if (!entry.dayEnd   ) entry.dayEnd    = entry.end.dateTime.substr(0,10);
		if (!entry.startTime) entry.startTime = (new Date(entry.start.dateTime)).getTime();
		if (!entry.endTime  ) entry.endTime   = (new Date(entry.end.dateTime)).getTime();
		entry.type = type;
	})
}

function getPlaces() {
	return places;
}

function getRoutes() {
	return routes;
}

function getProblems() {
	var entries = places.concat(routes);

	entries.sort(function (a,b) {
		return a.startTime - b.startTime;
	})

	var problems = [];

	for (var i = 0; i < entries.length-1; i++) {
		if (entries[i].endStation.id !== entries[i+1].startStation.id) {
			var problemEntry = {
				start: addMinutes(entries[i  ].end,    30),
				end  : addMinutes(entries[i+1].start, -30),
				startStation: entries[i  ].endStation,
				endStation  : entries[i+1].startStation,
				summary:'Achtung, Fahrt nötig',
				location:''
			}
			problems.push(problemEntry);
		}
	}

	fixEntries(problems, 'problem');

	problems.forEach(problem => {
		problem.solutions = flixbus.findRoutes(problem);
	})

	//console.dir(problems, {colors:true, depth:3});

	return problems;

	function addMinutes(time, minutes) {
		return {
			dateTime: (new Date((new Date(time.dateTime)).getTime() + minutes*60*1000)).toISOString()
		}
	}
}

function getMessages() {
	return [];
}

function getDays() {
	return [
		{ label:'Mo. 20.', date:'2016-06-20'},
		{ label:'Di. 21.', date:'2016-06-21'},
		{ label:'Mi. 22.', date:'2016-06-22'},
		{ label:'Do. 23.', date:'2016-06-23'},
		{ label:'Fr. 24.', date:'2016-06-24'},
		{ label:'Sa. 25.', date:'2016-06-25'},
		{ label:'So. 26.', date:'2016-06-26'}
	]
}

function getTimes() {
	var times = [];
	for (var i = 0; i < 24; i++) {
		times.push({
			label:(i+100).toFixed().substr(1)+':00',
			bottom:(23-i)*30,
			worktime: (i >= 8) && (i <= 20)
		})
	}

	return times;
}


function getIndexData() {
	var data = {
		places: getPlaces(),
		routes: getRoutes(),
		problems: getProblems()
	}
	data.json = JSON.stringify(data, null, '\t');
	data.days = getDays();
	data.times = getTimes();
	data.messages = getMessages();
	return data;
}


module.exports = {
	setPlaces:setPlaces,
	setRoutes:setRoutes,
	getIndexData:getIndexData
}
