(async function MusicQuiz() {
    function waitForSpicetify() {
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (Spicetify && 
                    Spicetify.Platform && 
                    Spicetify.Platform.PlaylistAPI && 
                    Spicetify.ContextMenu && 
                    Spicetify.Player) {
                    clearInterval(check);
                    resolve();
                }
            }, 1000);
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
        noTracks: isRu ? "Нет треков" : "No tracks"
    };

    if (!document.getElementById('mq-styles')) {
        const style = document.createElement('style');
        style.id = 'mq-styles';
        style.innerHTML = `
            .mq-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: var(--spice-main); 
                z-index: 99999;
                display: flex; flex-direction: column; font-family: var(--spice-font-text);
            }
            
            /* КНОПКА ЗАКРЫТИЯ - СПРАВА СВЕРХУ */
            .mq-close-btn {
                position: absolute;
                top: 30px;
                right: 30px; /* Сдвинул правее */
                background: #e91429; /* Красная для заметности */
                border: none;
                color: white;
                font-size: 20px;
                width: 40px; height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                z-index: 100000;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            }
            .mq-close-btn:hover { transform: scale(1.1); }

            .mq-header {
                padding: 20px; font-size: 24px; font-weight: bold;
                margin-top: 50px;
                display: flex; justify-content: center; align-items: center;
                flex-direction: column;
            }
            .mq-game-area {
                flex: 1; display: flex; flex-direction: column; 
                align-items: center; justify-content: center; overflow-y: auto;
                padding-bottom: 100px;
            }
            
            /* ПОЛЕ ВВОДА - ВСЕГДА БЕЛОЕ */
            .mq-input {
                background: #ffffff !important; 
                border: 2px solid #000 !important; 
                color: #000000 !important; 
                padding: 15px; border-radius: 30px; 
                width: 350px; font-size: 18px; text-align: center; margin: 20px 0;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            .mq-input:focus { outline: 4px solid #1db954; }

            /* КНОПКИ - ВСЕ ЗЕЛЕНЫЕ И ВИДИМЫЕ */
            .mq-btn {
                background-color: #1db954 !important; /* Цвет Спотифая */
                color: #ffffff !important; 
                border: none;
                padding: 12px 30px; border-radius: 50px; cursor: pointer; font-weight: bold; 
                font-size: 16px; margin: 8px; 
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                transition: transform 0.1s;
                min-width: 120px;
            }
            .mq-btn:hover { transform: scale(1.05); filter: brightness(1.1); }
            
            /* Кнопка Добавить время - чуть другой оттенок */
            .mq-btn.secondary { background-color: #169c46 !important; }
            
            /* Кнопка Скип - Красная/Оранжевая для отличия */
            .mq-btn.skip-btn { 
                background-color: #cd1a2b !important; 
                font-size: 14px; padding: 10px 20px;
            }

            .mq-hint {
                font-size: 12px; opacity: 0.8; margin-top: 5px; max-width: 300px; text-align: center;
            }
            
            .mq-history {
                margin-top: 30px; width: 100%; max-width: 500px;
                border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;
            }
            .mq-track-row { 
                display: flex; align-items: center; padding: 10px; 
                border-radius: 8px; margin-bottom: 6px; background: rgba(0,0,0,0.3);
            }
            .mq-cover { width: 40px; height: 40px; border-radius: 4px; margin-right: 15px; }
        `;
        document.head.appendChild(style);
    }

    let state = {
        isActive: false,
        tracks: [],
        currentIndex: 0,
        currentDuration: 1000,
        attempts: 5,
        score: 0
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

    async function playSnippet() {
        if (!state.tracks[state.currentIndex]) return;
        const uri = state.tracks[state.currentIndex].uri;
        
        try {
            Spicetify.Player.pause();
            
            await Spicetify.Player.playUri(uri);
            
            let attempts = 0;
            const waitForPlay = setInterval(() => {
                attempts++;
                const data = Spicetify.Player.data;
                
                if (attempts > 30) {
                    clearInterval(waitForPlay);
                    Spicetify.showNotification("Error: Internet too slow?");
                    return;
                }

                if (data && data.item && data.item.uri.includes(uri) && !data.is_paused) {
                    clearInterval(waitForPlay);
                  
                    Spicetify.Player.seek(0);
                    
                    setTimeout(() => {
                        if (state.isActive) {
                            Spicetify.Player.pause();
                        }
                    }, state.currentDuration);
                }
            }, 100);

        } catch (e) {
            console.error("Play failed:", e);
        }
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
        if (old) old.remove();

        const div = document.createElement('div');
        div.className = 'mq-overlay';
        div.innerHTML = `
            <button class="mq-close-btn">✕</button>
            <div class="mq-header">
                <div>${TEXT.title}</div>
                <div id="mq-score-display" style="opacity:0.7">${TEXT.score} 0</div>
            </div>
            <div class="mq-game-area" id="mq-content">
                <h2>${TEXT.loading}</h2>
            </div>
        `;
        
        div.querySelector('.mq-close-btn').onclick = () => {
            state.isActive = false;
            div.remove();
            Spicetify.Player.pause();
        };

        document.body.appendChild(div);
    }

    function renderGame() {
        const content = document.getElementById('mq-content');
        if (!content) return;

        const track = state.tracks[state.currentIndex];
        if (!track) {
            content.innerHTML = `<h1>${TEXT.gameOver}</h1><h2>${state.score} / ${state.tracks.length}</h2>`;
            return;
        }

        if (state.attempts === 5) state.currentDuration = 1000;

        content.innerHTML = `
            <div style="font-size:60px;margin-bottom:20px;">🎵</div>
            <div id="mq-status" style="opacity:0.9;margin-bottom:10px;font-weight:bold;">${state.currentDuration/1000} s | ${state.attempts} attempts</div>
            
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <button class="mq-btn" id="mq-play">▶ ${TEXT.listen}</button>
                <button class="mq-btn secondary" id="mq-add">${TEXT.addTime}</button>
            </div>

            <input type="text" class="mq-input" id="mq-input" placeholder="${TEXT.inputPlaceholder}" autocomplete="off">
            
            <div><button class="mq-btn" id="mq-submit">${TEXT.check}</button></div>
            
            <div style="margin-top: 15px; display:flex; flex-direction:column; align-items:center;">
                <button class="mq-btn skip-btn" id="mq-skip">${TEXT.skip}</button>
                <div class="mq-hint">${TEXT.hint}</div>
            </div>

            <div class="mq-history" id="mq-history"></div>
        `;

        const input = document.getElementById('mq-input');
        input.focus();

        document.getElementById('mq-play').onclick = () => playSnippet();
        
        document.getElementById('mq-add').onclick = () => {
            if (state.attempts > 1) {
                state.attempts--;
                state.currentDuration += 1000;
                document.getElementById('mq-status').innerText = `${state.currentDuration/1000} s | ${state.attempts} attempts`;
                playSnippet();
            } else Spicetify.showNotification("Max time reached!");
        };

        const submit = () => {
            const isCorrect = checkAnswer(input.value, track.name);
            if (isCorrect) {
                track.status = 'correct'; state.score++;
                Spicetify.showNotification(TEXT.correct);
            } else {
                track.status = 'wrong';
                Spicetify.showNotification(`${TEXT.wrong} ${track.name} - ${track.artist}`);
            }
            document.getElementById('mq-score-display').innerText = `${TEXT.score} ${state.score}`;
            nextRound();
        };

        document.getElementById('mq-submit').onclick = submit;
        input.addEventListener("keypress", (e) => { if(e.key === "Enter") submit(); });
        document.getElementById('mq-skip').onclick = () => { track.status = 'skipped'; nextRound(); };

        renderHistory();
        
        setTimeout(playSnippet, 800);
    }

    function nextRound() {
        state.currentIndex++;
        state.attempts = 5;
        renderGame();
    }

    function renderHistory() {
        const container = document.getElementById('mq-history');
        if (!container) return;
        const history = state.tracks.slice(0, state.currentIndex).reverse().slice(0, 3);
        container.innerHTML = history.map(t => `
            <div class="mq-track-row">
                <img src="${t.cover}" class="mq-cover">
                <div style="flex:1;text-align:left;">
                    <div style="font-weight:bold;">${t.name}</div>
                    <div style="font-size:12px;opacity:0.7;">${t.artist}</div>
                </div>
                <div style="font-size:20px;">${t.status === 'correct' ? '✅' : t.status === 'skipped' ? '⏭️' : '❌'}</div>
            </div>`).join('');
    }

    async function startGame(uris) {
        state.isActive = true;
        state.currentIndex = 0;
        state.score = 0;
        state.attempts = 5;
        createOverlay();

        const tracks = await fetchTracks(uris[0]);
        if (tracks.length === 0) {
            const c = document.getElementById('mq-content');
            if(c) c.innerHTML = `<h3>${TEXT.noTracks}</h3>`;
            return;
        }
        state.tracks = tracks.sort(() => Math.random() - 0.5);
        renderGame();
    }

    const menuItem = new Spicetify.ContextMenu.Item(
        TEXT.menuItem,
        startGame,
        (uris) => {
            if (uris.length === 1) {
                const uriObj = Spicetify.URI.fromString(uris[0]);
                return uriObj.type === Spicetify.URI.Type.PLAYLIST || uriObj.type === Spicetify.URI.Type.PLAYLIST_V2;
            }
            return false;
        },
        "gamepad"
    );
    menuItem.register();
})();