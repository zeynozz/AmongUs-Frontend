// Assuming an HTML structure with elements having IDs 'card' and 'reader'

const card: HTMLElement | null = document.getElementById('card');
const reader: HTMLElement | null = document.getElementById('reader');
let active: boolean = false;
let initialX: number | undefined;
let timeStart: number | undefined;
let timeEnd: number | undefined;
const soundAccepted: HTMLAudioElement = new Audio('https://thomaspark.co/projects/among-us-card-swipe/audio/CardAccepted.mp3');
const soundDenied: HTMLAudioElement = new Audio('https://thomaspark.co/projects/among-us-card-swipe/audio/CardDenied.mp3');

// Adding event listeners for mouse and touch events
document.addEventListener('mousedown', dragStart);
document.addEventListener('mouseup', dragEnd);
document.addEventListener('mousemove', drag);
document.addEventListener('touchstart', dragStart);
document.addEventListener('touchend', dragEnd);
document.addEventListener('touchmove', drag);

// Function to start dragging
function dragStart(e: MouseEvent | TouchEvent): void {
    if (!card || !(e.target instanceof HTMLElement && e.target === card)) return;

    initialX = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
    timeStart = performance.now();
    if (card.classList.contains('slide')) {
        card.classList.remove('slide');
    }
    active = true;
}

// Function to end dragging
function dragEnd(e: MouseEvent | TouchEvent): void {
    if (!active || !initialX || !timeStart) return;

    e.preventDefault();
    let x: number = e instanceof TouchEvent && e.changedTouches ? e.changedTouches[0].clientX - initialX : (e as MouseEvent).clientX - initialX;

    let status: string | undefined = x < (reader?.offsetWidth || 0) ? 'invalid' : undefined;

    timeEnd = performance.now();
    if (!card.classList.contains('slide')) {
        card.classList.add('slide');
    }
    active = false;

    setTranslate(0);
    setStatus(status);
}

// Function to handle dragging
function drag(e: MouseEvent | TouchEvent): void {
    if (!active || !initialX) return;

    e.preventDefault();
    let x: number = e instanceof TouchEvent ? e.touches[0].clientX - initialX : e.clientX - initialX;
    setTranslate(x);
}

// Function to set the translate value of the card
function setTranslate(x: number): void {
    if (!card || !reader) return;

    if (x < 0) {
        x = 0;
    } else if (x > reader.offsetWidth) {
        x = reader.offsetWidth;
    }

    x -= card.offsetWidth / 2;

    card.style.transform = `translateX(${x}px)`;
}

// Function to set the status of the reader
function setStatus(status: string | undefined): void {
    if (!reader || !status || !timeStart || !timeEnd) return;

    let duration = timeEnd - timeStart;

    status = duration > 700 ? 'slow' : duration < 400 ? 'fast' : 'valid';

    reader.dataset.status = status;
    playAudio(status);
}

// Function to play audio based on the status
function playAudio(status: string | undefined): void {
    if (!status) return;

    soundDenied.pause();
    soundAccepted.pause();
    soundDenied.currentTime = 0;
    soundAccepted.currentTime = 0;

    if (status === 'valid') {
        soundAccepted.play();
    } else {
        soundDenied.play();
    }
}
