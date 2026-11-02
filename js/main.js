window.addEventListener('DOMContentLoaded', () => {
    console.log('MASTERS system initialized...');

    // ── CRT Glitch Effect — centered logo only using GSAP ──
    const svgLogo = document.getElementById('svgLogo');
    if (svgLogo && window.gsap) {
        window.gsap.set(svgLogo, {
            xPercent: -50,
            yPercent: -50,
            left: '50%',
            top: '50%'
        });

        function triggerRandomGlitch() {
            const tl = window.gsap.timeline();
            tl.to(svgLogo, {
                x: () => (Math.random() - 0.5) * 8,
                y: () => (Math.random() - 0.5) * 6,
                filter: 'contrast(1.8) brightness(1.5) drop-shadow(3px 0 0 rgba(255, 0, 80, 0.8)) drop-shadow(-3px 0 0 rgba(0, 255, 255, 0.8))',
                duration: 0.08,
                repeat: 3,
                yoyo: true,
                ease: 'none'
            }).to(svgLogo, {
                x: 0,
                y: 0,
                filter: 'contrast(1.1) brightness(1.05)',
                duration: 0.15,
                ease: 'power2.out'
            });

            const nextGlitch = 12000 + Math.random() * 8000;
            setTimeout(triggerRandomGlitch, nextGlitch);
        }
        setTimeout(triggerRandomGlitch, 5000);
    }
});
