(async function MusicQuiz() {
    function waitForSpicetify() {
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (window.Spicetify &&
                    Spicetify.Platform &&
                    Spicetify.Platform.PlaylistAPI &&
                    Spicetify.ContextMenu &&
                    Spicetify.Player) {
                    clearInterval(check);
                    resolve();
                }
            }, 500);
        });
    }

    await waitForSpicetify();

    let isRu = false;
    try {
        const lang = Spicetify.Locale ? Spicetify.Locale.getLocale() : "en";
        isRu = lang === "ru" || lang.startsWith("ru");
    } catch (e) {}

    const TEXT = {
        menuItem: isRu ? "Угадай мелодию" : "Play Music Quiz",
        title: isRu ? "Угадай Мелодию" : "Music Quiz",
        loading: isRu ? "Загружаем треки..." : "Loading tracks...",
        listen: isRu ? "Слушать" : "Listen",
        addTime: isRu ? "+1 сек" : "+1 sec",
        inputPlaceholder: isRu ? "Название трека..." : "Song title...",
        check: isRu ? "Проверить" : "Check",
        skip: isRu ? "Пропустить (Сложный язык)" : "Skip (Hard Language)",
        hint: isRu ? "Используйте честно, если название на иероглифах или сложном языке" : "Use honestly for hard languages",
        score: isRu ? "Счет:" : "Score:",
        gameOver: isRu ? "Игра окончена!" : "Game Over!",
        correct: isRu ? "Верно!" : "Correct!",
        wrong: isRu ? "Неверно!" : "Wrong!",
        noTracks: isRu ? "Нет треков" : "No tracks",
        maxTimeReached: isRu ? "Больше нельзя добавить время" : "No more time can be added",
        playError: isRu ? "Не могу воспроизвести трек" : "Unable to play track",
        randomStart: isRu ? "Случайный старт" : "Random start"
    };

    if (!document.getElementById('mq-styles')) {
        const style = document.createElement('style');
        style.id = 'mq-styles';
        style.innerHTML = `
            .mq-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0,0,0,0.6);
                backdrop-filter: blur(6px);
                z-index: 99999;
                display: flex; align-items: center; justify-content: center;
                font-family: var(--spice-font-text);
            }
            .mq-modal {
                width: 720px; max-width: 92%; border-radius: 14px;
                background: rgba(6,6,6,0.98);
                padding: 34px 36px 42px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.6);
                color: #fff;
                position: relative;
                display: flex; flex-direction: column; align-items: center;
            }
            .mq-close-btn {
                position: absolute;
                top: 28px;
                right: 28px;
                background: #e91429;
                border: none;
                color: white;
                font-size: 18px;
                width: 40px; height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                z-index: 100000;
                box-shadow: 0 6px 18px rgba(0,0,0,0.45);
                transform: translateY(50%);
            }
            .mq-header {
                padding-bottom: 6px; font-size: 22px; font-weight: 700;
                display: flex; flex-direction: column; align-items: center;
            }
            .mq-subheader { opacity: 0.85; margin-top: 8px; font-size: 14px; }

            .mq-game-area {
                width: 100%; display: flex; flex-direction: column;
                align-items: center; margin-top: 12px;
            }
            .mq-note { font-size: 56px; margin: 12px 0; opacity: 0.95; }

            .mq-controls { display:flex; gap:12px; margin-bottom:12px; align-items:center; }

            .mq-input {
                background: #ffffff !important;
                border: 3px solid #0a8f3a !important;
                color: #000000 !important;
                padding: 12px 18px; border-radius: 999px;
                width: 420px; max-width: 90%; font-size: 16px; text-align: center; margin: 14px 0;
                box-shadow: 0 6px 18px rgba(0,0,0,0.3);
            }
            .mq-input:focus { outline: 4px solid rgba(29,185,84,0.12); }

            .mq-btn {
                background-color: #1db954 !important;
                color: #ffffff !important;
                border: none;
                padding: 10px 26px; border-radius: 999px; cursor: pointer; font-weight: 700;
                font-size: 14px; margin: 8px;
                box-shadow: 0 6px 18px rgba(0,0,0,0.28);
                transition: transform 0.08s;
                min-width: 120px;
            }
            .mq-btn:hover { transform: translateY(-3px); filter: brightness(1.03); }
            .mq-btn.secondary { background-color: #169c46 !important; }
            .mq-btn.skip-btn {
                background-color: #cd1a2b !important;
                font-size: 13px; padding: 8px 18px;
            }
            .mq-hint {
                font-size: 12px; opacity: 0.78; margin-top: 6px; max-width: 520px; text-align: center;
                color: rgba(255,255,255,0.9);
            }
            .mq-history {
                margin-top: 22px; width: 100%; max-width: 620px;
                border-top: 1px solid rgba(255,255,255,0.04); padding-top: 14px;
            }
            .mq-track-row {
                display: flex; align-items: center; padding: 8px;
                border-radius: 8px; margin-bottom: 8px; background: rgba(255,255,255,0.02);
            }
            .mq-cover { width: 44px; height: 44px; border-radius: 6px; margin-right: 12px; object-fit: cover; background: #222; }
            .mq-progress-wrapper {
                width: 66%; max-width: 520px; height: 10px; background: rgba(255,255,255,0.06);
                border-radius: 999px; overflow: hidden; margin-top: 8px;
            }
            .mq-progress {
                height: 100%; width: 0%; background: linear-gradient(90deg, rgba(29,185,84,1) 0%, rgba(29,185,84,0.8) 100%); transition: width 0.12s linear;
            }
            .mq-controls-bottom { display:flex; gap:10px; align-items:center; margin-top:8px; }
            .mq-small-toggle { font-size:13px; padding:6px 10px; border-radius:999px; border:1px solid rgba(255,255,255,0.06); background:transparent; color:rgba(255,255,255,0.9); cursor:pointer; }
            .mq-disabled { opacity: 0.5; pointer-events: none; transform: none; }
        `;
        document.head.appendChild(style);
    }

    let state = {
        isActive: false,
        tracks: [],
        currentIndex: 0,
        currentDuration: 1000,
        timeTokens: 5,
        score: 0,
        snippetPlaying: false,
        snippetTimeout: null,
        playCheckInterval: null,
        prevPlayerSnapshot: null,
        progressInterval: null,
        randomStart: false
    };

    async function fetchTracks(uri) {
        try {
            const playlistData = await Spicetify.Platform.PlaylistAPI.getContents(uri);
            if (!playlistData || !playlistData.items) return [];
            return playlistData.items
                .map(item => {
                    const t = item.type === 'track' ? item : (item.track || item);
                    if (!t || !t.uri || t.isLocal || t.isPlayable === false) return null;
                    return {
                        uri: t.uri,
                        name: t.name,
                        artist: t.artists && t.artists[0] ? t.artists[0].name : "Unknown",
                        cover: (t.album && t.album.images && t.album.images[0]?.url) || (t.images && t.images[0]?.url) || "",
                        status: 'pending'
                    };
                })
                .filter(Boolean);
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    function getPlayerSnapshot() {
        try {
            const data = Spicetify.Player.data || {};
            const prevUri = data.item && data.item.uri ? data.item.uri : null;
            const prevPos = data.progress_ms ?? data.position ?? 0;
            const wasPlaying = data.is_paused === false;
            return { prevUri, prevPos, wasPlaying };
        } catch (e) {
            return { prevUri: null, prevPos: 0, wasPlaying: false };
        }
    }

    async function restorePlayerSnapshot(snapshot, currentUri) {
        if (!snapshot) return;
        try {
            if (snapshot.prevUri && snapshot.prevUri !== currentUri) {
                await Spicetify.Player.playUri(snapshot.prevUri);
                if (typeof Spicetify.Player.seek === "function") {
                    Spicetify.Player.seek(snapshot.prevPos);
                }
                if (!snapshot.wasPlaying) {
                    Spicetify.Player.pause();
                }
            } else {
                if (typeof Spicetify.Player.seek === "function") {
                    Spicetify.Player.seek(snapshot.prevPos);
                }
                if (snapshot.wasPlaying) {
                    const data = Spicetify.Player.data || {};
                    if (data.is_paused) Spicetify.Player.play();
                } else {
                    Spicetify.Player.pause();
                }
            }
        } catch (e) {
            console.warn(e);
        }
    }

    async function playSnippet() {
        const track = state.tracks[state.currentIndex];
        if (!track) return;
        if (state.snippetPlaying) {
            stopSnippet(true);
            return;
        }
        state.snippetPlaying = true;
        const currentUri = track.uri;
        state.prevPlayerSnapshot = getPlayerSnapshot();
        const playBtn = document.getElementById('mq-play');
        if (playBtn) playBtn.classList.add('mq-disabled');

        try {
            await Spicetify.Player.playUri(currentUri);

            let attempts = 0;
            state.playCheckInterval = setInterval(async () => {
                attempts++;
                const data = Spicetify.Player.data || {};
                const nowUri = data.item && data.item.uri ? data.item.uri : "";
                const isPaused = !!data.is_paused;

                if (nowUri && nowUri.includes(currentUri) && !isPaused) {
                    clearInterval(state.playCheckInterval);
                    state.playCheckInterval = null;

                    try { Spicetify.Player.seek(0); } catch (e) {}

                    let seekPos = 0;
                    if (state.randomStart) {
                        const duration = data.item && data.item.duration_ms ? data.item.duration_ms : 180000;
                        const maxStart = Math.max(0, Math.floor(duration * 0.5));
                        seekPos = Math.floor(Math.random() * maxStart);
                        try { Spicetify.Player.seek(seekPos); } catch (e) {}
                    } else {
                        try { Spicetify.Player.seek(0); } catch (e) {}
                    }

                    const startTime = Date.now();
                    const total = state.currentDuration;
                    const progressBar = document.querySelector('.mq-progress');
                    if (progressBar) progressBar.style.width = '0%';

                    state.progressInterval = setInterval(() => {
                        const elapsed = Date.now() - startTime;
                        const pct = Math.min(100, Math.round((elapsed / total) * 100));
                        if (progressBar) progressBar.style.width = pct + '%';
                        if (elapsed >= total) {
                            clearInterval(state.progressInterval);
                            state.progressInterval = null;
                        }
                    }, 100);

                    state.snippetTimeout = setTimeout(async () => {
                        stopSnippet(true);
                    }, state.currentDuration);
                }

                if (attempts > 80) {
                    clearInterval(state.playCheckInterval);
                    state.playCheckInterval = null;
                    state.snippetPlaying = false;
                    if (playBtn) playBtn.classList.remove('mq-disabled');
                    Spicetify.showNotification(TEXT.playError);
                }
            }, 100);
        } catch (e) {
            console.error(e);
            state.snippetPlaying = false;
            if (playBtn) playBtn.classList.remove('mq-disabled');
            Spicetify.showNotification(TEXT.playError);
        }
    }

    async function stopSnippet(restorePrev) {
        if (state.playCheckInterval) {
            clearInterval(state.playCheckInterval);
            state.playCheckInterval = null;
        }
        if (state.snippetTimeout) {
            clearTimeout(state.snippetTimeout);
            state.snippetTimeout = null;
        }
        if (state.progressInterval) {
            clearInterval(state.progressInterval);
            state.progressInterval = null;
            const progressBar = document.querySelector('.mq-progress');
            if (progressBar) progressBar.style.width = '0%';
        }
        try { Spicetify.Player.pause(); } catch (e) {}
        const playBtn = document.getElementById('mq-play');
        if (playBtn) playBtn.classList.remove('mq-disabled');
        if (restorePrev && state.prevPlayerSnapshot) {
            await restorePlayerSnapshot(state.prevPlayerSnapshot, state.tracks[state.currentIndex]?.uri);
        }
        state.snippetPlaying = false;
    }

    function checkAnswer(input, target) {
        if (!input) return false;
        const val = input.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
        const ans = target.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
        if (val.length < 2) return false;
        return ans === val || (ans.includes(val) && val.length > 3);
    }

    function createOverlay() {
        const old = document.querySelector('.mq-overlay');
        if (old) {
            state.isActive = false;
            stopSnippet(false);
            old.remove();
        }

        const div = document.createElement('div');
        div.className = 'mq-overlay';
        div.innerHTML = `
            <div class="mq-modal" id="mq-modal">
                <button class="mq-close-btn" id="mq-close">✕</button>
                <div class="mq-header">
                    <div>${TEXT.title}</div>
                    <div class="mq-subheader" id="mq-score-display">${TEXT.score} 0</div>
                </div>
                <div class="mq-game-area" id="mq-content">
                    <div style="height:30px"></div>
                </div>
            </div>
        `;
        document.body.appendChild(div);

        const closeBtn = div.querySelector('#mq-close');
        closeBtn.addEventListener('click', () => {
            state.isActive = false;
            stopSnippet(true).finally(() => {
                div.remove();
                document.removeEventListener('keydown', keyHandler);
            });
        });

        function keyHandler(e) {
            if (!state.isActive) return;
            if (e.key === "Escape") {
                closeBtn.click();
            } else if (e.key === " " || e.code === "Space") {
                e.preventDefault();
                const play = document.getElementById('mq-play');
                if (play) play.click();
            } else if (e.key === "Enter") {
                const submit = document.getElementById('mq-submit');
                if (submit) submit.click();
            }
        }
        document.addEventListener('keydown', keyHandler);
    }

    function renderGame() {
        const content = document.getElementById('mq-content');
        if (!content) return;

        const track = state.tracks[state.currentIndex];
        if (!track) {
            content.innerHTML = `<h1 style="margin-bottom:6px">${TEXT.gameOver}</h1><h2 style="opacity:0.9">${state.score} / ${state.tracks.length}</h2>`;
            return;
        }

        if (state.timeTokens === undefined) state.timeTokens = 5;
        if (state.timeTokens === 5) state.currentDuration = 1000;

        content.innerHTML = `
            <div class="mq-note">🎵</div>
            <div id="mq-status" style="opacity:0.9;margin-bottom:12px;font-weight:700;">${(state.currentDuration/1000)} s | ${state.timeTokens} добавлений</div>
            <div class="mq-controls">
                <button class="mq-btn" id="mq-play">▶ ${TEXT.listen}</button>
                <button class="mq-btn secondary" id="mq-add">${TEXT.addTime}</button>
                <button class="mq-small-toggle" id="mq-random">${TEXT.randomStart}: ${state.randomStart ? 'ON' : 'OFF'}</button>
            </div>
            <div class="mq-progress-wrapper"><div class="mq-progress"></div></div>
            <input type="text" class="mq-input" id="mq-input" placeholder="${TEXT.inputPlaceholder}" autocomplete="off" spellcheck="false">
            <div><button class="mq-btn" id="mq-submit">${TEXT.check}</button></div>
            <div class="mq-controls-bottom">
                <button class="mq-btn skip-btn" id="mq-skip">${TEXT.skip}</button>
            </div>
            <div class="mq-hint">${TEXT.hint}</div>
            <div class="mq-history" id="mq-history"></div>
        `;

        const input = document.getElementById('mq-input');
        input.value = '';
        input.focus();

        const play = document.getElementById('mq-play');
        const add = document.getElementById('mq-add');
        const submitBtn = document.getElementById('mq-submit');
        const skipBtn = document.getElementById('mq-skip');
        const randomBtn = document.getElementById('mq-random');

        play.onclick = () => {
            if (state.snippetPlaying) {
                stopSnippet(true);
            } else {
                playSnippet();
            }
        };

        add.onclick = () => {
            if (state.timeTokens > 0) {
                state.timeTokens--;
                state.currentDuration += 1000;
                const status = document.getElementById('mq-status');
                if (status) status.innerText = `${(state.currentDuration/1000)} s | ${state.timeTokens} добавлений`;
                playSnippet();
            } else {
                Spicetify.showNotification(TEXT.maxTimeReached);
            }
        };

        randomBtn.onclick = () => {
            state.randomStart = !state.randomStart;
            randomBtn.innerText = `${TEXT.randomStart}: ${state.randomStart ? 'ON' : 'OFF'}`;
        };

        const submit = () => {
            if (state.snippetPlaying) stopSnippet(false);
            const isCorrect = checkAnswer(input.value, track.name);
            if (isCorrect) {
                track.status = 'correct';
                state.score++;
                Spicetify.showNotification(TEXT.correct);
            } else {
                track.status = 'wrong';
                Spicetify.showNotification(`${TEXT.wrong} ${track.name} - ${track.artist}`);
            }
            const scoreDisplay = document.getElementById('mq-score-display');
            if (scoreDisplay) scoreDisplay.innerText = `${TEXT.score} ${state.score}`;
            nextRound();
        };

        submitBtn.onclick = submit;
        input.addEventListener("keydown", function handler(e) {
            if (e.key === "Enter") submit();
        });

        skipBtn.onclick = () => {
            if (state.snippetPlaying) stopSnippet(false);
            track.status = 'skipped';
            nextRound();
        };

        renderHistory();

        setTimeout(() => {
            if (state.isActive) playSnippet();
        }, 700);
    }

    function nextRound() {
        stopSnippet(false);
        state.currentIndex++;
        state.timeTokens = 5;
        renderGame();
    }

    function renderHistory() {
        const container = document.getElementById('mq-history');
        if (!container) return;
        const history = state.tracks.slice(0, state.currentIndex).reverse().slice(0, 3);
        container.innerHTML = history.map(t => {
            const cover = t.cover ? t.cover : '';
            const statusIcon = t.status === 'correct' ? '✅' : t.status === 'skipped' ? '⏭️' : '❌';
            return `
            <div class="mq-track-row">
                <img src="${cover}" onerror="this.style.display='none'" class="mq-cover">
                <div style="flex:1;text-align:left;">
                    <div style="font-weight:700;">${t.name}</div>
                    <div style="font-size:12px;opacity:0.75;">${t.artist}</div>
                </div>
                <div style="font-size:20px;">${statusIcon}</div>
            </div>`;
        }).join('');
    }

    async function startGame(uris) {
        state.isActive = true;
        state.currentIndex = 0;
        state.score = 0;
        state.timeTokens = 5;
        state.currentDuration = 1000;
        createOverlay();
        const content = document.getElementById('mq-content');
        if (content) content.innerHTML = `<h2 style="opacity:0.7">${TEXT.loading}</h2>`;
        const tracks = await fetchTracks(uris[0]);
        if (!tracks || tracks.length === 0) {
            if (content) content.innerHTML = `<h3>${TEXT.noTracks}</h3>`;
            return;
        }
        state.tracks = tracks.sort(() => Math.random() - 0.5);
        renderGame();
    }

    const menuItem = new Spicetify.ContextMenu.Item(
        TEXT.menuItem,
        startGame,
        (uris) => {
            if (!uris || uris.length !== 1) return false;
            try {
                const uriObj = Spicetify.URI.fromString(uris[0]);
                return uriObj.type === Spicetify.URI.Type.PLAYLIST || uriObj.type === Spicetify.URI.Type.PLAYLIST_V2;
            } catch (e) {
                return false;
            }
        },
        "gamepad"
    );
    menuItem.register();

    window.addEventListener('beforeunload', () => {
        try { state.isActive = false; stopSnippet(false); } catch(e) {}
    });
})();
