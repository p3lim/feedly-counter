var defaults = {
	'interval': 15,
	'beta': false,
	'notifications': false,
	'upgrade': 1
};

var context;
var createIcon = function(callback){
	var canvas = document.createElement('canvas');
	canvas.height = 19;
	canvas.width = 19;

	context = canvas.getContext('2d');
	context.scale(0.59375, 0.59375);

	context.image = new Image();
	context.image.src = 'images/icon_enabled.png';
	context.image.onload = callback;
};

var rotation = 0;
var spinIcon = function(){
	rotation++;

	context.save();
	context.clearRect(0, 0, 32, 32);
	context.translate(16, 16);
	context.rotate(rotation * Math.PI / 32);
	context.translate(-16, -16);
	context.drawImage(context.image, 0, 0);
	context.restore();

	chrome.browserAction.setIcon({
		imageData: context.getImageData(0, 0, 19, 19)
	});

	if(rotation <= 63)
		setTimeout(spinIcon, 10);
	else
		rotation = 0;
};

var updateNotifications = function(count){
	if(localStorage.getItem('feedly-counter') === 'true'){
		chrome.tabs.query({
			currentWindow: true,
			active: true,
			url: 'https://feedly.com/*'
		}, function(tabs){
			if(tabs.length == 0){
				chrome.notifications.clear('feedly-counter', function(){
					chrome.notifications.create('feedly-counter', {
						type: 'basic',
						iconUrl: 'images/icon128.png',
						title: 'Feedly Counter',
						message: count + ' unread feed' + (count > 1 ? 's' : '')
					}, function(){});
				});
			};
		});
	};
};

var lastCount;
var updateBadge = function(count){
	if(typeof(count) == 'number'){
		chrome.browserAction.setIcon({path: 'images/icon_enabled.png'});

		if(count > 0){
			chrome.browserAction.setBadgeBackgroundColor({color: '#d00018'});
			chrome.browserAction.setBadgeText({text: count.toString()});
		} else
			chrome.browserAction.setBadgeText({text: ''});

		if(lastCount != count){
			spinIcon();

			if(count > 0)
				updateNotifications(count);

			lastCount = count;
		};
	} else {
		chrome.browserAction.setIcon({path: 'images/icon_disabled.png'});
		chrome.browserAction.setBadgeBackgroundColor({color: '#bbb'});
		chrome.browserAction.setBadgeText({text: '?'});
	};
};

var refreshResponse = function(){
	if(this.readyState == 4 && this.status == 200){
		var response = JSON.parse(this.response);
		updateSettings('token', response.access_token);
	};
};

var refreshToken = function(){
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https.//feedly.com/v3/auth/token');
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.onreadystatechange = refreshResponse;
	xhr.send(JSON.stringify({
		client_id: '', // TODO: add our id once the Feedly team decides to give me one
		client_secret: '', // TODO: add our id once the Feedly team decides to give me one
		refresh_token: localStorage.getItem('refreshToken'),
		grant_type: 'refresh_token'
	}));
};

var requestCountResponse = function(){
	if(this.readyState === 4){
		if(this.status === 200){
			var response = JSON.parse(this.response);

			for(var index = 0; index < response.unreadcounts.length; index++){
				var item = response.unreadcounts[index];

				if(item.id.match(/^user\/[\da-f-]+?\/category\/global\.all$/))
					updateBadge(item.count);
			};
		} else
			refreshToken();
	};
};

var requestCount = function(){
	var token = localStorage.getItem('token');
	if(token){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'https://feedly.com/v3/markers/counts');
		xhr.setRequestHeader('Authorization', token);
		xhr.onreadystatechange = requestCountResponse;
		xhr.send();
	} else
		updateBadge();
};

var updateSettings = function(key, value, init){
	if(value)
		localStorage.setItem(key, value);
	else
		localStorage.removeItem(key);

	if(!init){
		if(key == 'token')
			updateBadge();
		else if(key == 'interval'){
			chrome.alarms.clear('feedly-counter');
			chrome.alarms.create('feedly-counter', {
				periodInMinutes: +value
			});
		};
	};
};

var initialize = function(){
	if(!localStorage.getItem('upgrade')){
		localStorage.clear();

		for(var key in defaults){
			if(key !== null)
				updateSettings(key, defaults[key], true);
		};
	} else if(localStorage.getItem('upgrade') < defaults.upgrade){
		for(var index = 0; index < localStorage.length; index++){
			var key = localStorage.key(index);
			if(defaults[key] === undefined)
				localStorage.removeItem(key);
		};

		for(var key in defaults){
			if(localStorage.getItem(key) === null)
				updateSettings(key, defaults[key], true);
		};

		localStorage.setItem('upgrade', defaults.upgrade);
	};

	chrome.alarms.create('feedly-counter', {
		periodInMinutes: +localStorage.getItem('interval')
	});

	createIcon(requestCount);
};

chrome.runtime.onStartup.addListener(initialize);
chrome.runtime.onInstalled.addListener(initialize);

var openTab = function(){
	requestCount();

	var suffix = localStorage.getItem('beta') == 'true' ? 'beta' : '';
	var url = 'https://feedly.com/' + suffix;

	chrome.tabs.query({
		url: url + '*'
	}, function(tabs){
		var tab = tabs[0];
		if(tab){
			chrome.tabs.update(tab.id, {active: true});
			chrome.tabs.reload(tab.id);
		} else
			chrome.tabs.create({url: url});
	});
};

chrome.notifications.onClicked.addListener(function(notificationId){
	if(notificationId == 'feedly-counter')
		openTab();
});

chrome.alarms.onAlarm.addListener(function(alarm){
	if(alarm.name === 'feedly-counter')
		requestCount();
});

chrome.webRequest.onBeforeRequest.addListener(function(details){
	if(details.hasOwnProperty('requestBody') && details.requestBody.hasOwnProperty('raw')){
		var bytes = new Uint8Array(details.requestBody.raw[0].bytes);
		var data = JSON.parse(String.fromCharCode.apply(null, bytes));

		if(data.action == 'markAsRead')
			setTimeout(requestCount, 2000);
	};
}, {
	urls: ['https://feedly.com/v3/markers?*'],
	types: ['xmlhttprequest']
}, ['requestBody']);

var tokenResponse = function(){
	if(this.readyState == 4 && this.status == 200){
		var response = JSON.parse(this.response);
		updateSettings('token', response.access_token);
		updateSettings('refreshToken', response.refresh_token);

		openTab();
	};
};

chrome.runtime.onMessage.addListener(function(message, sender){
	if(message.key)
		updateSettings(message.key, message.value);
	else if(message.visit)
		openTab();
	else if(message.code){
		chrome.tabs.remove(sender.tab.id);

		var xhr = new XMLHttpRequest();
		xhr.open('POST', 'https://feedly.com/v3/auth/token');
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.onreadystatechange = tokenResponse;
		xhr.send(JSON.stringify({
			client_id: '', // TODO: add our id once the Feedly team decides to give me one
			client_secret: '', // TODO: add our id once the Feedly team decides to give me one
			code: message.code,
			redirect_uri: 'https://localhost',
			state: 'token',
			grant_type: 'authorization_code'
		}));
	};
});
