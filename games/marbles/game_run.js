/** @file game_run.js
 *  @brief 遊戲主迴圈

 *  這裡是遊戲的主要操作與運算邏輯，實作了鍵盤與觸控的事件處理常式，以轉動發射台的指針並發射彈珠。當
    彈珠觸及既有的彈珠的時候，根據入射角決定它的排列位置，然後由此探查它的鄰近彈珠以決定 cluster，決
    定那些彈珠應該被消除。

 *  @author Shu-Kai Yang (skyang@csie.nctu.edu.tw)
 *  @date 2025/4/26 */

/* 目前的關卡與分數: */
var curLevel = 1;
var curBonus = 0;
var curScore = 0;

/* 目前遊戲迴圈中的狀態:
    0: preparing
    1: aiming
    2: ball going
    3: stopped */
const PREPARING = 0;
const AIMING = 1;
const BALL_GOING = 2;
const STOPPED = 3;
var gameState = 0;

var curLevelMsecs = 0;   /* 現在的遊戲計時 */
var preparingMsecs = 0;  /* 顯示 GET READY 的剩餘時間 */
var explosionMsecs = 0;  /* 顯示炸彈爆炸的時間 */
var exploCentre = new ivec2(0, 0); /* 爆炸中心位置 */

/* 暫時變數: */
var gameTimerID = 0;
var curDate = 0;
var angle = 0;           /* 目前指針的旋轉角度(弧度量) */

/* 目前已射出的彈珠: */
var shotBall = null;

/* 放置在發射台上的彈珠: */
var curBall = null;
var curBallRect = newRectXYWH(270, 820, BALL_WIDTH, BALL_HEIGHT);

/* 下一個彈珠: */
var nextBall = null;
var nextBallRect = newRectXYWH(515, 925, BALL_WIDTH, BALL_HEIGHT);

/* 動畫效果參數: */
var fallingBalls = [];
var lastTimerSecs = 60; /* 避免重複更新 time_label */

/* 遊戲已結束? 若 gameState 為 STOPPED 而 gameIsOver 為 false 表示等待進入下一關: */
var gameIsOver = false;

/* 計算上一次執行 onUpdate() 後經過的微秒數，並進行計算與描繪: */
function onUpdate()
{
    let oldDate = curDate;
    curDate = Date.now();

    if (isPaused == false)
    {   updateBalls(curDate - oldDate);  }

    if (requestRender == true)
    {
        /* 描繪畫面: */
        let context = getBackBufferContext();
        drawBalls(context);
        swapBuffers();
    }
}

/* ---------------------------------------------------------------------------------------------- */

function showScoreMessageBox(boxTitle, buttonText)
{
    let span = document.getElementById("msg_title");
    span.innerHTML = boxTitle;

    span = document.getElementById("msg_bonus");
    span.innerHTML = STR_TIME_BONUS + ": " + curBonus;

    span = document.getElementById("msg_total");
    span.innerHTML = STR_TOTAL_SCORE + ": " + curScore;

    let button = document.getElementById("cont_button");
    button.innerHTML = buttonText;
    button.style.display = "inline-block";

    let msgbox = document.getElementById("message_box");
    msgbox.style.display = "block";
}

/* 依照不同的球數，從第四4球開始以等比級數加權計分: */
function getWeightedScore(ballCount)
{
    let score = POINTS_PER_BALL * ballCount;

    let k = POINTS_PER_BALL;
    for (let i=4; i<=ballCount; ++i)
    {   score += k;  k *= POINTS_INCREMENT;  }

    return Math.floor(score);
}

