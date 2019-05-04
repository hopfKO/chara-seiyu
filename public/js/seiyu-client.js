$(function () {
    // DOM要素
    const loading = document.getElementById('loading');
    const searchBtn = document.querySelector("#btn");
    const formTitle = document.querySelector("#title");
    const formChara = document.querySelector("#chara");
    const $header = $('#header_with_message');
    const inputText = document.querySelectorAll("input[type='text']");

    // ストリーム
    const sSearchClick = Rx.Observable.fromEvent(searchBtn, 'click');
    const sWindowScroll = Rx.Observable.fromEvent(window, 'scroll');
    const sTextInvalid = Rx.Observable.fromEvent(inputText, 'invalid');

    // ユーティリティ関数
    const promisifyAll = R.pipe((R.map(R.unless(R.is(Promise), Promise.resolve.bind(Promise)))), Promise.all.bind(Promise));
    const fromPromisesOrValues = R.pipe(promisifyAll, Rx.Observable.fromPromise);

    // SEARCH押下 → 声優検索
    sSearchClick.filter(_ => formTitle.value && formChara.value)
        .map(R.tap(startLoading))
        .flatMap(_ => fromPromisesOrValues([getTitleListPromise(formTitle.value)]))
        .flatMap(data => fromPromisesOrValues([getArticlePromise(data[0][0].title, "タイトル"), data[0][0].title]))
        .flatMap(data => fromPromisesOrValues([getSeiyuPromise(data[0], formChara.value, data[1]), data[1]]))
        .flatMap(data => fromPromisesOrValues([getArticlePromise(data[0].seiyu, "声優"), data[1], data[0].charaName]))
        .subscribe(
            data => outputHtml(data[0], data[1], data[2]),
            err => {
                $("#message").text(err).css("visibility", "visible");
                endLoading();
            }
        );

    //ヘッダーのスクロール制御
    sWindowScroll.subscribe(e => {
        let headerHeight = $header.outerHeight();
        let headerPos = $header.offset().top;
        let scrollLength = e.target.scrollingElement.scrollTop;
        if (scrollLength > headerPos) {
            $header.addClass('is-fixed');
            $("#container").css('margin-top', headerHeight);
            $("#title").attr("placeholder", "例：ゆるゆり");
            $("#chara").attr("placeholder", "例：あかり");
        } else {
            $header.removeClass('is-fixed');
            $("#container").css('margin-top', '0');
            $("#title").attr("placeholder", "");
            $("#chara").attr("placeholder", "");
        }
    });

    //HTML5のヴァリデーションメッセージ制御
    //submitボタンが処理されないようにfalseを返す（HTML5のヴァリデーション機能を利用するためsubmitボタンで実装する必要がある）
    $("#btn").on('click', () => !formTitle.value || !formChara.value);
    sTextInvalid.subscribe(e => {
        if (e.target.validity.valueMissing) {
            e.target.setCustomValidity("「" + $(e.target).attr("title") + "」が未記入");
        } else {
            e.target.setCustomValidity("");
        }
    });


});

