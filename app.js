const signals = [
  { value: 24, label: 'NORTH LIGHT / GALE 7', text: 'GALE WARNING', note: 'North Light: wind climbs after 20:00. Avoid the outer shelf.' },
  { value: 57, label: 'RAVEN ROCK / CLEARING', text: 'CORRIDOR OPEN', note: 'Raven Rock: a narrow clear corridor forms east of the shoals.' },
  { value: 83, label: 'EAST BEACON / ROUTE', text: 'EASTBOUND SAFE', note: 'East Beacon: follow 041 degrees until the harbor lamps appear.' }
];
const frequency = document.querySelector('#frequency');
const output = document.querySelector('#frequencyOutput');
const lock = document.querySelector('#lockButton');
const screen = document.querySelector('#signalScreen');
const code = document.querySelector('#code');
const stateLine = document.querySelector('#screenState');
const log = document.querySelector('#log');
const decoded = document.querySelector('#decodedCount');
const broadcast = document.querySelector('#broadcastButton');
const footer = document.querySelector('#footerState');
const chart = document.querySelector('#chart');
const soundButton = document.querySelector('#soundButton');
let found = new Set();
let soundOn = false;
let audio;

function sound(kind) {
  if (!soundOn) return;
  audio ||= new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const notes = { tune: [180, .025], lock: [660, .12], reset: [220, .08], broadcast: [440, .36] };
  const [pitch, length] = notes[kind];
  oscillator.type = kind === 'broadcast' ? 'triangle' : 'square';
  oscillator.frequency.value = pitch;
  gain.gain.setValueAtTime(.045, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(); oscillator.stop(audio.currentTime + length);
}

function currentSignal() { return signals.find(signal => Math.abs(signal.value - Number(frequency.value)) <= 2 && !found.has(signal.value)); }
function tune() {
  const signal = currentSignal();
  output.value = (14.700 + Number(frequency.value) / 100).toFixed(3);
  screen.classList.toggle('tuned', Boolean(signal));
  lock.disabled = !signal;
  code.textContent = signal ? signal.text : '-- .- .-. .. -. . / .-- .- .-. -. .. -. --.';
  stateLine.textContent = signal ? `CLEAR CARRIER — ${signal.label}` : 'TUNE THE DIAL TO ISOLATE A SIGNAL';
  sound('tune');
}
function lockSignal() {
  const signal = currentSignal();
  if (!signal) return;
  found.add(signal.value);
  const item = log.children[found.size - 1];
  item.className = 'resolved';
  item.textContent = `[ ✓ ] ${signal.note}`;
  decoded.textContent = found.size;
  footer.textContent = found.size === 3 ? 'route ready to transmit' : `${3 - found.size} signal${3 - found.size === 1 ? '' : 's'} needed`;
  chart.classList.toggle('ready', found.size === 3);
  document.querySelector('#forecast').textContent = found.size === 3 ? 'All relays agree. The safe corridor runs east at 041°.' : 'Transmission logged. More evidence is required.';
  broadcast.disabled = found.size !== 3;
  frequency.value = Math.min(100, Number(frequency.value) + 9);
  sound('lock');
  tune();
}
function reset() { found = new Set(); frequency.value = 24; [...log.children].forEach((item, index) => { item.className = 'pending'; item.textContent = `[ ? ] Signal 0${index + 1} — unverified`; }); decoded.textContent = '0'; footer.textContent = '3 signals needed'; chart.classList.remove('ready'); document.querySelector('#forecast').textContent = 'Awaiting transmissions to build a safe route.'; broadcast.disabled = true; sound('reset'); tune(); }
function showDialog(id) { document.querySelector(id).showModal(); }
frequency.addEventListener('input', tune);
lock.addEventListener('click', lockSignal);
document.querySelector('#resetButton').addEventListener('click', reset);
broadcast.addEventListener('click', () => { sound('broadcast'); showDialog('#successDialog'); });
soundButton.addEventListener('click', () => { soundOn = !soundOn; soundButton.setAttribute('aria-pressed', soundOn); soundButton.textContent = `SOUND: ${soundOn ? 'ON' : 'OFF'}`; sound('lock'); });
document.querySelector('#briefButton').addEventListener('click', () => showDialog('#briefDialog'));
document.querySelectorAll('.close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.addEventListener('keydown', event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { frequency.value = Number(frequency.value) + (event.key === 'ArrowLeft' ? -1 : 1); frequency.dispatchEvent(new Event('input')); } if (event.key === 'Enter' && !lock.disabled) lockSignal(); });
setInterval(() => { document.querySelector('#clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }, 1000);
tune();

const boot = document.querySelector('#boot');
const windows = [...document.querySelectorAll('.window')];
let topWindow = 20;
function focusWindow(windowElement) { windows.forEach(item => item.classList.remove('active')); windowElement.classList.add('active'); windowElement.style.zIndex = ++topWindow; }
function openWindow(className) { const windowElement = document.querySelector(`.${className}`); focusWindow(windowElement); windowElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
document.querySelectorAll('[data-app]').forEach(button => button.addEventListener('click', () => openWindow(button.dataset.app)));
windows.forEach(windowElement => {
  const bar = windowElement.querySelector('header'); let drag;
  windowElement.addEventListener('pointerdown', () => focusWindow(windowElement));
  bar.addEventListener('pointerdown', event => { if (innerWidth < 801) return; drag = { x: event.clientX - windowElement.offsetLeft, y: event.clientY - windowElement.offsetTop }; bar.setPointerCapture(event.pointerId); });
  bar.addEventListener('pointermove', event => { if (!drag) return; windowElement.style.left = `${Math.max(0, Math.min(event.clientX - drag.x, document.querySelector('.desktop').clientWidth - windowElement.offsetWidth))}px`; windowElement.style.top = `${Math.max(0, Math.min(event.clientY - drag.y, 520))}px`; });
  bar.addEventListener('pointerup', () => { drag = null; });
});
const dismissBoot = () => boot.classList.add('done');
setTimeout(dismissBoot, 2100);
boot.addEventListener('pointerdown', dismissBoot);
document.addEventListener('keydown', event => { if (event.key === 'Escape') dismissBoot(); });
