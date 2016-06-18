var apikey = 'AIzaSyCi3qQl5II-_9IOYuKSsv1TlUUaFx1syoU';

var fetch = require('node-fetch');
var fs = require('fs');
var path = require('path');
var querystring = require('querystring');

var geolookupFile = path.resolve(__dirname, '../data/geolookup.json');
var geolookup;
var geolookupChanged = false;
try {
	geolookup = fs.readFileSync(geolookupFile, 'utf8');
	geolookup = JSON.parse(geolookup);
} catch (err) {
	geolookup = {};
}

module.exports.geocode = function (text, cb) {
	if (geolookup[text]) {
		return finalize(geolookup[text]);
	}

	var s = querystring.stringify({address: text, key: apikey});
	fetch('https://maps.googleapis.com/maps/api/geocode/json?' + s)
		.then(res => res.json())
		.then(json => {
			switch (json.status) {
				case 'OK':
					geolookup[text] = json.results[0];
					geolookupChanged = true;
					return finalize(json.results[0]);
				break;
				case 'ZERO_RESULTS':
					geolookup[text] = false;
					geolookupChanged = true;
					return cb(false);
				break;
				default:
					console.error('Unknown status code "'+json.status+'"');
					return cb(false);
				return;
			}
		});

	function finalize(data) {
		data.lat = data.geometry.location.lat;
		data.lon = data.geometry.location.lng;
		cb(data);
	}
}

setInterval(() => {
	if (geolookupChanged) {
		fs.writeFileSync(geolookupFile, JSON.stringify(geolookup, null, '\t'), 'utf8');
		geolookupChanged = false;
	}
}, 1000)




