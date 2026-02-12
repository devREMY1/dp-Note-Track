/* ========================= */
// Global
/* ========================= */

let appState = {
	projects: [],
	currentProjectId: null,
	isTracking: false,
	activeTrackingId: null,
	selectedDate: new Date().toISOString().split('T')[0],
	selectedMonth: new Date().getMonth(),
	selectedYear: new Date().getFullYear(),
	viewMode: 'day',
	monthsNames: [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	],
};

let timerInterval = null;

/* ========================= */
// LOCAL STORAGE
/* ========================= */

const save = () => {
	localStorage.setItem('trackApp', JSON.stringify(appState));
};

const loadData = () => {
	const data = localStorage.getItem('trackApp');

	if (data) {
		appState = JSON.parse(data);
	}
	if (appState.projects.length > 0 && !appState.currentProjectId) {
		appState.currentProjectId = appState.projects[0].id;
		console.log('Load-Проєкт ID:', appState.currentProjectId);
	}
};

/* ========================= */
// CALCULATIONS & DOM
/* ========================= */

const StatsTotal = document.getElementById('stats-total');
const projectSelect = document.getElementById('projectSelect');
const projectCurrent = document.getElementById('projectCurrent');
const projectDropdown = document.getElementById('projectDropdown');
const btnChange = document.getElementById('edit-project');
const sessionOutput = document.getElementById('sessions-output');
const del = document.getElementById('delete-project');
const dateFilter = document.getElementById('date-filter');
const addSessionBtn = document.getElementById('add-session');
const viewDayBtn = document.getElementById('view-day');
const viewWeekBtn = document.getElementById('view-week');
const viewMonthBtn = document.getElementById('view-month');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');

const msToTimeInput = ms => {
	if (!ms) return '';
	const date = new Date(ms);
	const h = String(date.getHours()).padStart(2, '0');
	const m = String(date.getMinutes()).padStart(2, '0');
	return `${h}:${m}`;
};

const isOverlapping = (start, end, sessions, currentIndex) => {
	return sessions.some((s, idx) => {
		if (idx === Number(currentIndex)) return false;
		if (!s.end) return false;

		return start < s.end && end > s.start;
	});
};

const formatTime = totalSeconds => {
	if (!totalSeconds || totalSeconds < 0) return '00:00:00';

	const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
	const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
	const s = String(totalSeconds % 60).padStart(2, '0');

	return `${h}:${m}:${s}`;
};

const recalculateTotal = project => {
	project.totalTimer = project.sessions.reduce((acc, session) => {
		if (session.start && session.end) {
			return acc + Math.floor((session.end - session.start) / 1000);
		}
		return acc;
	}, 0);
};

/* ========================= */
// LOGIC
/* ========================= */

const createProject = () => {
	const inputElement = document.getElementById('input-proj');
	const text = inputElement.value;
	if (appState.projects.some(p => p.name === text)) {
		alert('This name already exists');
		return;
	}

	if (text === '') return false;

	let idTrack = Date.now();
	appState.projects.push({
		id: idTrack,
		name: text,
		totalTimer: 0,
		sessions: [],
	});

	if (appState.projects.length === 1) {
		appState.currentProjectId = idTrack;
	}

	save();
	inputElement.value = '';
	render();

	return false;
};

const deleteProject = () => {
	if (!confirm('Are you sure you want to delete this project?')) return;

	appState.projects = appState.projects.filter(
		p => p.id !== appState.currentProjectId,
	);

	appState.currentProjectId =
		appState.projects.length > 0 ? appState.projects[0].id : null;

	save();
	render();
};

/* ========================= */

projectCurrent.addEventListener('click', () => {
	projectSelect.classList.toggle('open');
});

document.addEventListener('click', e => {
	if (!projectSelect.contains(e.target)) {
		projectSelect.classList.remove('open');
	}
});

btnChange.addEventListener('click', () => {
	const project = appState.projects.find(
		p => p.id === appState.currentProjectId,
	);

	if (!project) return;

	const newName = prompt('New project name:', project.name);
	if (!newName || newName.trim() === '') return;
	if (appState.projects.some(p => p.name === newName)) {
		alert('This name already exists');
		return;
	}

	project.name = newName.trim();
	save();
	render();
});

del.addEventListener('click', () => {
	deleteProject();
});

/* ========================= */
// TIMER LOGIC
/* ========================= */

const startTracking = () => {
	if (!appState.currentProjectId) return alert('');
	if (appState.isTracking) return;
	const project = appState.projects.find(
		p => p.id === appState.currentProjectId,
	);

	if (project) {
		appState.isTracking = true;
		appState.activeTrackingId = appState.currentProjectId;
		project.sessions.push({
			start: Date.now(),
			end: null,
		});
		save();
		timerInterval = setInterval(updateActiveTimer, 1000);
	}
	save();
};

