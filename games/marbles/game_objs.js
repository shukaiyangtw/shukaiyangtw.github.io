/** @file game_objs.js
 *  @brief 遊戲中的全域物件。

 *  這裡定義了 Ball 結構體與 ballArr，畫面上的彈珠被排列在 ballArr 當中，因此很容易地根據 stage_arr
    載入關卡，也很容易根據某彈珠的 (row, col) 取得它上下左右鄰居的彈珠，或者同色群聚的彈珠。

 *  @author Shu-Kai Yang (skyang@csie.nctu.edu.tw)
 *  @date 2025/4/18 */

/* 遊戲中的常數: */
const BALL_WIDTH = 57;
const BALL_HEIGHT = 57;

const BALL_HALF_WIDTH = 28.5;
const BALL_HALF_HEIGHT = 28.5;

const BALL_COLS = 10;
const BALL_ROWS = 14;

const LAST_COL_INDEX = 9;
const LAST_ROW_INDEX = 13;

/* 邏輯上與實際上的可視範圍尺寸: */
const ARENA_WIDTH = 600;
const ARENA_HEIGHT = 1000;
var canvasSize = new ivec2(ARENA_WIDTH, ARENA_HEIGHT);

/* 彈珠類型: */
const BALL_REGULAR = 0;
const BALL_PLUS5 = 1;    /* 時間加 5 秒 */
const BALL_BOMB = 2;     /* 炸彈 */

/* 彈珠結構體: */
function Ball(row, col, colorIndex, ballType)
{
    this.row = row;
    this.col = col;

    /* 彈珠的顏色以及上面的圖示: */
    this.colorIndex = colorIndex;
    this.ballType = ballType;

    /* 根據 (row, col) 計算彈珠的中心座標 (x,y): */
    this.x =  (col * BALL_WIDTH) + BALL_HALF_WIDTH;
    if ((row % 2) == 1) {  this.x += BALL_HALF_WIDTH;  }
    this.y = (row * BALL_HEIGHT) +  BALL_HALF_HEIGHT;

    /* 彈珠前進的方向向量(包含量值): */
    this.velocity = new ivec2(0, 0);

    /* 持續落下的速度與剩餘時間: */
    this.fallingVelocity = BALL_FALLING_PER_MSEC;
    this.fallingMsecs = 0;
}

/* 根據自己的 (row, col) 計算自己的 (x, y):  */
Ball.prototype.getXYByRowCol = function()
{
    this.x =  (this.col * BALL_WIDTH) + BALL_HALF_WIDTH;
    if ((this.row % 2) == 1) {  this.x += BALL_HALF_WIDTH;  }
    this.y = (this.row * BALL_HEIGHT) + BALL_HALF_HEIGHT;
}

/* 用一個 14 rows x 10 cols 的矩陣來存放目前畫面上的彈珠排列狀態，如果在畫面上某位置有一個彈珠，則會
   在此陣列的對應位置存放一個 Ball 物件，否則為 null，如果彈珠排列到達第 14 row 遊戲就結束了。 */
var ballArr =
[
    [ null, null, null, null, null, null, null, null, null, null ],
    [ null, null, null, null, null, null, null, null, null, null ],
    [ null, null, null, null, null, null, null, null, null, null ],
    [ null, null, null, null, null, null, null, null, null, null ],
    [ null, null, null, null, null, null, null, null, null, null ],

    [ null, null, null, null, null, null, null, null, null, null ],
    [ null, null, null, null, null, null, null, null, null, null ],
    [ null, null, null, null, null, null, null, null, null, null ],
    [ null, null, null, null, null, null, null, null, null, null ],
    [ null, null, null, null, null, null, null, null, null, null ],

    [ null, null, null, null, null, null, null, null, null, null ],
    [ null, null, null, null, null, null, null, null, null, null ],
    [ null, null, null, null, null, null, null, null, null, null ],
    [ null, null, null, null, null, null, null, null, null, null ]
];

