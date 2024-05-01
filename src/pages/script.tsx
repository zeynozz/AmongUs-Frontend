const card: HTMLElement | null = document.getElementById('card');
const reader: HTMLElement | null = document.getElementById('reader');
let active: boolean = false;
let initialX: number | undefined;
let timeStart: number | undefined;
let timeEnd: number | undefined;
const soundAccepted: HTMLAudioElement = new Audio('https://thomaspark.co/projects/among-us-card-swipe/audio/CardAccepted.mp3');
const soundDenied: HTMLAudioElement = new Audio('https://thomaspark.co/projects/among-us-card-swipe/audio/CardDenied.mp3');

document.addEventListener('mousedown', dragStart);
document.addEventListener('mouseup', dragEnd);
document.addEventListener('mousemove', drag);
document.addEventListener('touchstart', dragStart);
document.addEventListener('touchend', dragEnd);
document.addEventListener('touchmove', drag);

function dragStart(e: MouseEvent | TouchEvent) {
    if (!card || e.target !== card) return;

    if (e.type === 'touchstart') {
        initialX = (e as TouchEvent).touches[0].clientX;
    } else {
        initialX = (e as MouseEvent).clientX;
    }

    timeStart = performance.now();
    if (card.classList.contains('slide')) {
        card.classList.remove('slide');
    }
    active = true;
}

function dragEnd(e: MouseEvent | TouchEvent) {
    if (!active || !initialX || !timeStart) return;

    e.preventDefault();
    let x: number;
    let status: string | undefined;

    if (e.type === 'touchend') {
        x = (e as TouchEvent).touches[0].clientX - initialX;
    } else {
        x = (e as MouseEvent).clientX - initialX;
    }

    if (x < (reader?.offsetWidth || 0)) {
        status = 'invalid';
    }

    timeEnd = performance.now();
    if (!card.classList.contains('slide')) {
        card.classList.add('slide');
    }
    active = false;

    setTranslate(0);
    setStatus(status);
}

function drag(e: MouseEvent | TouchEvent) {
    if (!active || !initialX) return;

    e.preventDefault();
    let x: number;

    if (e.type === 'touchmove') {
        x = (e as TouchEvent).touches[0].clientX - initialX;
    } else {
        x = (e as MouseEvent).clientX - initialX;
    }

    setTranslate(x);
}

function setTranslate(x: number) {
    if (!card || !reader) return;

    if (x < 0) {
        x = 0;
    } else if (x > reader.offsetWidth) {
        x = reader.offsetWidth;
    }

    x -= (card.offsetWidth / 2);

    card.style.transform = 'translateX(' + x + 'px)';
}

function setStatus(status: string | undefined) {
    if (!reader || !status || !timeStart || !timeEnd) return;

    let duration = timeEnd - timeStart;

    if (duration > 700) {
        status = 'slow';
    } else if (duration < 400) {
        status = 'fast';
    } else {
        status = 'valid';
    }

    reader.dataset.status = status;
    playAudio(status);
}

function playAudio(status: string | undefined) {
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
