/** @file game_draw.js
 *  @brief 畫面繪製

 *  這裡實作了遊戲畫面的繪製。

 *  @author Shu-Kai Yang (skyang@csie.nctu.edu.tw)
 *  @date 2025/4/26 */

const EXPLOSION_WIDTH = 171;
const EXPLOSION_HEIGHT = 171;

var desktopRect = newRectXYWH(0, 800, 600, 200);
var arrowRect = newRectXYWH(268, 660, 64, 160);

/* 偵錯用途：紀錄球的軌跡 */
const MAX_LOCUS_LENGTH = 10;
var colliXY = new ivec2(0, 0);
var locus = [];

function drawBalls(context)
{
    /* 以半透明畫出墜落中的彈珠，透明度與剩餘的秒數成正比: */
    if (fallingBalls.length > 0)
    {
        for (let i=0; i<fallingBalls.length; ++i)
        {
            if (fallingBalls[i] != null)
            {
                let b = fallingBalls[i];
                let x = b.x - BALL_HALF_WIDTH;
                let y = b.y - BALL_HALF_HEIGHT;

                context.globalAlpha = b.fallingMsecs / BALL_FALLING_MSECS;
                ballTex.draw(context, x, y, BALL_WIDTH, BALL_HEIGHT, 1, b.colorIndex);
            }
        }

        context.globalAlpha = 1;
    }

    /* 畫出 ballArr 中的所有彈珠: */
    for (let j=0; j<BALL_ROWS; ++j)
    {
        for (let i=0; i<BALL_COLS; ++i)
        {
            if (ballArr[j][i] != null)
            {
                var b = ballArr[j][i];
                let x = b.x - BALL_HALF_WIDTH;
                let y = b.y - BALL_HALF_HEIGHT;

                if (b.ballType == BALL_BOMB)
                {   bombTex.draw(context, x, y, BALL_WIDTH, BALL_HEIGHT, 0, 0);  }
                else
                {
                    let row = 0;
                    if (b.ballType == BALL_PLUS5) {  row = 2; }
                    ballTex.draw(context, x, y, BALL_WIDTH, BALL_HEIGHT, row, b.colorIndex);
                }
            }
        }
    }

    /* 描繪爆炸範圍: */
    if (explosionMsecs > 0)
    {
        context.globalAlpha = explosionMsecs / BOMB_EXPLOSION_MSECS;
        let x = exploCentre.x - EXPLOSION_WIDTH / 2;
        let y = exploCentre.y - EXPLOSION_HEIGHT / 2;
        explodeTex.draw(context, x, y, EXPLOSION_WIDTH, EXPLOSION_HEIGHT, 0, 0);
        context.globalAlpha = 1;
    }

    /* 描繪發射台與箭頭: */
    desktopTex.draw(context,
        desktopRect.left, desktopRect.top,
        desktopRect.width(), desktopRect.height(), 0, 0);

    if (angle != 0)
    {
        let cx = curBallRect.left + BALL_HALF_WIDTH;
        let cy = curBallRect.top + BALL_HALF_HEIGHT;

        let left = arrowRect.left - cx;
        let top = arrowRect.top - cy;

        let width = arrowRect.width();
        let height = arrowRect.height();

        context.save();
        context.translate(cx * densityX, cy * densityY);
        context.rotate(angle);
        arrowTex.drawScr(context,
            left * densityX, top * densityY,
            width * densityX, height * densityY, 0, 0);
        context.restore();
    }
    else
    {
        arrowTex.draw(context,
            arrowRect.left, arrowRect.top,
            arrowRect.width(), arrowRect.height(), 0, 0);
    }

    /* 畫出目前已射出的彈珠 */
    if (shotBall != null)
    {
        let x = shotBall.x - BALL_HALF_WIDTH;
        let y = shotBall.y - BALL_HALF_HEIGHT;

        if (shotBall.ballType == BALL_BOMB)
        {   bombTex.draw(context, x, y, BALL_WIDTH, BALL_HEIGHT, 0, 0);  }
        else
        {
            let row = 0;
            if (shotBall.ballType == BALL_PLUS5) {  row = 2; }
            ballTex.draw(context, x, y, BALL_WIDTH, BALL_HEIGHT, row, shotBall.colorIndex);
        }

        /* 畫出球的軌跡: */
        if (showLocus == true)
        {
            locus.unshift(new ivec2(shotBall.x, shotBall.y));
            if (locus.length > MAX_LOCUS_LENGTH)
            {   locus = locus.slice(0, MAX_LOCUS_LENGTH);  }
        }
    }

    if (locus.length > 0)
    {
        let radius = BALL_HALF_WIDTH * densityX;
        context.lineWidth = 1;
        context.strokeStyle = "white";

        for (let i=0; i<locus.length; ++i)
        {
            context.beginPath();
            context.arc(locus[i].x * densityX, locus[i].y * densityY, radius, 0, 2 * Math.PI);
            context.stroke();
        }

        if (dbg_span != null)
        {
            context.strokeStyle = "red";
            context.beginPath();
            context.arc(colliXY.x * densityX, colliXY.y * densityY, radius, 0, 2 * Math.PI);
            context.stroke();
        }
    }

    /* 放置在發射台上的彈珠 */
    if (curBall != null)
    {
        if (curBall.ballType == BALL_BOMB)
        {
            bombTex.draw(context,
                curBallRect.left, curBallRect.top,
                BALL_WIDTH, BALL_HEIGHT, 0, 0);
        }
        else
        {
            let row = 0;
            if (curBall.ballType == BALL_PLUS5) {  row = 2; }

            ballTex.draw(context,
                curBallRect.left, curBallRect.top,
                BALL_WIDTH, BALL_HEIGHT, row, curBall.colorIndex);
        }
    }

    if (nextBall != null)
    {
        if (nextBall.ballType == BALL_BOMB)
        {
            bombTex.draw(context,
                nextBallRect.left, nextBallRect.top,
                BALL_WIDTH, BALL_HEIGHT, 0, 0);
        }
        else
        {
            let row = 0;
            if (curBall.ballType == BALL_PLUS5) {  row = 2; }

            ballTex.draw(context,
                nextBallRect.left, nextBallRect.top,
                BALL_WIDTH, BALL_HEIGHT, row, nextBall.colorIndex);
        }
    }
}
