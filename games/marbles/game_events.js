/** @file game_events.js
 *  @brief 遊戲操作事件

 *  這裡實作了觸控、鍵盤、滑鼠的操作事件，以及彈珠之間的碰撞偵測 detectBallCollision()。

 *  @author Shu-Kai Yang (skyang@csie.nctu.edu.tw)
 *  @date 2025/5/2 */

/* 彈珠的合理活動範圍: */
const LEFT_BOUND = 28.5;
const RIGHT_BOUND = 571.5;

const UPPER_BOUND = 0;
const LOWER_BOUND = 800;

/* 兩倍的球體半徑平方，用於碰撞偵測方便計算: */
const RADIUS_POW2_2X = 1625;

/* 這些滑鼠與觸控事件處理常式所綁定 DOM 元件: */
var touchTarget = null;

/* 左右鍵是否按下: */
var leftArrowIsDown = false;
var rightArrowIsDown = false;

/* 滑鼠或觸控壓下的時間，以判斷是 tap 還是 drag 動作: */
var touchDownTime = 0;

/* 用滑鼠來模擬觸控的時候，紀錄滑鼠左鍵是否壓下: */
var mouseDown = false;

/* 偵錯用，顯示軌跡或暫停整個遊戲: */
var showLocus = false;
var isPaused = false;

/* 這兩個函式用來捕捉實體鍵盤 down 與 keyup 事件，如果使用者持續按著實體鍵盤某個按鍵，將會引發多次的
   keydown 事件，但最終只會有一個 keyup 事件，event.code 列表 https://w3c.github.io/uievents-code/ */
onKeyDown = function (event)
{
    /* 必須要有這一行，否則視窗捲動行為會生效: */
    event.preventDefault();

    if (event.code == "ArrowLeft")
    {   leftArrowIsDown = true;  }
    else if (event.code == "ArrowRight")
    {   rightArrowIsDown = true;  }

    requestRender = true;
}

onKeyUp = function (event)
{
    /* 必須要有這一行，否則視窗捲動行為會生效: */
    event.preventDefault();

    if (event.code == "ArrowLeft")
    {   leftArrowIsDown = false;  }
    else if (event.code == "ArrowRight")
    {   rightArrowIsDown = false;  }
    else if (event.code == "ArrowDown")
    {
        if (gameState == AIMING)
        {
            let ball = curBall;
            curBall = nextBall;
            nextBall = ball;
            requestRender = true;
        }
    }
    else if (event.code == "Space")
    {
        if (gameState == AIMING) {  shotCurBall();  }
    }
    else if (event.code == "KeyL")
    {
        if (showLocus == false) {  showLocus = true;  }
        else {  showLocus = false;  locus.length = 0;  }
    }
    else if (dbg_span != null) /* 偵錯功能 */
    {
        if (event.code == "KeyP")
        {
            if (isPaused == false) {  isPaused = true;  }
            else {  isPaused = false;  requestRender = true;  }
        }
    }
}

/* 單點觸控: */
onTouch = function(event)
{
    if (event.type == "touchcancel")
    {   touchDownTime = 0;  return;  }

    let touches = event.changedTouches;
    if (touches.length == 0) {  return;  }

    /* 相對移動位置是 event 在瀏覽器視窗內的座標減去 arena div 的左上角: */
    let x = touches[0].clientX - touchTarget.offsetLeft;
    let y = touches[0].clientY - touchTarget.offsetTop;

    /* 轉動原點是 curBallRect 的中心點: */
    let cx = (curBallRect.left + BALL_HALF_WIDTH) * densityX;
    let cy = (curBallRect.top + BALL_HALF_HEIGHT) * densityY;

    /* 依照 (x,y) 到 (cx,cy) 的相對位置計算發射角度 angle: */
    if (y < cy)
    {
        let dx = x - cx;
        let dy = cy - y;
        angle = Math.PI / 2 - Math.atan2(dy, dx);
        if (angle < ANGLE_MIN) {  angle = ANGLE_MIN;  }
        if (angle > ANGLE_MAX) {  angle = ANGLE_MAX;  }
        requestRender = true;
    }

    if (event.type == "touchstart")
    {   touchDownTime = Date.now();  }
    else if (event.type == "touchend")
    {
        if (gameState == AIMING)
        {
            if ((Date.now() - touchDownTime) < TAPPING_MSECS)
            {
                /* 覆蓋掉系統預設的 tapping 事件: */
                event.preventDefault();

                /* 如果觸控動作被判定為 tapping 的時候，如果觸碰位置低於 curBallRect.bottom 則視為交換
                   彈珠，否則呼叫 shotCurBall() 按照 angle 發射 curBall。 */
                let lowerBound = curBallRect.bottom * densityY;
                if (y > lowerBound)
                {
                    let ball = curBall;
                    curBall = nextBall;
                    nextBall = ball;
                    requestRender = true;
                }
                else
                {   shotCurBall();  }
            }
        }

        touchDownTime = 0;
    }
}

