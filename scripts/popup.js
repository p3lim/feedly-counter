var params = {
	client_id: '', // TODO: add our id once the Feedly team decides to give me one
	scope: 'https://cloud.feedly.com/subscriptions',
	redirect_uri: 'http://localhost',
	response_type: 'code',
	state: 'feedlycounter'
};

var map = function(key){
	return key + '=' + params[key];
};

var popupResponse = function(){
	if(this.readyState == 4){
		var body = document.querySelector('body');
		if(this.status == 200)
			body.innerHTML = this.response;
		else
			body.innerHTML = '<div class=\'error\'>Something went wrong,<br>please try again later.</div>';
	};
};

document.addEventListener('DOMContentLoaded', function(){
	if(localStorage.getItem('token')){
		window.close();
		chrome.runtime.sendMessage({visit: true});
	} else {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'https://feedly.com/v3/auth/auth?' + Object.keys(params).map(map).join('&'));
		xhr.onreadystatechange = popupResponse;
		xhr.send();
	};

	window.addEventListener('click', function(event){
		var target = event.target;
		if(target.tagName == 'A'){
			event.preventDefault();
			chrome.tabs.create({url: target.href});
		};
	});
});