/* 以 bool 旗標呈現目前的畫面裡，哪些彈珠已經被列入 cluster 當中: */
var clusteredArr =
[
    [ false, false, false, false, false, false, false, false, false, false ],
    [ false, false, false, false, false, false, false, false, false, false ],
    [ false, false, false, false, false, false, false, false, false, false ],
    [ false, false, false, false, false, false, false, false, false, false ],
    [ false, false, false, false, false, false, false, false, false, false ],

    [ false, false, false, false, false, false, false, false, false, false ],
    [ false, false, false, false, false, false, false, false, false, false ],
    [ false, false, false, false, false, false, false, false, false, false ],
    [ false, false, false, false, false, false, false, false, false, false ],
    [ false, false, false, false, false, false, false, false, false, false ],

    [ false, false, false, false, false, false, false, false, false, false ],
    [ false, false, false, false, false, false, false, false, false, false ],
    [ false, false, false, false, false, false, false, false, false, false ],
    [ false, false, false, false, false, false, false, false, false, false ]
];

/* 關於彈珠排列的工具函式 ----------------------------------------------------------------------- */

/* 這個函式收集 ballArr 中的顏色，並另外集合成 array 傳回之，以便產生新彈珠。 */
function getAvailableColors()
{
    let hashArr = [ false, false, false, false, false, false, false ];
    for (let j=0; j<BALL_ROWS; ++j)
    {
        for (let i=0; i<BALL_COLS; ++i)
        {
            if (ballArr[j][i] != null)
            {   hashArr[ballArr[j][i].colorIndex] = true;  }
        }
    }

    let colorArr = [];
    for (let x=0; x<7; ++x)
    {   if (hashArr[x] == true) {  colorArr.push(x);  }   }

    return colorArr;
}

/* 找出 (row, col) 所在位置的鄰近彈珠，並以陣列的方式傳回之: */
function getNeighbors(row, col)
{
    let neighbors = [];

    /* 如果 (row, col) 不在左右邊界上，先將它左右兩邊的彈珠加入 neighbors: */
    if (col > 0)
    {
        let prevCol = col-1;
        if (ballArr[row][prevCol] != null)
        {   neighbors.push(ballArr[row][prevCol]);  }
    }

    if (col < LAST_COL_INDEX)
    {
        let nextCol = col+1;
        if (ballArr[row][nextCol] != null)
        {   neighbors.push(ballArr[row][nextCol]);  }
    }

    if ((row % 2) == 1)
    {
        /* 如果 (row, col) 是奇數列(zero based)，整列右移了半個彈珠，所以上下列 col 是 (0, 1): */
        if (row > 0)
        {
            let prevRow = row-1;
            if (ballArr[prevRow][col] != null)
            {   neighbors.push(ballArr[prevRow][col]);  }

            if (col < LAST_COL_INDEX)
            {
                let nextCol = col+1;
                if (ballArr[prevRow][nextCol] != null)
                {   neighbors.push(ballArr[prevRow][nextCol]);  }
            }
        }

        if (row < LAST_ROW_INDEX)
        {
            let nextRow = row+1;
            if (ballArr[nextRow][col] != null)
            {   neighbors.push(ballArr[nextRow][col]);  }

            if (col < LAST_COL_INDEX)
            {
                let nextCol = col+1;
                if (ballArr[nextRow][nextCol] != null)
                {   neighbors.push(ballArr[nextRow][nextCol]);  }
            }
        }
    }
    else
    {
        if (row > 0)
        {
            let prevRow = row-1;
            if (ballArr[prevRow][col] != null)
            {   neighbors.push(ballArr[prevRow][col]);  }

            if (col > 0)
            {
                let prevCol = col-1;
                if (ballArr[prevRow][prevCol] != null)
                {   neighbors.push(ballArr[prevRow][prevCol]);  }
            }
        }

        if (row < LAST_ROW_INDEX)
        {
            let nextRow = row+1;
            if (ballArr[nextRow][col] != null)
            {   neighbors.push(ballArr[nextRow][col]);  }

            if (col > 0)
            {
                let prevCol = col-1;
                if (ballArr[nextRow][prevCol] != null)
                {   neighbors.push(ballArr[nextRow][prevCol]);  }
            }
        }
    }

    return neighbors;
}

