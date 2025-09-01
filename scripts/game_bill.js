/** @file game_bill.js
 *  @brief 遊戲的控制參數

 *  這個實作了在 onload 的時候輸入名字並生成本機排行榜 table 的功能。

 *  @author Shu-Kai Yang (skyang@csie.nctu.edu.tw)
 *  @date 2025/5/2 */

window.onload = function()
{
    /* 從 localStorage 讀取 (tag)Scores 項目 */
    let billboard = new Billboard(GAME_TAG);
    billboard.load();

    /* 檢查網址列是否帶有加密的分數 code: */
    let code = getUrlParameter("g");
    if (code.length > 9)
    {
        let codeIsOk = true;
        let score = 0;

        /* code 最後兩個亂數字元是檢查是否提交的 stamp 用途，如果它和儲存在 localStorage 中的值相等
           表示使用者重複提交分數，直接忽視之: */
        let stamp = code.charAt(8) + code.charAt(9);
        let localStamp = localStorage.getItem(GAME_TAG + "Stamp");
        if ((localStamp != null) && (localStamp == stamp)) {  codeIsOk = false;  }

        /* 將 code 解碼為分數數字，並比較檢查碼，若解碼有問題或經過竄改，一律傳回零: */
        if (codeIsOk == true) {  score = ctoi(code);  }

        /* 如果成功取得數字: */
        if (score > 0)
        {
            /* 無論分數是否能夠上榜，先儲存 stamp 以避免重複提交: */
            localStorage.setItem(GAME_TAG + "Stamp", stamp);

            /* 如果分數足以上榜，以彈出視窗詢問名字: */
            if (billboard.isAcceptable(score) == true)
            {
                let name = null;
                let defaultName = localStorage.getItem(GAME_TAG + "Player");
                if (defaultName != null) {  name = prompt(STR_ENTER_UR_NAME, defaultName);  }
                else {  name = prompt(STR_ENTER_UR_NAME);  }

                if ((name != null) && (name.length > 0))
                {
                    localStorage.setItem(GAME_TAG + "Player", name);

                    let today = new Date();
                    let yyyyMMdd = today.toISOString().split('T')[0];
                    billboard.accept(yyyyMMdd, name, score);
                    billboard.save();
                }
            }
        }

        /* 重新載入網頁: */
        window.location.replace(BILLBOARD_URL);
        return;
    }

    /* 根據 billboard 生成表格列: */
    billboard.outputTable("billboard",  "num_label", "date_label", "name_label", "score_label");
}

function onClearClicked()
{
    if (confirm(STR_ARE_YOU_SURE) == true)
    {
        let billboard = new Billboard(GAME_TAG);
        billboard.clear();
        window.location.replace(BILLBOARD_URL);
    }
}
