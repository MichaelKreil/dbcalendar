var fs = require('fs');
var path = require('path');

var data = {
	stops: loadFile('stops', 'stop_id:id:i,stop_name:name:s,stop_lat:lat:f,stop_lon:lon:f'),
	stoptimes: loadFile('stop_times', 'trip_id:trip:i,stop_id:stop:i,arrival_time:arrival:t,departure_time:departure:t,stop_sequence:seq:i', true)
}

function loadFile (name, fields, ignoreQuotes) {
	var fieldLookup = {};
	fields = fields.split(',').map((field) => {
		field = field.split(':')
		var key = field[0];
		var newKey = field[1];
		switch (field[2]) {
			case 'f': fieldLookup[key] = { key:newKey, converter:parseFloat }; break;
			case 'i': fieldLookup[key] = { key:newKey, converter:(v => parseInt(v,10)) }; break;
			case 's': fieldLookup[key] = { key:newKey, converter:(v => v.replace(/\"/g,'').replace(/%/g,',')) }; break;
			case 't': fieldLookup[key] = { key:newKey, converter:(v => parseInt(v.substr(0,2),10)*60+parseInt(v.substr(3,2),10)) }; break;
			default: throw Error();
		}
	})

	var lines = fs.readFileSync(path.resolve(__dirname, '../data/flixbus/'+name+'.txt'), 'utf8');
	if (ignoreQuotes) lines = lines.replace(/\"/g, '');
	lines = lines.split('\n');
	
	var header = lines.shift().replace(/\"/g,'').split(',');
	
	header = header.map(key => ({ key:fieldLookup[key].key, converter:fieldLookup[key].converter }));

	return lines.map((line) => {
		line = line.replace(/\".*,.*\"/g, s => s.replace(/,/,'%'))
		line = line.split(',');
		var obj = {};
		line.forEach((v,i) => {
			var field = header[i];
			obj[field.key] = field.converter(v);
		})
		return obj;
	})
}

module.exports.findStation = function (lat, lon) {
	var bestStation = false;
	var bestDistance = 1e100;
	data.stops.forEach(s => {
		var distance = sqr(lat-s.lat) + sqr(lon-s.lon);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestStation = s;
		}
	})
	return bestStation;
}

module.exports.findRoutes = function (entry) {

	var startId = entry.startStation.id;
	var endId = entry.endStation.id;

	var startTrips = data.stoptimes.filter(st => st.stop === startId);
	var endTrips   = data.stoptimes.filter(st => st.stop === endId);

	var trips = getTrips();

	var startDate = new Date(entry.start.dateTime);
	var endDate   = new Date(entry.end.dateTime);

	var dayStart = Math.floor(startDate.getTime()/86400000);
	var dayEnd   = Math.ceil(   endDate.getTime()/86400000);
	var allTrips = [];
	for (var day = dayStart; day <= dayEnd; day++) {
		trips.forEach((trip) => {
			allTrips.push([
				new Date((trip[0]*60 + day*86400 - 2*3600)*1000),
				new Date((trip[1]*60 + day*86400 - 2*3600)*1000)
			])
		})
	}

	allTrips = allTrips.filter((trip) => {
		if (trip[0] < startDate) return false;
		if (trip[1] >   endDate) return false;
		return true;
	})

	allTrips.sort((a,b) => a[0] - b[0]);

	return allTrips;

	function getTrips() {
		var knownTrips = {};
		var correctTrips = [];
		startTrips.forEach(t => knownTrips[t.trip] = t);
		endTrips.forEach(t => { if (knownTrips[t.trip]) correctTrips.push([knownTrips[t.trip], t])});

		correctTrips = correctTrips.filter(t => t[0].seq < t[1].seq);
		var trips = {};
		correctTrips.forEach(t => {
			var trip = [t[0].departure, t[1].arrival];
			if (trip[1] < trip[0]) trip[1] += 1440;
			trips[t[0].departure] = trip;
		})
		trips = Object.keys(trips).map(key => trips[key]);
		return trips;
	}
}



function sqr(v) {
	return v*v
}






