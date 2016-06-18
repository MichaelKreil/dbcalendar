var fs = require('fs');
var express = require('express');
var Handlebars = require('handlebars');
var app = express();
var calendar;

var templates = {
	index: '../templates/index.html'
}

Object.keys(templates).forEach((key) => {
	var filename = templates[key]
	//templates[key] = Handlebars.compile(fs.readFileSync(filename, 'utf8'));
	templates[key] = (data) => {
		return Handlebars.compile(fs.readFileSync(filename, 'utf8'))(data);
	}
})

app.use('/assets', express.static('../assets'));

app.get('/', function (req, res) {
	res.send(templates.index(calendar.getIndexData()));
});

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});

module.exports = {
	setCalendar: (cal) => { calendar = cal }
}