/* 從 ball 所在位置找出相連且相同顏色的彈珠，因為彈珠在 ballArr 呈矩陣排列，為了進行樹狀的搜尋，訪視
   過的彈珠之 clusteredArr[row][col] 設為 true 以避免反覆搜尋。準備一個 queue 然後將 ball 作為起點放
   入，之後反覆地從 queue 中 shift 一個彈珠 b 出來，檢視它的 neighbors 是否相同顏色，若是、則將鄰近
   彈珠 n 放進 cluster 當中，並且 enquene n 繼續下一回合。 */
function findCluster(ball)
{
    /* 重置所有彈珠的 clustered 旗標: */
    for (let j=0; j<BALL_ROWS; ++j)
    {
        for (let i=0; i<BALL_COLS; ++i)
        {   clusteredArr[j][i] = false;  }
    }

    /* cluster 和 queue 當中，初始都只有 ball 本身: */
    let cluster = [ ball ];
    let queue = [ ball ];
    clusteredArr[ball.row][ball.col] = true;

    /* 遞迴地從 queue 中 shift 一個彈珠出來，並且訪視它的鄰近彈珠: */
    while (queue.length != 0)
    {
        let b = queue.shift();
        let neighbors = getNeighbors(b.row, b.col);

        for (let i=0; i<neighbors.length; ++i)
        {
            var n = neighbors[i];
            if (clusteredArr[n.row][n.col] == false)
            {
                if (n.colorIndex == ball.colorIndex)
                {
                    clusteredArr[n.row][n.col] = true;
                    cluster.push(n);
                    queue.push(n);
                }
            }
        }
    }

    return cluster;
}

/* 這個函式不需要生成 cluster，只要將從畫面頂端可以延伸得到的彈珠之 clusteredArr[row][col] 都設為
   true 即可，在此程序過後，clusteredArr[row][col] 仍然為 false 的彈珠就是應當刪除的浮動彈珠。 */
function markRootClusters()
{
    /* 重置所有彈珠的 clustered 旗標: */
    for (let j=0; j<BALL_ROWS; ++j)
    {
        for (let i=0; i<BALL_COLS; ++i)
        {   clusteredArr[j][i] = false;  }
    }

    for (let i=0; i<BALL_COLS; ++i)
    {
        if ((ballArr[0][i] != null) && (clusteredArr[0][i] == false))
        {
            clusteredArr[0][i] = true;
            let queue = [ ballArr[0][i] ];

            while (queue.length != 0)
            {
                let b = queue.shift();
                let neighbors = getNeighbors(b.row, b.col);

                for (let k=0; k<neighbors.length; ++k)
                {
                    let n = neighbors[k];
                    if (clusteredArr[n.row][n.col] == false)
                    {
                        clusteredArr[n.row][n.col] = true;
                        queue.push(n);
                    }
                }
            }
        }
    }
}

/* 將 cluster 中的彈珠從 ballArr 中移除，如果是 PLUS5 則增加秒數: */
function deleteBallCluster(cluster, falling)
{
    for (let i=0; i<cluster.length; ++i)
    {
        let b = cluster[i];
        if (b.ballType == BALL_PLUS5) {  curLevelMsecs += 5000;  }
        ballArr[b.row][b.col] = null;

        if (falling == true)
        {
            b.fallingVelocity = BALL_FALLING_PER_MSEC + (Math.random() * 0.1);
            b.fallingMsecs = BALL_FALLING_MSECS;
            fallingBalls.push(b);
        }
    }

    lastTimerSecs = Math.ceil(curLevelMsecs / 1000);
    let span = document.getElementById("time_label");
    span.innerHTML = "TIME: " + lastTimerSecs;
}

