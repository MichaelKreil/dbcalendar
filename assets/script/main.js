$(function () {
	var $calendar = $('#calendar');

	var entries = [];
	var dayLookup = {};

	$('.day', $calendar).each(function (a,b) {
		var $node = $(b);
		var day = {
			$node: $node,
			date: $node.attr('date')
		}
		dayLookup[day.date] = day;
	})

	entries = data.places.concat(data.routes, data.problems);

	entries.sort(function (a,b) {
		return a.startTime - b.startTime;
	})

	entries.forEach(function (entry) {
		entry.startTime = new Date(entry.startTime);
		entry.endTime   = new Date(entry.endTime);
		generateBox(entry);
	})

	function generateBox(entry) {
		if (entry.type === 'problem') {
			entry.clickHandler = function (evnt) {
				$problem = $(entry.nodes);
				$problem.css({opacity:0});

				var $solutions = [];
				var solutions = entry.solutions.map(function (s) {
					var solution = {
						type: 'solution',
						dayStart: s[0].substr(0,10),
						dayEnd:   s[1].substr(0,10),
						startTime: new Date(s[0]),
						endTime:   new Date(s[1]),
						summary: getTime(s[0]) + ' - ' + getTime(s[1]),
						location: '',
						clickHandler: ''
					}
					generateBox(solution);
					solution.$nodes = $(solution.nodes);
					var $solution = $(solution.nodes[0]);
					var offset = $solution.offset();
					solution.x = offset.left + $solution.outerWidth()/2;
					solution.y = offset.top  + $solution.outerHeight()/2;

					$solutions = $solutions.concat(solution.nodes);
					return solution;

					function getTime(text) {
						text = new Date(text).toTimeString();
						text = text.substr(0,5);
						text = text.replace(/^0/, '');
						return text;
					}
				})
				$solutions = $($solutions);

				highlight(evnt);
				$problem.mouseover(highlight);
				$problem.mousemove(highlight);
				$problem.mouseout(function () {
					$solutions.removeClass('hover');
				});
				function highlight(evnt) {
					var x = evnt.pageX;
					var y = evnt.pageY;
					var bestDist = 1e100;
					var bestSolution = false;
					solutions.forEach(function (solution) {
						var dist = sqr(solution.x - x) + sqr(solution.y - y);
						if (dist < bestDist) {
							bestDist = dist;
							bestSolution = solution;
						}
					})
					$solutions.removeClass('hover');
					bestSolution.$nodes.addClass('hover');

					function sqr(v) {
						return v*v;
					}
				}
			}
		}

		if (entry.dayStart === entry.dayEnd) {
			entry.nodes = [
				drawBox(entry, entry.dayStart, getMinute(entry.startTime), getMinute(entry.endTime))
			]
		} else {
			entry.nodes = [
				drawBox(entry, entry.dayStart, getMinute(entry.startTime), 1440),
				drawBox(entry, entry.dayEnd, 0, getMinute(entry.endTime))
			]
		}

		function getMinute(time) {
			return time.getHours()*60 + time.getMinutes();
		}

		function drawBox(entry, dayName, min0, min1) {
			var y = min0/2;
			var h = (min1-min0)/2;
			day = dayLookup[dayName];
			var $node = $('<div class="box box'+entry.type+'" style="top:'+y+'px;height:'+h+'px"><p class="what">'+entry.summary+'</p><p class="where">'+entry.location+'</p></div>')
			day.$node.append($node);
			if (entry.clickHandler) $node.click(entry.clickHandler)
			return $node.get(0);
		}
	}
})
