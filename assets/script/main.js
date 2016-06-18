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

	data.places.forEach(function (place) {
		place.summary = place.start.dateTime.substr(11,5) + ' - ' + place.summary;
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
			var clicked = 0; //dirty Hack!!!
			entry.clickHandler = function (evnt) {
				if (clicked !== 0) return;
				clicked++;
				$problem = $(entry.nodes);
				$problem.css({opacity:0});

				var solutionNodes = [];
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

					solution.nodes.forEach(function (node) {
						$node = $(node);
						var offset = $node.offset();
						$node.data('sol', solution);
						$node.data('x', offset.left + $node.outerWidth()/2);
						$node.data('y', offset.top  + $node.outerHeight()/2);
					})

					solutionNodes = solutionNodes.concat(solution.nodes);

					return solution;

					function getTime(text) {
						text = new Date(text).toTimeString();
						text = text.substr(0,5);
						text = text.replace(/^0/, '');
						return text;
					}
				})
				var $solutions = $(solutionNodes);

				highlight(evnt);
				$problem.mouseover(highlight);
				$problem.mousemove(highlight);
				$problem.mouseout(function () {
					$solutions.removeClass('hover');
				});
				function highlight(evnt) {
					var solution = findSolution(evnt.pageX, evnt.pageY);
					$solutions.removeClass('hover');
					solution.$nodes.addClass('hover');
				}
				function findSolution(x,y) {
					var bestDist = 1e100;
					var bestSolution = false;
					solutionNodes.forEach(function (solutionNode) {
						var $node = $(solutionNode);
						var dist = sqr($node.data('x') - x) + sqr($node.data('y') - y);
						if (dist < bestDist) {
							bestDist = dist;
							bestSolution = $node.data('sol');
						}
					})
					return bestSolution;

					function sqr(v) { return v*v; }
				}
				$problem.click(function (evnt) {
					if (clicked !== 1) return;
					clicked++;
					var solution = findSolution(evnt.pageX, evnt.pageY);
					solution.$nodes.removeClass('boxsolution');
					solution.$nodes.removeClass('hover');
					solution.$nodes.addClass('boxtravel');
					//console.log($solutions.filter('.boxsolution'));
					$solutions.remove('.boxsolution');
					$problem.remove();
				});
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
