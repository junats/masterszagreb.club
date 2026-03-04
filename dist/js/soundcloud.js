import { CONFIG } from './config.js';

export class SoundCloudManager {
    constructor() {
        this.iframe = document.getElementById('sc-widget');
        this.prevBtn = document.getElementById('sc-prev');
        this.nextBtn = document.getElementById('sc-next');
        
        if (!this.iframe || !this.prevBtn || !this.nextBtn || !CONFIG.soundcloudSets || CONFIG.soundcloudSets.length === 0) {
            return;
        }

        // SC Widget needs to be accessed via the global SC object loaded from api.js
        this.widget = SC.Widget(this.iframe);
        this.currentIndex = Math.floor(Math.random() * CONFIG.soundcloudSets.length);

        // Wait for the widget to be ready before interacting
        this.widget.bind(SC.Widget.Events.READY, () => {
            this.init();
        });
    }

    init() {
        // Load the random initial track
        this.loadCurrentTrack(false);

        // Event listeners for controls
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());
        
        console.log(`🎵 SoundCloudManager: Initialized with ${CONFIG.soundcloudSets.length} sets. Start index: ${this.currentIndex}`);
    }

    loadCurrentTrack(autoPlay = true) {
        const trackUrl = CONFIG.soundcloudSets[this.currentIndex];
        
        // Use neon green color and the provided track URL
        this.widget.load(trackUrl, {
            auto_play: autoPlay,
            color: '%2300ff41',
            hide_related: true,
            show_comments: false,
            show_user: true,
            show_reposts: false,
            show_teaser: false,
            visual: true
        });
    }

    playNext() {
        this.currentIndex = (this.currentIndex + 1) % CONFIG.soundcloudSets.length;
        this.loadCurrentTrack(true);
    }

    playPrevious() {
        this.currentIndex = (this.currentIndex - 1 + CONFIG.soundcloudSets.length) % CONFIG.soundcloudSets.length;
        this.loadCurrentTrack(true);
    }
}