function getSeiyuPromise(article, formChara, titleName) {
    return new Promise((res, rej) => {
        const charaExp = new RegExp('.*' + formChara + '.*', 'gi');
        const $charaName = $($(article).find('dt').filter((index, element) => charaExp.test($(element).text()))[0]);
        if ($charaName.text() === null || $charaName.text() === "") {
            rej("キャラが見つかりません。作品は「" + titleName + "」、キャラは「" + $("#chara").val() + "」であってますか？");
            return;
        }
        $("#charaResult").text($charaName.text());
        const vaExp = /声.* - ([^\[\/、,\(（]+).*/gi;
        let vaName = vaExp.exec($charaName.next().text())[1];
        res({ seiyu: vaName, charaName: $charaName.text() });
    });
}

function outputHtml(article, titleName, charaName) {
    //記事本文をHTML要素に代入
    $("#content").html($(article).find(".infobox").css("margin", "auto").css("width", "max-content"));
    $("th:first").attr("id", "seiyu_name");

    $(".contents").fadeIn();
    $(".chara-else-img").fadeOut();

    //画像取得したくないときは下をコメントアウト
    charaName = charaName.replace(/\//gi, "-");
    createImgOnServer(titleName, charaName, 8);
    $("#chara_img1").attr('src', createImgSrc(titleName, charaName, 0));
    $("#chara_img2").attr('src', createImgSrc(titleName, charaName, 1));
    $("#chara_img3").attr('src', createImgSrc(titleName, charaName, 2));

    $("#chara_img_area img").css("visibility", "visible");
    // //画像ソース不明のときにimgを表示しない
    // $('img').each((index, element) => {
    //     element.onerror = function () { this.style.display = 'none'; };
    // });
    // document.querySelectorAll('img').forEach(function (img) {
    //     img.onerror = function () { this.style.display = 'none'; };
    // })
    $("input[type='text']").val("");

    //担当キャラリストの作成
    var charaFullList = $(article).find("dl:first li").toArray();
    var charaList = $(charaFullList).filter(":has(b)").toArray();
    const charaRestList = charaFullList.filter(element => !charaList.includes(element));

    //担当キャラ処理(Bタグ分)
    var isInitial = true;
    $(charaList).each((index, element) => {
        if ($(element).children("a:first").length == 0) {
            return true;
        }

        //サーバアクセス画像生成
        const listSize = 5;
        if (index < listSize) {
            //画像取得したくないときは下をコメントアウト
            // searchGoogleImage(charaNameTanto + " " + titleNameTanto, 3, imgList => {
            //     $(imgList).each((idxToChara, elmToChara) => {
            //         $("#chara_else_img_" + (index + 1) + "_" + (idxToChara + 1)).attr('src', elmToChara.link);
            //     });
            //     $("#chara_else_img_" + (index + 1)).fadeIn();
            // });
        }
        var charaNameTanto = $(element).children("b:first")[0].innerText;
        var titleNameTanto = $(element).children("a:first")[0].innerText;
        if (isInitial) {//最初の要素のみhtmlに既存のdivタグを編集
            isInitial = false;
            $("#chara_else_1").text(charaNameTanto + "　-　" + titleNameTanto);
            $("#chara_else_img_1_1").attr('src', createImgSrc(titleNameTanto, charaNameTanto, 0));
            $("#chara_else_img_1_2").attr('src', createImgSrc(titleNameTanto, charaNameTanto, 1));
            $("#chara_else_img_1_3").attr('src', createImgSrc(titleNameTanto, charaNameTanto, 2));
            return true;
        }
        $("#chara_else_" + (index + 1)).text(charaNameTanto + "　-　" + titleNameTanto);
        var divAfterLast = $("<div>", { class: "chara-else" }).append($("<h2>", { id: "chara_else_" + (index + 1), text: charaNameTanto + "　-　" + titleNameTanto }))
            .append($("<div>", { class: "contents chara-else-img", id: "chara_else_img_" + (index + 1) })
                .append($("<img>", { id: "chara_else_img_" + (index + 1) + "_1", src: createImgSrc(titleNameTanto, charaNameTanto, 0) }))
                .append($("<img>", { id: "chara_else_img_" + (index + 1) + "_2", src: createImgSrc(titleNameTanto, charaNameTanto, 1) }))
                .append($("<img>", { id: "chara_else_img_" + (index + 1) + "_3", src: createImgSrc(titleNameTanto, charaNameTanto, 2) }))
            );
        $(".chara-else:last").after(divAfterLast);
    });

    //担当キャラ処理(非Bタグ分)
    var charaNameExp = /.*[\(（]([^\)）\[]+).*/gi;
    $(charaRestList).each((index, element) => {
        index += charaList.length;//indexにBタグリスト分を加算しておく
        var domain = charaNameExp.exec($(element).text());
        if (domain) {
            if ($(element).children("a:first").length == 0) {
                return true;
            }
            var charaNameNotB = domain[1];
            var titleNameNotB = $(element).children("a:first")[0].innerText;
            var divAfterLast = $("<div>", { class: "chara-else" }).append($("<h2>", { id: "chara_else_" + (index + 1), text: charaNameNotB + "　-　" + titleNameNotB }))
                .append($("<div>", { class: "contents chara-else-img", id: "chara_else_img_" + (index + 1) })
                    .append($("<img>", { id: "chara_else_img_" + (index + 1) + "_1", src: createImgSrc(titleNameNotB, charaNameNotB, 0) }))
                    .append($("<img>", { id: "chara_else_img_" + (index + 1) + "_2", src: createImgSrc(titleNameNotB, charaNameNotB, 1) }))
                    .append($("<img>", { id: "chara_else_img_" + (index + 1) + "_3", src: createImgSrc(titleNameNotB, charaNameNotB, 2) }))
                );
            $(".chara-else:last").after(divAfterLast);
        }
    });

    $("#loading").fadeOut();

    //画像再読み込み
    setTimeout(function () {
        var images = document.images;
        for (var key in images) {
            images[key].src = new URL(images[key].src).pathname + "?time=" + new Date().getTime();
        }
    }, 10000); // 10000 milliseconds = 10 seconds
}

function createImgOnServer(titleName, charaName, imgCount) {
    $.ajax(
        {
            url: "/seiyu/createImg",
            type: "POST",
            data: {
                title: titleName,
                chara: charaName,
                imgCount: imgCount
            }
        }
    );
}

function createImgSrc(titleName, charaName, index) {
    return '/img/chara/' + titleName + "/" + charaName + "/" + index + ".jpg"
}

function startLoading() {
    $("#message").css("visibility", "hidden").text("");
    $("#loading").fadeIn();
}

function endLoading() {
    $("#loading").fadeOut();
}