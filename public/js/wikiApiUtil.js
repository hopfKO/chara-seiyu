function getTitleListPromise(title) {
    return new Promise((res, rej) => {
        //Ajax通信開始
        $.ajax(
            {
                url: "https://ja.wikipedia.org/w/api.php?format=json&action=query&list=search&callback=?",
                async: true, //非同期=true・同期=false
                type: 'GET',
                data: {
                    srsearch: title,
                    srlimit: 1
                },
                dataType: 'jsonp',
                timeout: 10000
            }
        ).done(data => {
            if (data.query.search.length == 0) {
                rej("作品が見つからないよぉ。タイトルは「" + title + "」であってるかなぁ？");
            }
            res(data.query.search);
        }).fail(function () {
            rej("通信が失敗したよぉ。");
        })
    });
}

function getArticlePromise(title, property) {
    return new Promise((res, rej) => {
        $.ajax(
            {
                url: "https://ja.wikipedia.org/w/api.php?format=json&action=query&prop=revisions&rvprop=content&rvparse&callback=?",
                async: true, //非同期=true・同期=false
                type: 'GET',
                data: { titles: title },
                dataType: 'jsonp',
                timeout: 10000
            }
        ).done(data => {
            if (data.query.pages.hasOwnProperty(-1)) {
                rej(property + "が見つからないよぉ。" + property + "は「" + title + "」であってるかなぁ？");
            }
            for (let item in data.query.pages) {
                //ページ番号を取得
                let point = data.query.pages[item];
                for (let item2 in point.revisions) {
                    //記事本文のディレクトリを取得
                    let point2 = point.revisions[item2];
                    for (let item3 in point2) {
                        res(point2[item3]);
                    }
                }
            }
        }).fail(function () {
            rej("通信が失敗したよぉ。");
        });
    });
}

