const url = encodeURIComponent('https://soundcloud.com/kristijanmolnar/kristijan-molnar-live-at-masters-zagreb-25032016');
fetch('https://w.soundcloud.com/player/?url=' + url).then(r => console.log(r.status));
