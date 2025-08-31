/** @file game_init.js
 *  @brief 初始化環境

 *  這個檔案負責在網頁載入或瀏覽器視窗改變尺寸時，重新計算畫面上所有物件的尺寸與位置。

 *  @author Shu-Kai Yang (skyang@csie.nctu.edu.tw)
 *  @date 2025/4/19 */

/* 畫面貼圖: */
var ballTex;
var desktopTex;
var arrowTex;
var bombTex;
var explodeTex;

/* 音效物件: */
var shotSfx = null;
var collideSfx = null;
var glassSfx = null;
var explodeSfx = null;
var succeedSfx = null;
var gameOverSfx = null;
var gameMusic = null;
var ballSounds = [];

/* 其他畫面物件與參數: */
var xt_music = true;
var xt_audio = true;
var dbg_span = null;

function onPageResized()
{
    /* 根據畫面尺寸，保持 viewport 長寬比重新計算最大的 canvas 尺寸: */
    canvasSize = autoCanvasSize(document.body);

    /* 顯示計算出的 canvas size 以供偵錯:
    document.title = Math.floor(canvasSize.x) + " x " + Math.floor(canvasSize.y); */

    /* 指定畫面容器的尺寸為計算出的 canvas size: */
    setElementSizeScr("startmenu", canvasSize);
    setElementSizeScr("arena", canvasSize);
    setElementSizeScr("buffer1", canvasSize);
    setElementSizeScr("buffer2", canvasSize);

    /* 指定遊戲選單上各元件的位置和尺寸 (id, x, y, [w, h,] [font-size(px)]): */
    mapElementToCanvas("banner_img", 0, 50, 600, 200);
    mapElementToCanvas("intro_span", 20, 280, 560, 200, 36);
    mapElementToCanvas("level_select_span", 20, 520, 560, 50, 36);
    mapElementToCanvas("stage_select", 20, 580, 560, 50);

    mapElementToCanvas("howto_button", 40, 680, 210, 70, 48);
    mapElementToCanvas("start_button", 330, 680, 210, 70, 48);
    mapElementToCanvas("billboard_button", 40, 800, 210, 70, 48);
    mapElementToCanvas("back_button", 330, 800, 210, 70, 48);

    mapElementPosToCanvas("music_button", 80, 910);
    mapElementSizeToCanvas("music_icon", 64, 64);

    mapElementPosToCanvas("sound_button", 270, 910);
    mapElementSizeToCanvas("sound_icon", 64, 64);

    mapElementPosToCanvas("lang_button", 450, 910);
    mapElementSizeToCanvas("lang_icon", 64, 64);

    /* 指定遊戲畫面上各元件的位置和尺寸 */
    mapElementPosToCanvas("level_label", 20, 880, 24);
    mapElementPosToCanvas("time_label", 20, 915, 24);
    mapElementPosToCanvas("score_label", 20, 950, 24);

    mapElementToCanvas("message_box", 50, 300, 480, 350, 48);
    let font_size = Math.floor(48 * densityX);
    let span = document.getElementById("msg_title");
    span.style.fontSize = font_size + "px";
    let button = document.getElementById("cont_button");
    button.style.fontSize = font_size + "px";

    font_size = Math.floor(36 * densityX);
    span = document.getElementById("msg_bonus");
    span.style.fontSize = font_size + "px";
    span = document.getElementById("msg_total");
    span.style.fontSize = font_size + "px";

    /* 要求重繪畫面: */
    requestRender = true;
}