/* 單點觸控(滑鼠模擬): */
onMouse = function (event)
{
    if (event.type == "mousedown")
    {
        touchDownTime = Date.now();
        mouseDown = true;
    }
    else if (event.type == "mousemove")
    {   if (mouseDown == false) {  return;  }  }

    /* 相對移動位置是 event 在瀏覽器視窗內的座標減去 arena div 的左上角: */
    let mouseX = event.clientX - touchTarget.offsetLeft;
    let mouseY = event.clientY - touchTarget.offsetTop;

    /* 轉動原點是 curBallRect 的中心點: */
    let cx = (curBallRect.left + BALL_HALF_WIDTH) * densityX;
    let cy = (curBallRect.top + BALL_HALF_HEIGHT) * densityY;

    if (mouseY < cy)
    {
        let dx = mouseX - cx;
        let dy = cy - mouseY;
        angle = Math.PI / 2 - Math.atan2(dy, dx);
        if (angle < ANGLE_MIN) {  angle = ANGLE_MIN;  }
        if (angle > ANGLE_MAX) {  angle = ANGLE_MAX;  }
        requestRender = true;
    }

    if (event.type == "mouseup")
    {
        if (gameState == AIMING)
        {
            if ((Date.now() - touchDownTime) < TAPPING_MSECS)
            {
                /* 如果觸控動作被判定為 tapping 的時候，如果觸碰位置低於 curBallRect.bottom 則視為交
                   換彈珠，否則呼叫 shotCurBall() 按照 angle 發射 curBall。 */
                let lowerBound = curBallRect.bottom * densityY;
                if (event.which == 1)
                {
                    if (mouseY > lowerBound)
                    {
                        let ball = curBall;
                        curBall = nextBall;
                        nextBall = ball;
                        requestRender = true;
                    }
                    else
                    {   shotCurBall();  }
                }
                else if (event.which == 3)
                {
                    var ball = curBall;
                    curBall = nextBall;
                    nextBall = ball;
                    requestRender = true;
                }
            }
        }

        touchDownTime = 0;
        mouseDown = false;
    }

    requestRender = true;
}

/* 將目前的彈珠發射出去，並且補上新彈珠: */
function shotCurBall()
{
    if (curBall == null) {  return;  }

    if (shotSfx != null)
    {
        if (curBall.ballType == BALL_BOMB)
        {
            if (shotSfx.readyState == 4) {  shotSfx.play();  }
        }
        else if (ballSounds[curBall.colorIndex].readyState == 4)
        {   ballSounds[curBall.colorIndex].play();   }
    }

    /* 準備 shotBall 的初始位置與方向: */
    shotBall = curBall;
    shotBall.x = curBallRect.left + 32;
    shotBall.y = curBallRect.top + 32;

    shotBall.velocity.x =   Math.sin(angle) * BALL_VELOCITY;
    shotBall.velocity.y = - Math.cos(angle) * BALL_VELOCITY;

    /* curBall 變成 nextBall，而 nextBall 是新產生的彈珠。 */
    curBall = nextBall;

    let colors = getAvailableColors();
    j = Math.floor(Math.random()*colors.length);

    let ballType = BALL_REGULAR;
    let p = Math.random();
    if (p < BALL_BOMB_PROBABILITY) {  ballType = BALL_BOMB;  }
    else if (p < BALL_PLUS5_PROBABILITY) {  ballType = BALL_PLUS5;  }

    nextBall = new Ball(0, 0, colors[j], ballType);
    gameState = BALL_GOING;
}

