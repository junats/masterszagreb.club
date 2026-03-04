/**
 * Audio-Reactive Logo Border
 * 
 * - CSS border + black bg always visible (logo-glitch.css)
 * - Audio drives subtle border width pulse and glow on bass
 */
import { CONFIG } from './config.js';

export class AudioBorder {
    constructor() {
        this.audioCtx = null;
        this.analyser = null;
        this.dataArray = null;
        this.audios = [];
        this.sources = [];
        this.logo = document.getElementById('svgLogo');
        this.isPlaying = false;
        this.animFrameId = null;
    }

    async init() {
        if (!this.logo) return;

        if (CONFIG.audioLoops && CONFIG.audioLoops.length > 0) {
            CONFIG.audioLoops.forEach(loopConfig => {
                const audio = new Audio(loopConfig.url);
                audio.loop = true;
                audio.volume = loopConfig.volume || 1.0;
                audio.crossOrigin = 'anonymous';
                this.audios.push(audio);
            });

            const startAudio = () => {
                if (this.isPlaying) return;
                this.startAnalysis();
                document.removeEventListener('click', startAudio);
                document.removeEventListener('touchstart', startAudio);
            };
            document.addEventListener('click', startAudio);
            document.addEventListener('touchstart', startAudio);
        }

        console.log(`🎵 AudioBorder: Ready with ${this.audios.length} tracks — click to start audio`);
    }

    startAnalysis() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.75;
            this.analyser.connect(this.audioCtx.destination);
            
            // Connect every audio track to the shared analyser
            this.audios.forEach(audio => {
                const source = this.audioCtx.createMediaElementSource(audio);
                source.connect(this.analyser);
                this.sources.push(source);
            });

            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            // Play all tracks
            const playPromises = this.audios.map(audio => audio.play());
            Promise.all(playPromises).then(() => {
                this.isPlaying = true;
                console.log('🎵 AudioBorder: Playing all tracks');
                this.animate();
            }).catch(err => console.warn('AudioBorder play failed', err));
        } catch (err) {
            console.warn('AudioBorder: Web Audio error', err);
        }
    }

    animate() {
        this.animFrameId = requestAnimationFrame(() => this.animate());

        this.analyser.getByteFrequencyData(this.dataArray);
        const bassN = this.getRange(0, 10) / 255;

        // During glitch animation: clear ALL inline styles so CSS keyframes have full control
        if (this.logo.classList.contains('glitch')) {
            this.logo.style.removeProperty('transform');
            this.logo.style.removeProperty('filter');
            this.logo.style.removeProperty('border-width');
            this.logo.style.removeProperty('box-shadow');
            return;
        }

        // Audio pulse on CSS border
        if (bassN > 0.1) {
            const glow = 5 + bassN * 20;
            const bw = 2 + bassN * 2;
            this.logo.style.borderWidth = `${bw}px`;
            this.logo.style.boxShadow = `0 0 ${glow}px rgba(255,255,255,${bassN * 0.3})`;
        } else {
            this.logo.style.borderWidth = '2px';
            this.logo.style.boxShadow = 'none';
        }

        // Scale on bass
        if (bassN > 0.5) {
            const scale = 1 + (bassN - 0.5) * 0.04;
            this.logo.style.transform = `translate(-50%, -50%) scale(${scale})`;
        } else {
            this.logo.style.transform = 'translate(-50%, -50%)';
        }
    }

    getRange(start, end) {
        if (!this.dataArray) return 0;
        let sum = 0;
        for (let i = start; i < end && i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        return sum / (end - start);
    }

    stop() {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        if (this.audios && this.audios.length > 0) {
            this.audios.forEach(audio => audio.pause());
        }
        if (this.audioCtx) this.audioCtx.close();
        this.isPlaying = false;
    }
}