function onPageLoaded()
{
    /* 取得作為 double buffering 的 canvas 並且推入 frameBuffers 陣列當中: */
    frameBuffers.push(document.getElementById("buffer1"));
    frameBuffers.push(document.getElementById("buffer2"));

    /* 嘗試取得偵錯輸出: */
    dbg_span = document.getElementById("debug_msgs");
    if (dbg_span != null) {  showLocus = true;  }

    /* 指定畫面的邏輯尺寸以後，根據視窗大小計算實際的描繪尺寸: */
    setViewportSize(ARENA_WIDTH, ARENA_HEIGHT);
    onPageResized();

    /* 從 localStorage 取回最後的關卡: */
    let slider = document.getElementById("stage_select");
    slider.setAttribute("max", stage_arr.length);

    let str = localStorage.getItem("marbles_level");
    if (str != null) {  curLevel = parseInt(str);  }
    slider.value = curLevel;

    let span = document.getElementById("level_select_span");
    span.innerHTML = "LEVEL " + curLevel;

    /* 從 localStorage 取回目前的 音樂/音效 開關設定: */
    str = localStorage.getItem("xt_music");
    if (str == "false")
    {
        xt_music = false;
        let img = document.getElementById("music_icon");
        img.src = "../../images/music_off.png";
    }

    str = localStorage.getItem("xt_audio");
    if (str == "false")
    {
        xt_audio = false;
        let img = document.getElementById("sound_icon");
        img.src = "../../images/sound_off.png";
    }

    /* 建立貼圖物件: */
    ballTex = new TextureImage(3, 7, "balls", null);
    desktopTex = new TextureImage(1, 1, "desktop", null);
    arrowTex = new TextureImage(1, 1, "arrow", null);
    bombTex = new TextureImage(1, 1, "bomb", null);
    explodeTex = new TextureImage(1, 1, "explode", null);

    /* 註冊鍵盤與觸控的 event listeners，須注意 tabindex 為 0 的 div 才能保證捕捉到鍵盤事件: */
    touchTarget = document.getElementById("arena");
    touchTarget.addEventListener('keydown', onKeyDown);
    touchTarget.addEventListener('keyup',   onKeyUp);

    touchTarget.addEventListener("touchstart",  onTouch);
    touchTarget.addEventListener("touchmove",   onTouch);
    touchTarget.addEventListener("touchend",    onTouch);
    touchTarget.addEventListener("touchcancel", onTouch);

    /* 註冊滑鼠 event listeners 以模擬單點觸控: */
    touchTarget.addEventListener("mousedown",   onMouse);
    touchTarget.addEventListener("mousemove",   onMouse);
    touchTarget.addEventListener("mouseup",     onMouse);
}

/* START MENU SWITCHS --------------------------------------------------------------------------- */

function onMusicClicked()
{
    if (xt_music == true)
    {
        xt_music = false;
        let img = document.getElementById("music_icon");
        img.src = "../../images/music_off.png";
        localStorage.setItem("xt_music", "false");
    }
    else
    {
        xt_music = true;
        let img = document.getElementById("music_icon");
        img.src = "../../images/music_on.png";
        localStorage.setItem("xt_music", "true");
    }
}

function onSoundClicked()
{
    if (xt_audio == true)
    {
        xt_audio = false;
        let img = document.getElementById("sound_icon");
        img.src = "../../images/music_off.png";
        localStorage.setItem("xt_audio", "false");
    }
    else
    {
        xt_audio = true;
        let img = document.getElementById("sound_icon");
        img.src = "../../images/music_on.png";
        localStorage.setItem("xt_audio", "true");
    }
}

function onStageChange(level)
{
    let slider = document.getElementById("stage_select");
    curLevel = slider.value;

    let span = document.getElementById("level_select_span");
    span.innerHTML = "LEVEL " + curLevel;
}

/* LEVEL PREPARTION AND START UP --------------------------------------------------------------- */

/* 這個函式清空 ballArr 並根據 stage_arr 中的排列資料，在指定位置產生新的 Ball 物件，然後重置遊戲狀
   態以及所有的計分、計時變數。 */