/* 根據 shotBall 現在的位置，檢測它是否撞上了既有的彈珠或是畫面頂端，若是，則計算它在 ballArr 中
   應有的位置，並且將 shotBall 放進 ballArr 當中，並且傳回 true。 */
function detectBallCollision()
{
    /* 以 shotBall 目前的位置進行偵測:
    let x = shotBall.x;
    let y = shotBall.y; */

    /* 以 shotBall 下個畫面的位置進行預測: */
    let x = shotBall.x + shotBall.velocity.x * msecsPerFrame;
    let y = shotBall.y + shotBall.velocity.y * msecsPerFrame;
    if (x < LEFT_BOUND) {  x = LEFT_BOUND;  }
    else if (x > RIGHT_BOUND) {  x = RIGHT_BOUND;  }

    for (let j=LAST_ROW_INDEX; j>=0; --j)
    {
        for (let i=0; i<BALL_COLS; ++i)
        {
            if (ballArr[j][i] != null)
            {
                /* 計算 ballArr[] 中某 ball 和目前彈珠 shotBal 的中心距離，如果小於兩倍半徑平方則表
                   示兩者發生碰撞: */
                let ball = ballArr[j][i];
                let dx = x - ball.x;
                let dy = y - ball.y;
                let dist_pow2 = dx * dx + dy * dy;
                if (dist_pow2 < RADIUS_POW2_2X)
                {
                    colliXY.x = ball.x;
                    colliXY.y = ball.y;

                    if (dx > 0)  /* shotBall 是從右邊撞上的，檢查入射角... */
                    {
                        let incidentAngle = Math.atan2(dy, dx);
                        if (dbg_span != null)
                        {   dbg_span.innerHTML = "incident angle = " + incidentAngle.toString();  }

                        if ((incidentAngle < 0.785) && (i < LAST_COL_INDEX) && (ballArr[j][i+1] == null))
                        {
                            /* 根據 shotBall 的入射角，它應該放在 ball 的右邊: */
                            shotBall.row = j;
                            shotBall.col = i+1;
                        }
                        else
                        {
                            shotBall.row = j+1;
                            if ((j%2) == 1) {  shotBall.col = i+1;  }
                            else {  shotBall.col = i;  }

                            /* 非常偶然的情況下，該位置已經有彈珠佔據，則微調之: */
                            if (ballArr[shotBall.row][shotBall.col] != null)
                            {   ++shotBall.row;  }
                        }
                    }
                    else /* shotBall 是從左邊撞上的，檢查入射角... */
                    {
                        let incidentAngle = Math.atan2(dy, -dx);
                        if (dbg_span != null)
                        {   dbg_span.innerHTML = "incident angle = " + incidentAngle.toString();  }

                        if ((incidentAngle < 0.785) && (i > 0) && (ballArr[j][i-1] == null))
                        {
                            /* 根據 shotBall 的入射角，它應該放在 ball 的左邊: */
                            shotBall.row = j;
                            shotBall.col = i-1;
                        }
                        else
                        {
                            shotBall.row = j+1;
                            if ((j%2) == 1) {  shotBall.col = i;  }
                            else {  shotBall.col = i-1;  }

                            /* 非常偶然的情況下，該位置已經有彈珠佔據，則微調之: */
                            if (ballArr[shotBall.row][shotBall.col] != null)
                            {   ++shotBall.row;  }
                        }
                    }

                    /* 將 shotBall 放到 ballArr 當中，並且令它的座標對齊網格: */
                    if (shotBall.row < BALL_ROWS)
                    {
                        ballArr[shotBall.row][shotBall.col] = shotBall;
                        shotBall.getXYByRowCol();
                    }

                    return true;
                }
            }
        }
    }

    /* shotBall 沒有撞上任何彈珠但已經到達畫面頂端: */
    if (shotBall.y < BALL_HALF_HEIGHT)
    {
        shotBall.y = BALL_HALF_HEIGHT;
        shotBall.row = 0;
        shotBall.col =  Math.floor(shotBall.x / BALL_WIDTH);
        shotBall.x = shotBall.col * BALL_WIDTH + BALL_HALF_WIDTH;
        ballArr[shotBall.row][shotBall.col] = shotBall;
        return true;
    }

    return false;
}