function updateBalls(msecs)
{
    if (explosionMsecs > 0)
    {
        explosionMsecs -= msecs;
        if (explosionMsecs < 0) {  explosionMsecs = 0;  }
    }

   /* 檢測鍵盤左右鍵按下的狀態，並且改變發射台指針的角度，把這段程式碼放在這裡，所以不論 gameState
      為何，使用者都可以預先地調整發射角度。 */
   if (leftArrowIsDown)
   {
       angle -= DELTA_ANGLE_PER_FRAME;
       if (angle < ANGLE_MIN) {  angle = ANGLE_MIN;  }
       requestRender = true;
   }
   if (rightArrowIsDown)
    {
        angle += DELTA_ANGLE_PER_FRAME;
        if (angle > ANGLE_MAX) {  angle = ANGLE_MAX;  }
        requestRender = true;
    }

    /* 讓 fallingBalls 陣列中，已經被刪除的彈珠持續地落下: */
    if (fallingBalls.length > 0)
    {
        let fallingBallsIsEmpty = true;

        for (let i=0; i<fallingBalls.length; ++i)
        {
            if (fallingBalls[i] != null)
            {
                let b = fallingBalls[i];
                b.y += BALL_FALLING_PER_MSEC * msecs;

                if (b.y < LOWER_BOUND)
                {
                    b.fallingMsecs -= msecs;
                    if (b.fallingMsecs < 0) {  fallingBalls[i] = null;  }
                    else {  fallingBallsIsEmpty = false;  }
                }
                else
                {   fallingBalls[i] = null;  }
            }
        }

        if (fallingBallsIsEmpty == true) {  fallingBalls.length = 0;  }
    }

    if (gameState == PREPARING)
    {
        /* 遊戲仍在預備畫面，於是暫停的剩餘時間 preparingMsecs 減去 msecs 以後，如果小於零表示預備時
           間結束，隱藏 message_box 並將 gameState 切換為 AIMING、允許發射彈珠。 */
        preparingMsecs -= msecs;
        if (preparingMsecs <= 0)
        {
            let msgbox = document.getElementById("message_box");
            msgbox.style.display = "none";

            let arena = document.getElementById("arena");
            arena.focus();

            gameState = AIMING;
            preparingMsecs = 0;
            requestRender = true;
        }
    }
    else if (gameState == AIMING)
    {
        /* 遊戲處於等待使用者瞄準並發射彈珠的階段，所以只要遞減遊戲秒數即可，不須做任何計算: */
        curLevelMsecs -= msecs;
        if (curLevelMsecs < 0) {   curLevelMsecs = 0;  }

        let secs = Math.ceil(curLevelMsecs / 1000);
        if (secs != lastTimerSecs)
        {
            let span = document.getElementById("time_label");
            span.innerHTML = "TIME: " + secs;
            lastTimerSecs = secs;
        }

        if (curLevelMsecs == 0)
        {
            gameIsOver = true;
            gameState = STOPPED;
            fallingBalls.length = 0;

            if ((gameOverSfx != null) && (gameOverSfx.readyState == 4))
            {   gameOverSfx.play();  }

            /* 顯示失敗的 message_box */
            showScoreMessageBox(STR_GAME_OVER, STR_FINISH);
            return;
        }

        requestRender = true;
    }
    else if (gameState == BALL_GOING)
    {
        /* 彈珠已經發射，所以 shotBall 不為 null，遊戲尚在進行中所以遞減遊戲秒數: */
        curLevelMsecs -= msecs;
        if (curLevelMsecs < 0) {  curLevelMsecs = 0;  }

        let secs = Math.ceil(curLevelMsecs / 1000);
        if (secs != lastTimerSecs)
        {
            let span = document.getElementById("time_label");
            span.innerHTML = "TIME: " + secs;
            lastTimerSecs = secs;
        }

        if (curLevelMsecs == 0)
        {
            gameIsOver = true;
            gameState = STOPPED;
            fallingBalls.length = 0;

            shotBall = null;
            requestRender = true;

            if ((gameOverSfx != null) && (gameOverSfx.readyState == 4))
            {   gameOverSfx.play();  }

            /* 顯示失敗的 message_box */
            showScoreMessageBox(STR_GAME_OVER, STR_FINISH);
            return;
        }

        /* 讓 shotBall 前進，如果撞上了左右邊界，則令 velocity.x 轉向: */
        shotBall.x += shotBall.velocity.x * msecs;
        shotBall.y += shotBall.velocity.y * msecs;

        if (shotBall.x < LEFT_BOUND)
        {
            shotBall.x = LEFT_BOUND;
            shotBall.velocity.x = - shotBall.velocity.x;
        }
        else if (shotBall.x > RIGHT_BOUND)
        {
            shotBall.x = RIGHT_BOUND;
            shotBall.velocity.x = - shotBall.velocity.x;
        }

        /* 如果 shotBall 已經因為撞上其他彈珠或是畫面頂端而停下了，開始進行判斷: */
        if (detectBallCollision() == true)
        {
            let deletedBalls = 0;
            gameState = AIMING;

            if (shotBall.ballType == BALL_BOMB)
            {
                let cluster = getNeighbors(shotBall.row, shotBall.col);
                cluster.push(shotBall);

                deletedBalls = cluster.length;
                deleteBallCluster(cluster, false);

                explosionMsecs = BOMB_EXPLOSION_MSECS;
                exploCentre = new ivec2(shotBall.x, shotBall.y);
                if ((explodeSfx != null) && (explodeSfx.readyState == 4))
                {   explodeSfx.play();  }
            }
            else
            {
                /* 從 shotBall 所在位置找出彈珠的 cluster: */
                let cluster = findCluster(shotBall, true);
                if (cluster.length > 2)
                {
                    /* 如果叢集的彈珠有 3 個以上，則刪除之: */
                    deletedBalls = cluster.length;
                    deleteBallCluster(cluster, true);

                    if ((glassSfx != null) && (glassSfx.readyState == 4))
                    {   glassSfx.play();  }
                }
                else
                {
                    if ((collideSfx != null) && (collideSfx.readyState == 4))
                    {   collideSfx.play();  }
                }
            }

            if (deletedBalls > 0)
            {
                /* 從畫面頂端嘗試不分顏色地生成 cluster 但僅標示旗標: */
                markRootClusters();

                /* 未被標示到的彈珠就是浮動於空中，應當刪除的: */
                let floatingBalls = [];

                for (let j=0; j<BALL_ROWS; ++j)
                {
                    for (let i=0; i<BALL_COLS; ++i)
                    {
                        if ((ballArr[j][i] != null) && (clusteredArr[j][i] == false))
                        {   floatingBalls.push(ballArr[j][i]);  }
                    }
                }

                /* 刪除未被標示到的彈珠: */
                if (floatingBalls.length > 0)
                {
                    deletedBalls += floatingBalls.length;
                    deleteBallCluster(floatingBalls, true);
                }

                /* 統計分數並更新: */
                curScore += getWeightedScore(deletedBalls);
                let span = document.getElementById("score_label");
                span.innerHTML = "SCORE: " + curScore;

                /* 檢查是否已經清除了所有的彈珠: */
                let ballArrIsEmpty = true;
                for (let j=0; j<BALL_ROWS; ++j)
                {
                    for (let i=0; i<BALL_COLS; ++i)
                    {
                        if (ballArr[j][i] != null)
                        {   ballArrIsEmpty = false;  break;  }
                    }

                    if (ballArrIsEmpty == false) {  break;  }
                }

                if (ballArrIsEmpty == true)
                {
                    /* 如果已經清除了所有的彈珠，計算剩餘秒數加分，關卡結束: */
                    curBonus = POINTS_PER_SEC * secs;
                    curScore += curBonus;
                    fallingBalls.length = 0;
                    gameState = STOPPED;

                    if ((succeedSfx != null) && (succeedSfx.readyState == 4))
                    {   succeedSfx.play();  }

                    /* 顯示過關的 message_box */
                    if (curLevel < stage_arr.length)
                    {   showScoreMessageBox(STR_CONGRATULATIONS, STR_NEXT_STAGE);  }
                    else
                    {
                        gameIsOver = true;
                        showScoreMessageBox(STR_CONGRATULATIONS, STR_FINISH);
                    }
                }
            }

            if (gameState == AIMING)
            {
                /* 如果有彈珠停留在最後一列，闖關失敗，遊戲結束: */
                for (let i=0; i<BALL_COLS; ++i)
                {
                    if (ballArr[LAST_ROW_INDEX][i] != null)
                    {
                        fallingBalls.length = 0;
                        gameIsOver = true;
                        gameState = STOPPED;

                        if ((gameOverSfx != null) && (gameOverSfx.readyState == 4))
                        {   gameOverSfx.play();  }

                        /* 顯示失敗的 message_box */
                        showScoreMessageBox(STR_GAME_OVER, STR_FINISH);
                        break;
                    }
                }
            }

            shotBall = null;
        }

        requestRender = true;
    }
    else /* stopped */
    {   shotBall = null;  }
}

/* 前進到下一關或結束遊戲: */
function onContinueClicked()
{
    if (gameIsOver == true)
    {
        let code = itoc(curScore);
        code += charMap[Math.floor(Math.random() * 36)];
        code += charMap[Math.floor(Math.random() * 36)];
        window.location.assign(BILLBOARD_URL + "?g=" + code);
        return;
    }

    /* 隱藏 message_box: */
    let msgbox = document.getElementById("message_box");
    msgbox.style.display = "none";

    /* 準備下一關: */
    if (curLevel < stage_arr.length) {  ++curLevel;  }
    prepareCurStage();
}
