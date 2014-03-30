document.addEventListener('DOMContentLoaded', function(){
	var interval = document.getElementById('interval');
	interval.value = localStorage.getItem('interval');

	var scheme = document.getElementById('scheme');
	scheme.checked = (localStorage.getItem('scheme') === 'https');

	var beta = document.getElementById('beta');
	beta.checked = localStorage.getItem('beta') === 'true';

	var notifications = document.getElementById('notifications');
	notifications.checked = localStorage.getItem('notifications') === 'true';

	if(!localStorage.getItem('change3')){
		var changelog = document.getElementById('changelog');
		changelog.style.display = 'inline';

		localStorage.setItem('change3', 'shown');
	};
});

var interval;
document.querySelector('#interval').addEventListener('input', function(x){
	if(this.value < 1) this.value = 1;
	if(this.value > 1440) this.value = 1440;

	localStorage.setItem('interval', this.value);

	var status = document.getElementsByTagName('span')[0];
	status.innerHTML = 'Saved!';

	clearTimeout(interval);
	interval = setTimeout(function(){
		status.innerHTML = '';
	}, 750);
});

var scheme;
document.querySelector('#scheme').addEventListener('change', function(){
	if(this.checked){
		localStorage.setItem('scheme', 'https');
	} else {
		localStorage.setItem('scheme', 'http');
	}

	var status = document.getElementsByTagName('span')[1];
	status.innerHTML = 'Saved!';

	clearTimeout(scheme);
	scheme = setTimeout(function(){
		status.innerHTML = '';
	}, 750);
});

var beta;
document.querySelector('#beta').addEventListener('change', function(){
	localStorage.setItem('beta', this.checked);

	var status = document.getElementsByTagName('span')[2];
	status.innerHTML = 'Saved!';

	clearTimeout(beta);
	beta = setTimeout(function(){
		status.innerHTML = '';
	}, 750);
});

var notifications;
document.querySelector('#notifications').addEventListener('change', function(){
	localStorage.setItem('notifications', this.checked);

	var status = document.getElementsByTagName('span')[3];
	status.innerHTML = 'Saved!';

	clearTimeout(notifications);
	notifications = setTimeout(function(){
		status.innerHTML = '';
	}, 750);
});
