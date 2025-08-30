/** @file game_config.js
 *  @brief 遊戲的控制參數

 *  這個檔案不會被 minify，可以在此修改遊戲的各項設定。

 *  @author Shu-Kai Yang (skyang@csie.nctu.edu.tw)
 *  @date 2025/4/19 */

/* 一些時間上的細節: */
const TIMER_INITIAL_MSECS = 60000;   /* 控制關卡的秒數 */
const INITIAL_PREPARE_MSECS = 1000;  /* 顯示預備的時間 */
const BOMB_EXPLOSION_MSECS = 1000;   /* 顯示炸彈爆炸的時間 */
const BALL_FALLING_MSECS = 2000;     /* 彈珠被消除以後，保持落下動畫的時間 */
const BALL_FALLING_PER_MSEC = 0.7;   /* 彈珠落下的速率(pixels per ms) */

/* 觸控或滑鼠按下到放開的時間少於這個毫秒就視為 tapping: */
const TAPPING_MSECS = 200;

/* 遊戲物理參數: */
const DELTA_ANGLE_PER_FRAME = Math.PI / 50;  /* 按左右鍵的時候轉動指針的速率 */
const BALL_VELOCITY = 1.7;                   /* 彈珠移動的速率(pixels per ms) */

/* 發射台指針的最大旋轉角度(弧度量): */
const ANGLE_MAX =  1.5;
const ANGLE_MIN = -1.5;

/* 計分標準: */
const POINTS_PER_BALL = 1;
const POINTS_INCREMENT = 1.25;
const POINTS_PER_SEC = 5;

/* 控制特殊球出現的機率: */
const BALL_PLUS5_PROBABILITY = 0.05;
const BALL_BOMB_PROBABILITY = 0.03;

/* 控制畫面的更新速率(預設值): */
msecsPerFrame = 33;
