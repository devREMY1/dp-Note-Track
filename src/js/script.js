let appState = {
	tasks: [],
	currGoalIndex: 0,
	weather: {
		lat: '',
		lon: '',
		temp: '--',
		humidity: '',
		city: 'Loading...',
		weather: '',
	},
	token: '',
	chatId: '',
	locality: { localName: '' },
	quote: { text: '', author: '' },
};

const todoOutput = document.getElementById('todo-output');
const clearBtn = document.getElementById('clear-tasks');
const rey = 'NWUzZWJmOGRjNmUwYjFlZmU';
const quoteLi = document.getElementById('quote-text');
const weatherLi = document.getElementById('weather');
const tgSubmit = document.getElementById('telegram-submit');
const tgWthBtn = document.getElementById('tg-wth-btn');
const and = 'MWRhZmYzZTExNzJhYjE4';
const WthSrcBtn = document.getElementById('wth-src-submit');

const save = () => {
	localStorage.setItem('myApp', JSON.stringify(appState));
};

const loadData = () => {
	const data = localStorage.getItem('myApp');
	if (data) appState = JSON.parse(data);
};

const render = () => {
	todoOutput.innerHTML = '';
	appState.tasks.forEach((task, index) => {
		const li = document.createElement('li');
		const p = document.createElement('p');
		const btn = document.createElement('button');
		li.textContent = task.text;
		p.textContent = task.date;
		btn.textContent = '✖';
		btn.classList.add('delete-btn');
		btn.dataset.index = index;
		li.appendChild(btn);
		todoOutput.appendChild(p);
		todoOutput.appendChild(li);
	});

	clearBtn.style.visibility = appState.tasks.length > 0 ? 'visible' : 'hidden';

	quoteLi.textContent = `${appState.quote.author}: ${appState.quote.text}`;
	weatherLi.textContent = `📍${appState.weather.city} | 🌡 ${appState.weather.temp}° | 💧${appState.weather.humidity}% | ☁️ ${appState.weather.weather}`;
};

const saveTelegramToken = () => {
	const tokenInput = document.getElementById('tg-token-input');
	if (!tokenInput.value.trim()) {
		alert('Please enter a valid Telegram bot token.');
		return;
	}
	appState.token = tokenInput.value.trim();
	save();
	tokenInput.value = '';
	getChatId(appState.token);
	return false;
};

const getChatId = async token => {
	try {
		const response = await fetch(
			`https://api.telegram.org/bot${token}/getUpdates`,
		);
		if (!response.ok) throw new Error('Telegram API Error');
		const data = await response.json();
		if (data.result.length > 0) {
			appState.chatId = data.result[0].message.chat.id;
			save();
		} else {
			throw new Error('No chat found. Send a message to your bot first.');
		}
	} catch (error) {
		console.error('Telegram error:', error);
		return null;
	}
};

const sendTelegramMessage = async text => {
	try {
		const token = appState.token;
		if (!token) {
			console.warn('Telegram token not set. Message not sent.');
			return;
		}
		const chatId = appState.chatId;
		if (!text) return;
		fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: chatId,
				text,
			}),
		});
	} catch (error) {
		console.error('Telegram error:', error);
	}
};

const getQuote = async () => {
	try {
		const response = await fetch('https://dummyjson.com/quotes');
		if (!response.ok) throw new Error('Quote API Error');
		const data = await response.json();
		const randomIndex = Math.floor(Math.random() * data.quotes.length);
		const randomQuote = data.quotes[randomIndex];
		appState.quote = { text: randomQuote.quote, author: randomQuote.author };
		render();
	} catch (error) {
		appState.quote = { text: 'Quote unavailable', author: 'System' };
		render();
	}
};

const getWeather = async cityName => {
	try {
		const respawn = atob(`${and + rey}`);
		const response = await fetch(
			`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&lang=en&units=metric&appid=${respawn}`,
		);
		if (!response.ok) throw new Error('Weather API Error');
		const data = await response.json();

		appState.weather = {
			lat: data.coord.lat,
			lon: data.coord.lon,
			temp: Math.round(data.main.temp),
			humidity: data.main.humidity,
			city: data.name,
			weather: data.weather[0].description,
		};

		reversGeocode();
		save();
		render();
	} catch (error) {
		console.error('Weather error:', error);
	}
};

const reversGeocode = async () => {
	try {
		const response = await fetch(
			`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${appState.weather.lat}&longitude=${appState.weather.lon}&localityLanguage=en`,
		);
		const data = await response.json();
		appState.locality.localName = data.locality;
		save();
	} catch (error) {
		console.error('Geocoding error:', error);
	}
};

const todoListInput = () => {
	const todoInput = document.getElementById('todo-input');
	const text = todoInput.value;
	if (text === '') return false;

	appState.tasks.push({ text, date: new Date().toLocaleTimeString() });
	sendTelegramMessage(`New task: ${text}`);
	save();
	todoInput.value = '';
	render();
	return false;
};

todoOutput.addEventListener('click', e => {
	if (e.target.tagName === 'BUTTON') {
		appState.tasks.splice(e.target.dataset.index, 1);
		save();
		render();
	}
});

clearBtn.addEventListener('click', () => {
	if (confirm('Clear all tasks?')) {
		appState.tasks = [];
		save();
		render();
	}
});

tgWthBtn.addEventListener('click', () => {
	const mapUrl = `https://www.google.com/maps/place/${appState.weather.city}`;
	const msg = `📍 City: ${appState.weather.city}\n🌡 Temp: ${appState.weather.temp}°\n💧 Humidity: ${appState.weather.humidity}%\n☁️ ${appState.weather.weather}\n🔗 Map: ${mapUrl}`;
	sendTelegramMessage(msg);
});

tgSubmit.addEventListener('click', () => {
	const input = document.getElementById('telegram-input');
	if (input.value) {
		sendTelegramMessage(input.value);
		input.value = '';
	}
});

const weatherSearch = () => {
	const WthSrcInput = document.getElementById('wth-search-input');
	const cityName = WthSrcInput.value.trim();
	if (cityName === '') return false;

	getWeather(cityName);
	WthSrcInput.value = '';
};
WthSrcBtn.addEventListener('click', weatherSearch);

document.getElementById('wth-search-input').addEventListener('keydown', e => {
	if (e.key === 'Enter') weatherSearch();
});

loadData();
getQuote();
render();
