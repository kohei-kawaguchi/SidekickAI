const stage = document.getElementById('stage');
const character = document.getElementById('character');
const line = document.getElementById('line');
const detail = document.getElementById('detail');

window.sidekick.onStatus((status) => {
  if (status.image !== undefined) character.src = status.image;
  stage.className = status.state;
  line.textContent = status.line;
  detail.textContent = status.source === 'sidekick' ? '' : [status.source, status.message].filter(Boolean).join(': ');
});
