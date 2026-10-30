const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const glow = $('.cursor-glow');
document.addEventListener('mousemove', (event) => {
  if (!glow) return;
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

const musicBtn = $('#musicBtn');
const musicPlayer = $('#musicPlayer');
musicBtn?.addEventListener('click', () => {
  if (!musicPlayer) return;

  const isOpen = musicPlayer.hidden;
  musicPlayer.hidden = !isOpen;
  musicBtn.setAttribute('aria-expanded', String(isOpen));
  musicBtn.setAttribute('aria-label', isOpen ? 'Close music player' : 'Open music player');
});

const birthdayDate = new Date('2027-05-24T00:00:00').getTime();
function updateCountdown() {
  const countdown = $('#countdown');
  if (!countdown) return;

  const difference = Math.max(birthdayDate - Date.now(), 0);
  const days = Math.floor(difference / 86400000);
  const hours = Math.floor((difference % 86400000) / 3600000);
  const minutes = Math.floor((difference % 3600000) / 60000);
  const seconds = Math.floor((difference % 60000) / 1000);

  $('#days').textContent = String(days).padStart(2, '0');
  $('#hours').textContent = String(hours).padStart(2, '0');
  $('#mins').textContent = String(minutes).padStart(2, '0');
  $('#secs').textContent = String(seconds).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

const reasons = [
  'You have the cutest smile ever.',
  'You have nice feet.',
  'You have nice ass.',
  'Your armpits. No explanation.',
  'You’re nonchalant.',
  'You care deeply.',
  'You protect your co-alpha.',
  'Your laugh.',
  'Your unlaughable jokes.',
  'Your facial expressions.',
  'You glow without trying.',
  'You make everything better.',
  'You listen like home.',
  'You are effortlessly classy.',
  'You deserve the prettiest life.',
  'You are a whole comfort place.',
  'Your presence feels peaceful.',
  'You are pure main character energy.',
  'You make friendship feel precious.',
  'You are loved more than words.',
  'You bring calm into chaos.',
  'You make every photo feel special.',
  'You have the cutest little habits.',
  'Your paasar.'
];

const reasonGrid = $('#reasonGrid');
if (reasonGrid) {
  const imageFolder = reasonGrid.dataset.imageFolder || 'assets';
  const reasonImages = Array.from({ length: reasons.length }, (_, index) => `${imageFolder}/${index + 1}.jpg`);

  reasonGrid.innerHTML = reasons
    .map((reason, index) => {
      const image = reasonImages[index % reasonImages.length];
      return `
      <article class="reason-card reveal" tabindex="0">
        <div class="reason-inner">
          <div class="reason-front">
            <h3>${index + 1}</h3>
            <p>tap love note</p>
          </div>
          <div class="reason-back" style="background-image: linear-gradient(to bottom, rgba(62,50,50,.08), rgba(62,50,50,.18) 45%, rgba(62,50,50,.78)), url('${image}');">
            <p>${reason}</p>
          </div>
        </div>
      </article>`;
    })
    .join('');
}

$('#randomReasonBtn')?.addEventListener('click', () => {
  $('#randomReason').textContent = reasons[Math.floor(Math.random() * reasons.length)];
});

const quests = {
  'gotham-night-city': {
    title: 'The Case of the Missing Birthday Cake',
    description: 'A hacker has hidden Joshua’s lava cake somewhere in Night City. Team up with Batman, follow three clues tied to Joshua’s favorite things, and recover the cake before the birthday countdown runs out.',
    hasClues: true
  },
  'maanster-hunter': {
    title: 'The Great Birthday Hunt',
    description: 'Track the Lava Cake Wyvern through the birthday wilds, pick your weapon, and outsmart the monster to bring home Joshua’s birthday loot.',
    hasHunt: true
  },
  'formula-one': {
    title: 'The Birthday Grand Prix',
    description: 'Race through seven birthday stops. Hit the timing window at each stop to move your car around the map and reach the finish line.',
    hasRace: true
  },
  'duel-runner': {
    title: 'The Moon Run: Joshua’s Last Gig',
    description: 'One last job before the birthday celebration: gear up, crack a birthday-locked shard, and get it safely back to Joshua.',
    hasCyberpunk: true
  }
};

const questOrder = ['gotham-night-city', 'maanster-hunter', 'formula-one', 'duel-runner'];
const questProgressStorageKey = 'joshua-birthday-side-quest-progress';
const questWorlds = $$('.quest-world');
const questPanel = $('#questPanel');
const questReward = $('#questReward');
const batmanClues = $('#batmanClues');
const grandPrixGame = $('#grandPrixGame');
const monsterHuntGame = $('#monsterHuntGame');
const cyberpunkGame = $('#cyberpunkGame');
const huntTracks = $('#huntTracks');
const huntPreparation = $('#huntPreparation');
const huntBattle = $('#huntBattle');
const huntMapPins = $$('.hunt-map-pin');
const completeQuestButton = $('#completeQuest');
let selectedQuest = null;
let selectedQuestId = null;
let cyberpunkRound = 1;
let cyberpunkComplete = false;
let cyberpunkSequence = [];
let cyberpunkInputIndex = 0;
let cyberpunkPlaybackTimer = 0;
let cyberpunkIsPlaying = false;
let cyberpunkAudioContext = null;
let completedQuests = [];
let questProgressSaveWarning = false;

try {
  if (questWorlds.length) {
    const savedProgress = JSON.parse(localStorage.getItem(questProgressStorageKey) || '[]');
    if (!Array.isArray(savedProgress)) throw new TypeError('Saved quest progress is not a list.');
    const savedQuestIds = new Set(savedProgress);
    while (completedQuests.length < questOrder.length && savedQuestIds.has(questOrder[completedQuests.length])) {
      completedQuests.push(questOrder[completedQuests.length]);
    }
  }
} catch (error) {
  console.error('Could not load saved birthday quest progress.', error);
  questProgressSaveWarning = true;
}

function updateQuestProgress() {
  if (!questWorlds.length) return;
  const nextQuestIndex = completedQuests.length;
  questWorlds.forEach((world, index) => {
    const isComplete = index < nextQuestIndex;
    const isNext = index === nextQuestIndex;
    world.disabled = !isNext;
    world.classList.toggle('is-complete', isComplete);
    world.classList.toggle('is-locked', !isComplete && !isNext);
    world.setAttribute('aria-pressed', String(world.dataset.quest === selectedQuestId));
    world.querySelector('.quest-world-prompt').textContent = isComplete
      ? 'Completed ✓'
      : isNext
        ? 'Start this quest →'
        : 'Locked — finish the previous quest first';
  });

  const progress = $('#questProgress');
  const allQuestsComplete = nextQuestIndex === questOrder.length;
  questReward.hidden = !allQuestsComplete;
  progress.textContent = allQuestsComplete
    ? 'All four quests complete — choose your birthday dessert!'
    : `Quest ${nextQuestIndex + 1} of ${questOrder.length}: ${questWorlds[nextQuestIndex].querySelector('.quest-world-title').textContent}. Complete each quest to unlock the next.`;
  if (questProgressSaveWarning) progress.textContent += ' Progress may only last for this visit.';
}

function completeCurrentQuest() {
  if (questOrder[completedQuests.length] !== selectedQuestId) return;

  completedQuests.push(selectedQuestId);
  try {
    localStorage.setItem(questProgressStorageKey, JSON.stringify(completedQuests));
  } catch (error) {
    console.error('Could not save birthday quest progress.', error);
    questProgressSaveWarning = true;
  }

  selectedQuest = null;
  selectedQuestId = null;
  questPanel.hidden = true;
  $('#questFinale').hidden = true;
  updateQuestProgress();

  if (completedQuests.length === questOrder.length) {
    questReward.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  questWorlds[completedQuests.length].scrollIntoView({ behavior: 'smooth', block: 'center' });
}

let solvedClues = new Set();
let solvedHuntClues = new Set();
let selectedWeapon = '';
let huntHearts = 3;
let wyvernStamina = 3;
let huntTurnIndex = 0;
const huntClues = {
  vinyl: 'deep-tracks',
  lego: 'cave',
  crumbs: 'wyvern'
};
const huntTurns = [
  { move: 'The Lava Cake Wyvern charges straight at you!', counter: 'dodge' },
  { move: 'Its tail sweeps across the cave!', counter: 'guard' },
  { move: 'The wyvern takes a deep breath—here comes molten chocolate!', counter: 'dodge' }
];
let raceWins = 0;
let raceFrame = 0;
let raceStartedAt = 0;
let raceRunning = false;
let racePosition = 0;
let raceTargetPosition = 0;
const raceStops = [
  { name: 'Vinyl Alley', target: 22 },
  { name: 'LEGO Garage', target: 49 },
  { name: 'Polaroid Promenade', target: 76 },
  { name: 'Adventure Time Tunnel', target: 36 },
  { name: 'Cheesecake Chicane', target: 64 },
  { name: 'Lava Cake Corner', target: 17 },
  { name: 'Night City Sprint', target: 83 }
];
const raceTrack = $('#grandPrixTrack');
const raceProgress = $('#grandPrixProgress');
const raceCar = $('#raceCar');
const raceStopMarkers = $('#raceStopMarkers');
const raceIndicator = $('#raceIndicator');
const raceTarget = $('#raceTarget');
const raceStopButton = $('#raceStopButton');
const raceStopStatus = $('#raceStopStatus');
const raceFeedback = $('#raceFeedback');
const cyberpunkSequences = [
  [0, 2, 1],
  [3, 1, 0, 2],
  [2, 0, 3, 1, 2]
];
let cyberpunkPlaybackRun = 0;
const cyberpunkPadNames = ['Blue', 'Gold', 'Red', 'White'];
const cyberpunkFrequencies = [261.63, 329.63, 392, 523.25];

async function getCyberpunkAudioContext() {
  if (!window.AudioContext) throw new Error('This browser does not support signal audio.');
  if (!cyberpunkAudioContext) cyberpunkAudioContext = new window.AudioContext();
  if (cyberpunkAudioContext.state !== 'running') await cyberpunkAudioContext.resume();
  return cyberpunkAudioContext;
}

function playCyberpunkTone(note) {
  if (!cyberpunkAudioContext || cyberpunkAudioContext.state !== 'running') return;
  const oscillator = cyberpunkAudioContext.createOscillator();
  const volume = cyberpunkAudioContext.createGain();
  const startTime = cyberpunkAudioContext.currentTime;
  oscillator.type = 'sine';
  oscillator.frequency.value = cyberpunkFrequencies[note];
  volume.gain.setValueAtTime(0.0001, startTime);
  volume.gain.exponentialRampToValueAtTime(0.16, startTime + 0.02);
  volume.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3);
  oscillator.connect(volume);
  volume.connect(cyberpunkAudioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.31);
}

function resetCyberpunk() {
  window.clearTimeout(cyberpunkPlaybackTimer);
  cyberpunkIsPlaying = false;
  cyberpunkPlaybackRun += 1;
  cyberpunkRound = 1;
  cyberpunkComplete = false;
  cyberpunkSequence = [];
  cyberpunkInputIndex = 0;
  $('#cyberpunkRoundLabel').textContent = 'ROUND 1 / 3';
  $('#cyberpunkSignalMessage').textContent = 'Ready when you are, Joshua.';
  $('#playCyberpunkSignal').disabled = false;
  $('#playCyberpunkSignal').hidden = false;
  $('#playCyberpunkSignal').textContent = 'Play the signal';
  $('#replayCyberpunkSignal').hidden = true;
  $('#cyberpunkSignalPads').hidden = true;
  $('#cyberpunkSequence').replaceChildren();
  $('#cyberpunkFeedback').textContent = '';
  completeQuestButton.disabled = true;
  completeQuestButton.textContent = 'Sync all three signals first';
}

function updateCyberpunkProgress() {
  $('#cyberpunkRoundLabel').textContent = `ROUND ${cyberpunkRound} / ${cyberpunkSequences.length}`;
  const sequenceDisplay = $('#cyberpunkSequence');
  sequenceDisplay.replaceChildren();
  cyberpunkSequence.forEach((note, index) => {
    const marker = document.createElement('span');
    marker.className = 'cyberpunk-note';
    marker.setAttribute('aria-label', `Signal note ${index + 1}`);
    marker.textContent = '○';
    sequenceDisplay.append(marker);
  });
}

async function playCyberpunkSequence() {
  if (cyberpunkComplete || cyberpunkIsPlaying) return;
  cyberpunkIsPlaying = true;
  const playbackRun = ++cyberpunkPlaybackRun;
  try {
    await getCyberpunkAudioContext();
  } catch (error) {
    cyberpunkIsPlaying = false;
    console.error('Could not start Cyberpunk signal audio.', error);
    $('#cyberpunkFeedback').textContent = 'Sound could not start in this browser. Check audio settings and try again.';
    return;
  }
  if (playbackRun !== cyberpunkPlaybackRun) {
    cyberpunkIsPlaying = false;
    return;
  }

  cyberpunkSequence = cyberpunkSequences[cyberpunkRound - 1];
  cyberpunkInputIndex = 0;
  updateCyberpunkProgress();
  $('#cyberpunkSignalPads').hidden = true;
  $('#playCyberpunkSignal').disabled = true;
  $('#replayCyberpunkSignal').hidden = true;
  $('#cyberpunkSignalMessage').textContent = 'Listen close...';
  $('#cyberpunkFeedback').textContent = '';
  let noteIndex = 0;

  const playNextNote = () => {
    if (playbackRun !== cyberpunkPlaybackRun) return;
    if (noteIndex >= cyberpunkSequence.length) {
      cyberpunkPlaybackTimer = 0;
      cyberpunkIsPlaying = false;
      $('#cyberpunkSignalPads').hidden = false;
      $('#playCyberpunkSignal').disabled = false;
      $('#replayCyberpunkSignal').hidden = false;
      $('#playCyberpunkSignal').textContent = 'Replay signal';
      $('#cyberpunkSignalMessage').textContent = 'Your turn—tap them back in order.';
      return;
    }

    const pad = $(`.cyberpunk-pad[data-note="${cyberpunkSequence[noteIndex]}"]`);
    pad.classList.add('is-playing');
    playCyberpunkTone(cyberpunkSequence[noteIndex]);
    $('#cyberpunkSignalMessage').textContent = `${cyberpunkPadNames[cyberpunkSequence[noteIndex]]} note`;
    window.setTimeout(() => pad.classList.remove('is-playing'), 330);
    noteIndex += 1;
    cyberpunkPlaybackTimer = window.setTimeout(playNextNote, 620);
  }

  playNextNote();
}

function getRaceTargetWidth(stage) {
  return Math.max(4, 18 - stage * 2);
}

function setRaceTarget(stage, position) {
  raceTarget.style.width = `${getRaceTargetWidth(stage)}%`;
  raceTarget.style.left = `${position}%`;
}

if (raceTrack && raceStopMarkers) {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const trackLength = raceTrack.getTotalLength();
  raceProgress.style.strokeDasharray = `${trackLength}`;
  raceProgress.style.strokeDashoffset = `${trackLength}`;

  raceStops.forEach((stop, index) => {
    const point = raceTrack.getPointAtLength(trackLength * ((index + 1) / (raceStops.length + 1)));
    const marker = document.createElementNS(svgNamespace, 'g');
    marker.classList.add('race-stop-marker');
    marker.dataset.stop = String(index);
    marker.setAttribute('transform', `translate(${point.x} ${point.y})`);

    const circle = document.createElementNS(svgNamespace, 'circle');
    circle.setAttribute('r', '14');
    const label = document.createElementNS(svgNamespace, 'text');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dy', '5');
    label.textContent = String(index + 1);
    marker.append(circle, label);
    raceStopMarkers.append(marker);
  });
}

function updateRaceMap() {
  if (!raceTrack || !raceProgress || !raceCar) return;

  const trackLength = raceTrack.getTotalLength();
  const progress = Math.min(raceWins / (raceStops.length + 1), 1);
  const point = raceTrack.getPointAtLength(trackLength * progress);
  raceCar.setAttribute('x', String(point.x));
  raceCar.setAttribute('y', String(point.y));
  raceProgress.style.strokeDashoffset = String(trackLength * (1 - progress));
  raceStopMarkers.querySelectorAll('.race-stop-marker').forEach((marker, index) => {
    marker.classList.toggle('is-complete', index < raceWins);
  });
}

function resetGrandPrix() {
  raceWins = 0;
  raceRunning = false;
  cancelAnimationFrame(raceFrame);
  raceStopButton.disabled = false;
  raceFeedback.textContent = 'Time your stop and lock in the win!';
  raceStopButton.textContent = 'Start Stop 1';
  raceStopStatus.textContent = `Starting grid → Stop 1: ${raceStops[0].name}`;
  setRaceTarget(0, raceStops[0].target);
  updateRaceMap();
}

function resetMonsterHunt() {
  solvedHuntClues = new Set();
  selectedWeapon = '';
  huntHearts = 3;
  wyvernStamina = 3;
  huntTurnIndex = 0;
  huntTracks.hidden = false;
  huntPreparation.hidden = true;
  huntBattle.hidden = true;
  huntTracks.querySelectorAll('.hunt-clue').forEach((clue) => {
    clue.querySelectorAll('input').forEach((input) => {
      input.checked = false;
      input.disabled = false;
    });
    clue.querySelector('.check-hunt-clue').disabled = false;
    clue.querySelector('.hunt-clue-feedback').textContent = '';
  });
  huntMapPins.forEach((pin) => pin.classList.remove('is-found'));
  $$('.weapon-choice').forEach((weapon) => weapon.setAttribute('aria-pressed', 'false'));
  $('#startHunt').disabled = true;
  $('#startHunt').textContent = 'Choose your weapon to start';
  $('#huntFeedback').textContent = '';
  completeQuestButton.hidden = false;
  completeQuestButton.disabled = true;
  completeQuestButton.textContent = 'Defeat the wyvern to claim your loot';
}

function updateHuntStatus() {
  $('#huntHearts').textContent = `${'❤️ '.repeat(huntHearts)}${'🖤 '.repeat(3 - huntHearts)}`.trim();
  $('#huntHearts').setAttribute('aria-label', `${huntHearts} of 3 hunter hearts remaining`);
  const healthBar = $('#monsterHealthBar');
  healthBar.style.width = `${(wyvernStamina / 3) * 100}%`;
  healthBar.parentElement.setAttribute('aria-valuenow', String(wyvernStamina));
}

function showHuntTurn() {
  if (huntTurnIndex >= huntTurns.length) {
    $('#huntTurn').textContent = 'The Lava Cake Wyvern is defeated! The birthday loot is yours!';
    $('#huntActions').hidden = true;
    $('#huntFeedback').textContent = `${selectedWeapon} secured the victory! Hunter Rank 24 unlocked!`;
    completeQuestButton.hidden = false;
    completeQuestButton.disabled = false;
    completeQuestButton.textContent = 'Complete Maanster Hunter quest';
    return;
  }

  $('#huntActions').hidden = false;
  $('#huntTurn').textContent = huntTurns[huntTurnIndex].move;
  $$('.hunt-action').forEach((button) => {
    button.disabled = false;
  });
}

function animateRaceIndicator(timestamp) {
  if (!raceRunning) return;
  const elapsed = timestamp - raceStartedAt;
  const progress = (elapsed / 1900) % 2;
  racePosition = progress <= 1 ? progress * 100 : (2 - progress) * 100;
  raceIndicator.style.left = `${racePosition}%`;
  raceFrame = requestAnimationFrame(animateRaceIndicator);
}

updateQuestProgress();

questWorlds.forEach((world) => {
  world.addEventListener('click', () => {
    if (world.disabled || questOrder[completedQuests.length] !== world.dataset.quest) return;
    selectedQuest = quests[world.dataset.quest];
    if (!selectedQuest) return;
    selectedQuestId = world.dataset.quest;
    solvedClues = new Set();

    updateQuestProgress();

    $('#questTitle').textContent = selectedQuest.title;
    $('#questDescription').textContent = selectedQuest.description;
    batmanClues.hidden = !selectedQuest.hasClues;
    grandPrixGame.hidden = !selectedQuest.hasRace;
    monsterHuntGame.hidden = !selectedQuest.hasHunt;
    cyberpunkGame.hidden = !selectedQuest.hasCyberpunk;
    batmanClues.querySelectorAll('.clue-card').forEach((clue) => {
      clue.querySelectorAll('input').forEach((input) => {
        input.checked = false;
        input.disabled = false;
      });
      clue.querySelector('.check-clue').disabled = false;
      clue.querySelector('.clue-feedback').textContent = '';
    });
    completeQuestButton.disabled = Boolean(selectedQuest.hasClues || selectedQuest.hasCyberpunk);
    completeQuestButton.hidden = Boolean(selectedQuest.hasRace);
    completeQuestButton.textContent = selectedQuestId === 'duel-runner'
      ? 'Finish the birthday gig first'
      : 'Complete this quest';
    if (selectedQuest.hasRace) resetGrandPrix();
    if (selectedQuest.hasHunt) resetMonsterHunt();
    if (selectedQuest.hasCyberpunk) resetCyberpunk();
    questPanel.hidden = false;
    $('#questFinale').hidden = true;
    $$('.dessert-choice').forEach((choice) => choice.setAttribute('aria-pressed', 'false'));
    questPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

$('#playCyberpunkSignal')?.addEventListener('click', playCyberpunkSequence);
$('#replayCyberpunkSignal')?.addEventListener('click', playCyberpunkSequence);

$$('.cyberpunk-pad').forEach((button) => {
  button.addEventListener('click', () => {
    if (cyberpunkComplete || cyberpunkIsPlaying || !cyberpunkSequence.length || $('#cyberpunkSignalPads').hidden) return;
    const tappedNote = Number(button.dataset.note);
    playCyberpunkTone(tappedNote);
    if (tappedNote !== cyberpunkSequence[cyberpunkInputIndex]) {
      cyberpunkInputIndex = 0;
      updateCyberpunkProgress();
      $('#cyberpunkFeedback').textContent = 'Not quite—listen again and give it another go.';
      $('#replayCyberpunkSignal').hidden = false;
      return;
    }

    button.classList.add('is-playing');
    window.setTimeout(() => button.classList.remove('is-playing'), 250);
    cyberpunkInputIndex += 1;
    const matchedMarker = $('#cyberpunkSequence').children[cyberpunkInputIndex - 1];
    matchedMarker.classList.add('is-matched');
    matchedMarker.textContent = '●';
    $('#cyberpunkFeedback').textContent = `${cyberpunkInputIndex} of ${cyberpunkSequence.length} notes matched.`;
    if (cyberpunkInputIndex === cyberpunkSequence.length) {
      $('#cyberpunkSignalPads').hidden = true;
      $('#replayCyberpunkSignal').hidden = true;
      cyberpunkRound += 1;
      if (cyberpunkRound > cyberpunkSequences.length) {
        cyberpunkComplete = true;
        $('#cyberpunkRoundLabel').textContent = 'SIGNAL SYNCED';
        $('#cyberpunkSignalMessage').textContent = 'Joshua’s signal is back. Got your birthday shard!';
        $('#playCyberpunkSignal').hidden = true;
        $('#cyberpunkFeedback').textContent = 'Transmission complete. Happy birthday, Joshua! 💛';
        completeQuestButton.disabled = false;
        completeQuestButton.textContent = 'Complete Cyberpunk gig';
      } else {
        $('#cyberpunkRoundLabel').textContent = `ROUND ${cyberpunkRound} / ${cyberpunkSequences.length}`;
        $('#cyberpunkSignalMessage').textContent = 'Signal saved! Ready for the next one?';
        $('#playCyberpunkSignal').textContent = 'Play next signal';
        $('#playCyberpunkSignal').disabled = false;
      }
    }
  });
});

huntTracks?.querySelectorAll('.check-hunt-clue').forEach((button) => {
  button.addEventListener('click', () => {
    const clue = button.closest('.hunt-clue');
    const answer = clue.querySelector('input:checked');
    const feedback = clue.querySelector('.hunt-clue-feedback');
    if (!answer) {
      feedback.textContent = 'Choose a trail first, hunter.';
      return;
    }

    if (answer.value !== huntClues[clue.dataset.huntClue]) {
      feedback.textContent = 'That trail went cold. Try another clue.';
      return;
    }

    solvedHuntClues.add(clue.dataset.huntClue);
    $(`[data-map-clue="${clue.dataset.huntClue}"]`)?.classList.add('is-found');
    clue.querySelectorAll('input').forEach((input) => {
      input.disabled = true;
    });
    button.disabled = true;
    feedback.textContent = 'Trail found! 🐾';

    if (solvedHuntClues.size === 3) {
      huntPreparation.hidden = false;
      huntPreparation.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});

huntMapPins.forEach((pin) => {
  pin.addEventListener('click', () => {
    const clue = $(`[data-hunt-clue="${pin.dataset.mapClue}"]`);
    clue?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    clue?.querySelector('input:not(:disabled)')?.focus({ preventScroll: true });
  });
});

$$('.weapon-choice').forEach((button) => {
  button.addEventListener('click', () => {
    selectedWeapon = button.dataset.weapon;
    $$('.weapon-choice').forEach((weapon) => {
      weapon.setAttribute('aria-pressed', String(weapon === button));
    });
    $('#startHunt').disabled = false;
    $('#startHunt').textContent = `Hunt with ${selectedWeapon}`;
  });
});

$('#startHunt')?.addEventListener('click', () => {
  if (!selectedWeapon || solvedHuntClues.size !== 3) return;
  huntTracks.hidden = true;
  huntPreparation.hidden = true;
  huntBattle.hidden = false;
  $('#huntWeaponLabel').textContent = `Weapon selected: ${selectedWeapon}`;
  huntFeedback.textContent = 'Read the wyvern’s move and choose your response.';
  updateHuntStatus();
  showHuntTurn();
  huntBattle.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

$$('.hunt-action').forEach((button) => {
  button.addEventListener('click', () => {
    if (huntTurnIndex >= huntTurns.length) return;

    const turn = huntTurns[huntTurnIndex];
    if (button.dataset.action === turn.counter) {
      wyvernStamina -= 1;
      huntTurnIndex += 1;
      updateHuntStatus();
      huntFeedback.textContent = `Perfect ${button.dataset.action}! The wyvern is staggered—your ${selectedWeapon} lands a hit!`;
      showHuntTurn();
      return;
    }

    huntHearts -= 1;
    updateHuntStatus();
    if (huntHearts === 0) {
      huntHearts = 3;
      huntTurnIndex = 0;
      wyvernStamina = 3;
      updateHuntStatus();
      huntFeedback.textContent = 'The camp nurse patched you up! The wyvern recovered too—try the hunt again.';
      showHuntTurn();
      return;
    }

    huntFeedback.textContent = `Oof! That move caught you. ${huntHearts} ${huntHearts === 1 ? 'heart' : 'hearts'} left—try again!`;
  });
});

batmanClues?.querySelectorAll('.clue-card').forEach((clue) => {
  clue.querySelector('.check-clue').addEventListener('click', () => {
    const answer = clue.querySelector('input:checked');
    const feedback = clue.querySelector('.clue-feedback');
    if (!answer) {
      feedback.textContent = 'Choose an answer first, detective.';
      return;
    }

    const correctAnswers = {
      'record-store': 'race-track',
      hideout: 'lego-hideout',
      code: 'joker'
    };
    if (answer.value !== correctAnswers[clue.dataset.clue]) {
      feedback.textContent = 'Not quite—check the clue and try again.';
      return;
    }

    solvedClues.add(clue.dataset.clue);
    clue.querySelectorAll('input').forEach((input) => {
      input.disabled = true;
    });
    clue.querySelector('.check-clue').disabled = true;
    feedback.textContent = 'Clue solved! 🕵️';

    if (solvedClues.size === 3) {
      completeQuestButton.disabled = false;
      completeQuestButton.textContent = 'Complete Batman mission';
    }
  });
});

raceStopButton?.addEventListener('click', () => {
  if (!selectedQuest?.hasRace || raceWins > raceStops.length) return;

  if (!raceRunning) {
    raceRunning = true;
    raceStartedAt = performance.now();
    raceTargetPosition = raceWins < raceStops.length ? raceStops[raceWins].target : 50;
    setRaceTarget(raceWins, raceTargetPosition);
    raceStopButton.textContent = 'Tap to lock your time!';
    raceFeedback.textContent = 'The timing lights are moving—hit the button in the yellow zone!';
    raceFrame = requestAnimationFrame(animateRaceIndicator);
    return;
  }

  raceRunning = false;
  cancelAnimationFrame(raceFrame);
  const timingTolerance = getRaceTargetWidth(raceWins) / 2;
  if (Math.abs(racePosition - raceTargetPosition) <= timingTolerance) {
    if (raceWins === raceStops.length) {
      raceWins += 1;
      updateRaceMap();
      raceStopStatus.textContent = '🏁 Finish line reached!';
      raceFeedback.textContent = 'You won the Grand Prix! Birthday champion!';
      raceStopButton.textContent = 'Race complete!';
      raceStopButton.disabled = true;
      completeQuestButton.hidden = false;
      completeQuestButton.textContent = 'Complete Grand Prix quest';
      return;
    }

    const wonStop = raceStops[raceWins];
    raceWins += 1;
    updateRaceMap();

    if (raceWins === raceStops.length) {
      raceStopStatus.textContent = 'Final lap → Finish line!';
      raceFeedback.textContent = `You won ${wonStop.name}! One last timing challenge to reach the finish!`;
      raceStopButton.textContent = 'Race to the finish!';
      raceTargetPosition = 50;
      setRaceTarget(raceWins, raceTargetPosition);
    } else {
      raceStopStatus.textContent = `Stop ${raceWins + 1} of 7: ${raceStops[raceWins].name}`;
      raceFeedback.textContent = `Stop won: ${wonStop.name}! You’re moving up the map!`;
      raceStopButton.textContent = `Start Stop ${raceWins + 1}`;
      setRaceTarget(raceWins, raceStops[raceWins].target);
    }
  } else {
    raceFeedback.textContent = 'Missed the timing window! Try this stop again.';
    raceStopButton.textContent = raceWins === raceStops.length ? 'Retry finish line!' : `Retry Stop ${raceWins + 1}`;
  }
});

completeQuestButton?.addEventListener('click', () => {
  if (!selectedQuest) return;
  if (selectedQuest.hasClues && solvedClues.size < 3) return;
  if (selectedQuest.hasRace && raceWins < raceStops.length + 1) return;
  if (selectedQuest.hasHunt && (huntTurnIndex < huntTurns.length || wyvernStamina > 0)) return;
  if (selectedQuest.hasCyberpunk && !cyberpunkComplete) return;

  completeCurrentQuest();
});

$$('.dessert-choice').forEach((choice) => {
  choice.addEventListener('click', () => {
    $$('.dessert-choice').forEach((option) => {
      option.setAttribute('aria-pressed', String(option === choice));
    });
    $('#dessertMessage').textContent = `${choice.dataset.dessert} it is — birthday reward officially unlocked!`;
    $('#questFinale').hidden = false;
  });
});

const claimCards = $$('.claim-card');
const claimStorageKey = 'joshua-birthday-reward-claims';
let rewardClaims = {};

if (claimCards.length) {
  try {
    rewardClaims = JSON.parse(localStorage.getItem(claimStorageKey) || '{}');
    if (!rewardClaims || typeof rewardClaims !== 'object' || Array.isArray(rewardClaims)) {
      rewardClaims = {};
    }
  } catch (error) {
    console.error('Could not load saved birthday reward claims.', error);
    claimCards.forEach((card) => {
      card.querySelector('.claim-message').textContent = 'Could not load saved claims. Your rewards are still available this visit.';
    });
  }

  const updateClaimCard = (card) => {
    const limit = card.dataset.limit === 'unlimited' ? Infinity : Number(card.dataset.limit);
    const claimed = Number(rewardClaims[card.dataset.claim]) || 0;
    const remaining = card.querySelector('.claim-remaining');
    const button = card.querySelector('.claim-button');

    if (limit === Infinity) {
      remaining.textContent = `${claimed ? `${claimed} claimed · ` : ''}Unlimited claims`;
    } else {
      const available = Math.max(limit - claimed, 0);
      remaining.textContent = `${available} ${available === 1 ? 'claim' : 'claims'} available`;
      button.disabled = available === 0;
      if (available === 0) button.textContent = 'All claimed';
    }
  };

  claimCards.forEach((card) => {
    updateClaimCard(card);
    card.querySelector('.claim-button').addEventListener('click', () => {
      const reward = card.dataset.claim;
      const limit = card.dataset.limit === 'unlimited' ? Infinity : Number(card.dataset.limit);
      const claimed = Number(rewardClaims[reward]) || 0;
      const message = card.querySelector('.claim-message');

      if (claimed >= limit) return;

      rewardClaims[reward] = claimed + 1;
      let saveFailed = false;
      try {
        localStorage.setItem(claimStorageKey, JSON.stringify(rewardClaims));
      } catch (error) {
        console.error('Could not save birthday reward claim.', error);
        message.textContent = 'Claim noted for this visit, but it could not be saved.';
        saveFailed = true;
      }

      if (!saveFailed) {
        message.textContent = reward === 'maan-pays'
          ? 'Claimed! Pick what you want and Maan will pay ✨'
          : `Claimed! ${reward === 'kiss' ? 'Come collect your kiss 💋' : 'Your birthday treat is waiting 🎉'}`;
      }
      updateClaimCard(card);
    });
  });
}

const envelope = $('#envelope');
const letterText = `Ollllllld man detected!!!!!! Joke :3

You are one blessing that was given to me, and what I wish for you is more success and happiness in life!!!!! You have the best smile in the world, and I love how genuine it looks. I hope it never changes :D

Keep on shining, baba ko! Enjoy the website muna hehehe. I love you!!!!!!!!`;
let hasTypedLetter = false;

envelope?.addEventListener('click', () => {
  envelope.classList.add('open');
  if (hasTypedLetter) return;

  hasTypedLetter = true;
  let index = 0;
  const typedLetter = $('#typedLetter');
  const typing = setInterval(() => {
    typedLetter.textContent += letterText[index] || '';
    index += 1;
    if (index > letterText.length) clearInterval(typing);
  }, 35);
});

const cake = $('#birthdayCake') || $('.cake');
const cutCakeBtn = $('.cut-cake-btn');
const cakeStageText = $('#cakeStageText');
let cakeAnimationStarted = false;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

cutCakeBtn?.addEventListener('click', async () => {
  if (!cake || cakeAnimationStarted) return;

  cakeAnimationStarted = true;
  cutCakeBtn.disabled = true;

  cakeStageText.textContent = 'blowing the candles... 🌬️';
  cutCakeBtn.textContent = 'Blowing Candles...';
  cake.classList.add('blow');
  await wait(1500);

  cakeStageText.textContent = ' cake is cutting 🔪';
  cutCakeBtn.textContent = '';
  cake.classList.add('knife-in');
  await wait(1200);

  cakeStageText.textContent = ' into a slice... 🍰';
  cutCakeBtn.textContent = 'Cutting Slice...';
  cake.classList.add('sliced');
  await wait(900);

  cakeStageText.textContent = 'first slice for my Baba 🎉';
  cutCakeBtn.textContent = 'Cake Cut 🎉';

  if (typeof confetti === 'function') {
    confetti({ particleCount: 280, spread: 115, origin: { y: 0.62 } });
  }
});
