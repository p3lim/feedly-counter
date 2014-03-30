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
	if(this.readyState == 4 && this.status == 200)
		document.querySelector('body').innerHTML = this.response;
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
});
