document.addEventListener('DOMContentLoaded', function(){
	var input = document.getElementsByTagName('input')[0];
	input.value = localStorage.getItem('interval');
});

var timeout;
document.querySelector('input').addEventListener('input', function(x){
	if(this.value < 5) this.value = 5;
	if(this.value > 1440) this.value = 1440;

	localStorage.setItem('interval', this.value);

	var status = document.getElementsByTagName('span')[0];
	status.innerHTML = 'Saved!';

	clearTimeout(timeout);
	timeout = setTimeout(function(){
		status.innerHTML = '';
	}, 750);
});