const stopTracking = () => {
	if (!appState.isTracking) return;
	const project = appState.projects.find(
		p => p.id === appState.currentProjectId,
	);
	if (project) {
		const lastSession = project.sessions[project.sessions.length - 1];
		lastSession.end = Date.now();

		const sessionDuration = Math.floor(
			(lastSession.end - lastSession.start) / 1000,
		);

		project.totalTimer += sessionDuration;

		appState.isTracking = false;
		appState.activeTrackingId = null;

		clearInterval(timerInterval);
		timerInterval = null;
		document.getElementById('active-timer').textContent = '00:00:00';
		save();
		render();
	}
};

const updateActiveTimer = () => {
	if (!appState.isTracking) return;

	const project = appState.projects.find(
		p => p.id === appState.currentProjectId,
	);

	if (!project) return;

	const lastSession = project.sessions[project.sessions.length - 1];
	const totalSeconds = Math.floor((Date.now() - lastSession.start) / 1000);

	const hours = Math.floor(totalSeconds / 3600);
	const min = Math.floor((totalSeconds % 3600) / 60);
	const sec = totalSeconds % 60;

	const hDisplay = String(hours).padStart(2, '0');
	const mDisplay = String(min).padStart(2, '0');
	const sDisplay = String(sec).padStart(2, '0');

	document.getElementById('active-timer').textContent =
		`${hDisplay}:${mDisplay}:${sDisplay}`;
};

const updateButtons = () => {
	const isToday =
		appState.selectedDate === new Date().toISOString().split('T')[0];
	if (startBtn) {
		startBtn.disabled = !isToday || appState.isTracking;
	}
	if (stopBtn) {
		const isCorrectProject =
			appState.currentProjectId === appState.activeTrackingId;

		stopBtn.disabled = !appState.isTracking || !isCorrectProject;
		stopBtn.style.opacity = stopBtn.disabled ? '0.4' : '1';
		stopBtn.title = !isCorrectProject
			? 'You can only stop the timer for the project you are currently tracking'
			: '';
	}
};

/* ========================= */
// STATISTICS
/* ========================= */

const calculateStats = (specificProject = null) => {
	let today = 0;
	let week = 0;
	let monthTotal = 0;
	let total = 0;

	const projectsToCount = specificProject
		? [specificProject]
		: appState.projects;

	const now = Date.now();
	const todayStr = new Date().toDateString();
	const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

	projectsToCount.forEach(project => {
		project.sessions.forEach(session => {
			if (!session.end) return;

			const duration = Math.floor((session.end - session.start) / 1000);
			const sDate = new Date(session.start);

			if (sDate.toDateString() === todayStr) {
				today += duration;
			}

			if (session.start > weekAgo) {
				week += duration;
			}

			if (
				sDate.getMonth() === appState.selectedMonth &&
				sDate.getFullYear() === appState.selectedYear
			) {
				monthTotal += duration;
			}

			total += duration;
		});
	});

	return { today, week, monthTotal, total };
};

const addManualSession = () => {
	const project = appState.projects.find(
		p => p.id === appState.currentProjectId,
	);

	if (!project) return alert('No project selected');

	const baseDate = new Date(appState.selectedDate);
	baseDate.setHours(9, 0, 0, 0);
	const newSession = {
		start: baseDate.getTime(),
		end: baseDate.getTime() + 3600000,
	};

	project.sessions.push(newSession);
	recalculateTotal(project);
	save();
	render();
};
/* ========================= */

dateFilter.addEventListener('change', event => {
	appState.selectedDate = event.target.value;
	save();
	render();
});

sessionOutput.addEventListener('focusout', event => {
	const project = appState.projects.find(
		p => p.id === appState.currentProjectId,
	);
	if (!project) return;

	if (event.target.tagName === 'INPUT') {
		const index = Number(event.target.dataset.index);
		const type = event.target.dataset.type;
		const newValue = event.target.value;

		const session = project.sessions[index];

		const tempDate = new Date(session[type] || session.start);
		const [h, m] = newValue.split(':');
		tempDate.setHours(h, m, 0, 0);
		const newTime = tempDate.getTime();

		const potentialStart = type === 'start' ? newTime : session.start;
		const potentialEnd = type === 'end' ? newTime : session.end;

		if (potentialEnd && potentialStart >= potentialEnd) {
			alert('The end cannot be earlier than or equal to the beginning!');
			render();
			return;
		}

		if (isOverlapping(potentialStart, potentialEnd, project.sessions, index)) {
			alert('This time slot is already taken by another session!');
			render();
			return;
		}

		session[type] = newTime;

		recalculateTotal(project);
		save();
		render();
	}
});

sessionOutput.addEventListener('click', event => {
	const project = appState.projects.find(
		p => p.id === appState.currentProjectId,
	);
	if (!project) return;

	if (event.target.tagName === 'BUTTON') {
		const index = event.target.dataset.index;

		project.sessions.splice(index, 1);

		recalculateTotal(project);
		save();
		render();
	}
});

addSessionBtn.addEventListener('click', () => {
	addManualSession();
});

/* ========================= */
// RENDER
/* ========================= */

