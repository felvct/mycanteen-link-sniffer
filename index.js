'use strict';
var http = require('http');
var htmlparser = require('htmlparser2');
var schedule = require('node-schedule');
var Slack = require('node-slack');

const sBarOptions = {
	keywords: 'Speiseplaene',
	lastPdfUrl: '',
	request: {
		host: 'www.s-bar.de',
		path: '/ihr-betriebsrestaurant/aktuelle-speiseplaene/banst-pt-wochenkarte.html'
	}
}
const slackOptions = {
	webHookUrl: '',
	description: 'This week in our lovely canteen: '
}

class LinkFinder {
	constructor() {
		this.scheduler();
	};

	getDataOfUrl () {
		let that = this;
		let request = http.request(sBarOptions.request, function (res) {
			let data = '';
			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				that.parseHtml(data);
			});
		});
		request.on('error', function (e) {
			console.log(e.message);
		});
		request.end();
	};

	parseHtml (data) {
		let that = this;
		let parser = new htmlparser.Parser({
		  onopentag: function(name, attribs){
		    if (name === 'a' && attribs.href.indexOf(sBarOptions.keywords) !== -1) {
					let url = sBarOptions.request.host + '/' + attribs.href;
					if (sBarOptions.lastPdfUrl !== url) {
						sBarOptions.lastPdfUrl = url;
						that.sendToSlack(url);
					} else {
						console.log('No new menu found.');
					}
		    }
		  }
		}, {decodeEntities: true});
		parser.write(data);
		parser.end();
	};

	sendToSlack (text) {
		var slack = new Slack(slackOptions.webHookUrl);
		slack.send({
			text: slackOptions.description + text
		});
	};

	scheduler () {
		let that = this;
		schedule.scheduleJob('15 12 * * *', function() {
			let currentDate = new Date();
			console.log('Job startet', currentDate);
			that.getDataOfUrl();
		});
	};
}

new LinkFinder();