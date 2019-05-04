const convJsonIntiQuery = R.pipe(R.toPairs, R.map(R.pipe(R.adjust(encodeURIComponent, 1), R.join("="))), R.join("&"));

function ajaxPostPromise(url, data) {
    return new Promise((res, rej) => {
        const xhr = new XMLHttpRequest();
        xhr.onloadend = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    res(JSON.parse(xhr.responseText));
                } else {
                    rej("サーバエラー");
                }
            } else {
                rej("送信エラー");
            }
        };
        xhr.open('POST', url);
        //fd = new FormData();
        //fd.append("hoge", 1);
        xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        xhr.send(convJsonIntiQuery(data));
    });
}


function ajaxPostPromise2(url, data) {
    return new Promise((res, rej) => {
        $.ajax(
            {
                url: url,
                async: true, //非同期=true・同期=false
                type: 'POST',
                data: data,
                dataType: 'json',
                timeout: 10000
            }
        ).then(data => res(data), err => rej(err));
    });
}