const render = () => {
	const currentProject = appState.projects.find(
		p => p.id === appState.currentProjectId,
	);
	const projectStats = calculateStats(currentProject);

	renderProjectList();
	renderSessions(currentProject);
	renderMonthPicker();
	renderStats(projectStats);
	startBtnCheker();
	updateButtons();
};

const startBtnCheker = () => {
	const today = new Date().toISOString().split('T')[0];
	const startBtn = document.getElementById('start-btn');

	if (appState.selectedDate !== today) {
		startBtn.disabled = true;
		startBtn.title = 'You can only track time for the current day';
	} else {
		startBtn.disabled = false;
		startBtn.title = '';
	}
};

const renderProjectList = () => {
	projectDropdown.innerHTML = '';

	if (appState.projects.length === 0) {
		projectCurrent.textContent = 'No projects';
		return;
	}

	const currentProject = appState.projects.find(
		p => p.id === appState.currentProjectId,
	);
	projectCurrent.textContent = currentProject
		? currentProject.name
		: 'Select a project';

	appState.projects.forEach(project => {
		const item = document.createElement('div');
		item.className = 'project-item';
		if (project.id === appState.currentProjectId) item.classList.add('active');
		item.textContent = project.name;

		item.addEventListener('click', () => {
			appState.currentProjectId = project.id;
			save();
			render();
			projectSelect.classList.remove('open');
		});
		projectDropdown.appendChild(item);
	});
};

const renderSessions = currentProject => {
	const output = document.getElementById('sessions-output');
	if (!output || !currentProject) return;
	output.innerHTML = '';

	const selDate = new Date(appState.selectedDate);

	currentProject.sessions.forEach((item, index) => {
		const itemDate = new Date(item.start);
		let isVisible = false;

		if (appState.viewMode === 'day') {
			isVisible = itemDate.toDateString() === selDate.toDateString();
		} else if (appState.viewMode === 'week') {
			const startOfWeek = new Date(selDate);
			startOfWeek.setDate(selDate.getDate() - (selDate.getDay() || 7) + 1);
			startOfWeek.setHours(0, 0, 0, 0);

			const endOfWeek = new Date(startOfWeek);
			endOfWeek.setDate(startOfWeek.getDate() + 6);
			endOfWeek.setHours(23, 59, 59, 999);

			isVisible = itemDate >= startOfWeek && itemDate <= endOfWeek;
		} else if (appState.viewMode === 'month') {
			isVisible =
				itemDate.getMonth() === selDate.getMonth() &&
				itemDate.getFullYear() === selDate.getFullYear();
		}

		if (isVisible) {
			const dateP = document.createElement('p');
			const inputStart = document.createElement('input');
			const inputStop = document.createElement('input');
			const delBtn = document.createElement('button');
			const div = document.createElement('div');
			const date = new Date(item.start).toLocaleDateString();

			dateP.textContent = `${date}`;
			inputStart.type = 'time';
			inputStart.dataset.index = index;
			inputStart.value = `${msToTimeInput(item.start)}`;
			inputStop.type = 'time';
			inputStop.dataset.index = index;
			inputStop.value = `${msToTimeInput(item.end)}`;
			delBtn.dataset.index = index;
			delBtn.textContent = '✖';
			inputStart.dataset.type = 'start';
			inputStop.dataset.type = 'end';

			div.appendChild(inputStart);
			div.appendChild(inputStop);
			div.appendChild(delBtn);
			div.classList.add('sessions-item');
			output.appendChild(dateP);
			output.appendChild(div);
		}
	});
};

const renderMonthPicker = () => {
	const picker = document.getElementById('month-picker');
	picker.innerHTML = '';

	appState.monthsNames.forEach((monthName, index) => {
		const div = document.createElement('div');
		div.textContent = monthName;
		div.classList.add('month-item');

		if (index === appState.selectedMonth) {
			div.classList.add('active');
		}

		div.addEventListener('click', () => {
			appState.selectedMonth = index;
			save();
			render();
		});

		picker.appendChild(div);
	});
};

const renderStats = project => {
	const stats = calculateStats();
	const set = (id, val) => {
		const el = document.getElementById(id);
		if (el) el.textContent = formatTime(val);
	};

	set('stats-today', project.today);
	set('stats-week', project.week);
	set('stats-month', project.monthTotal);
	set('stats-total', project.total);
	set('stats-global', stats.total);
};

/* ========================= */
// INIT
/* ========================= */

const setViewMode = mode => {
	appState.viewMode = mode;
	save();
	render();
};

viewDayBtn.addEventListener('click', () => setViewMode('day'));
viewWeekBtn.addEventListener('click', () => setViewMode('week'));
viewMonthBtn.addEventListener('click', () => setViewMode('month'));

startBtn.addEventListener('click', startTracking);
stopBtn.addEventListener('click', stopTracking);

loadData();

if (appState.isTracking) {
	timerInterval = setInterval(updateActiveTimer, 1000);
}

render();