function prepareCurStage()
{
    let row = 0, col =0;
    let j = curLevel - 1;

    let span = document.getElementById("level_label");
    span.innerHTML = "LEVEL " + curLevel;
    localStorage.setItem("marbles_level", curLevel.toString());

    /* 每一個 stage_arr 包含 80 個數值，如果不為 0 則產生一個 Ball 物件去裝填 ballArr: */
    for (let i=0; i<80; ++i)
    {
        let c = stage_arr[j][i];
        if (c == 0) {  ballArr[row][col] = null;  }
        else {  ballArr[row][col] = new Ball(row, col, c - 1, BALL_REGULAR);  }

        ++col;
        if (col == BALL_COLS)
        {   col = 0;  ++row;  }
    }

    /* 將 ballArr 剩餘的部分都清為 null: */
    for (let y=8; y<BALL_ROWS; ++y)
    {
        for (let x=0; x<BALL_COLS; ++x)
        {   ballArr[y][x] = null;  }
    }

    /* 重置關卡的所有狀態變數: */
    curLevelMsecs = TIMER_INITIAL_MSECS;
    curBonus = 0;
    shotBall = null;

    /* 重置輸入狀態: */
    leftArrowIsDown = false;
    rightArrowIsDown = false;
    touchDownTime = 0;
    mouseDown = false;

    /* 產生新彈珠: */
    let colors = getAvailableColors();
    j = Math.floor(Math.random()*colors.length);
    curBall = new Ball(0, 0, colors[j], BALL_REGULAR);
    j = Math.floor(Math.random()*colors.length);
    nextBall = new Ball(0, 0, colors[j], BALL_REGULAR);

    /* 利用 message_box 顯示 GET READY 字樣: */
    span = document.getElementById("msg_title");
    span.innerHTML = STR_GET_READY;

    span = document.getElementById("msg_bonus");
    span.innerHTML = "";

    span = document.getElementById("msg_total");
    span.innerHTML = "LEVEL " + curLevel;

    lastTimerSecs = Math.ceil(TIMER_INITIAL_MSECS / 1000);
    span = document.getElementById("time_label");
    span.innerHTML = "TIME: " + lastTimerSecs;

    let button = document.getElementById("cont_button");
    button.style.display = "none";

    let msgbox = document.getElementById("message_box");
    msgbox.style.display = "block";

    /* 進入準備狀態: */
    gameState = PREPARING;
    preparingMsecs = INITIAL_PREPARE_MSECS;
}

function onStartClicked()
{
    /* 準備目前的關卡: */
    prepareCurStage();

    /* 取得音效物件: */
    if (xt_audio == true)
    {
        shotSfx = document.getElementById("shot_sfx");          shotSfx.load();
        collideSfx = document.getElementById("collide_sfx");    collideSfx.load();
        glassSfx = document.getElementById("glass_sfx");        glassSfx.load();
        explodeSfx = document.getElementById("explode_sfx");    explodeSfx.load();
        succeedSfx = document.getElementById("succeed_sfx");    succeedSfx.load();
        gameOverSfx = document.getElementById("gameover_sfx");  gameOverSfx.load();

        ballSounds.push(document.getElementById("hahaha_sfx"));
        ballSounds.push(document.getElementById("laugh2_sfx"));
        ballSounds.push(document.getElementById("yo_sfx"));
        ballSounds.push(document.getElementById("huh_sfx"));
        ballSounds.push(document.getElementById("laugh1_sfx"));
        ballSounds.push(document.getElementById("angry_sfx"));
        ballSounds.push(document.getElementById("hey_sfx"));
        for (let i=0; i<ballSounds.length; ++i) {   ballSounds[i].load();  }
    }

    /* 播放音樂並開始遊戲: */
    if (xt_music == true)
    {
        gameMusic = new Audio("bicycle.mp3");
        gameMusic.loop = true;
        gameMusic.onloadeddata = function() {  gameMusic.play();  };
        gameMusic.load();
    }

    /* 隱藏   */
    let menu = document.getElementById("startmenu");
    menu.style.display = "none";

    let arena = document.getElementById("arena");
    arena.style.display = "block";
    arena.focus();

    /* 紀錄目前的時間並啟動計時器，進行計算與畫面描繪: */
    curDate = Date.now();
    gameTimerID = setInterval(onUpdate, msecsPerFrame);
}

