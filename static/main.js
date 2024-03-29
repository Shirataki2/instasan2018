let visbtn;
let canvas;
let tweetImg = $("meta[name='twitter:image']");
let image = new Image();
let gradCam = new Image();
const siteUrl = "http://instasan.kcs18.net"
const getCorrectImsize = () => {
  let w = $(window).width();
  if (w >= 1200) {
    return [500, 500];
  } else if (w >= 992) {
    return [450, 450];
  } else if (w >= 500) {
    const l = 385 + (w - 500) / (992 - 450) * (450 - 350);
    return [l, l];
  } else {
    return [w * .95, w * .95];
  }
}

$(() => {
  $(".tweet").socialbutton("twitter", {
    button: "horizontal",
    url: siteUrl,
    lang: "ja",
    text: "よっほっほい #インスタさん2018"
  });
  tweetImg.attr('content', "https://imgcp.aacdn.jp/img-a/800/auto/aa/gm/article/3/1/8/0/6/201801222224/neko2.jpg")
  let file;
  const droparea = document.getElementById('droparea');
  const drawarea = document.getElementById('drawarea');
  const ufield = document.getElementById('upload-field')

  let reader = new FileReader();
  let maxImageSize = getCorrectImsize();
  canvas = $('#canvas');
  $(window).resize(() => {
    maxImageSize = getCorrectImsize();
    if (image.width > image.height) {
      w = maxImageSize[0];
      h = Math.floor(maxImageSize[0] * image.height / image.width);
    } else {
      w = Math.floor(maxImageSize[1] * image.width / image.height);
      h = maxImageSize[1];
    }
    canvas = $('#canvas').attr('width', w).attr('height', h);
    const ctx = canvas[0].getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, w, h);
  })



  $('input[type=file]').change(() => {
    file = $('input[type=file]')
      .prop('files')[0]
    // 選択画像が対応形式かどうかを判定
    if (file.type != 'image/jpeg' && file.type != 'image/png') {
      file = null;
      Snackbar.show({
        text: '対応している画像ファイル形式ではありません．',
        pos: 'top-center',
        actionText: 'OK',
        backgroundColor: '#ff3232',
        actionTextColor: '#ffcccc',
        duration: 3000,
      })
      return;
    }

    reader.onload = function (e) {
      image.onload = function () {
        let w, h;

        if (image.width > image.height) {
          w = maxImageSize[0];
          h = Math.floor(maxImageSize[0] * image.height / image.width);
        } else {
          w = Math.floor(maxImageSize[1] * image.width / image.height);
          h = maxImageSize[1];
        }
        canvas = $('#canvas').attr('width', w).attr('height', h);
        const ctx = canvas[0].getContext('2d');
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, w, h);
        $('#canvas').css({
          'position': 'relative',
          'left': `${(maxImageSize[0] - w)/2}px`
        })
        const b64img = canvas.get(0).toDataURL('image/jpeg');
        drawarea.className = 'visible';
        droparea.className = 'hidden';
        ufield.style.padding = '0';
        $.ajax({
            url: 'run',
            method: 'POST',
            dataType: 'json',
            data: JSON.stringify({
              'file': b64img
            }),
            contentType: 'application/json',
          })
          .always((res) => {
            $('#result-image').empty();
            //const pieimg = new Image();
            const vbtn = $(`<input type="button" value="どのへんが${getResult(res['result'])}っぽいの？" id="visbtn" class="btn btn-primary btn-lg" onclick="visclick()"/>`);
            const data = res['result'];
            console.log(data)
            //pieimg.src = 'data:image/png;base64,' + res['img'];
            //pieimg.className = 'col-xs-offset-1 col-md-12 col-xs-10 _1200px';
            const w = Math.min(550, $(window).width() * .9);
            drawPie("#result-image", w, 440 / 550, w / 12, w / 3, w / 55, data);
            const tx = $('<p id="para">Twitter度の高い部分は青く，Instagram度の高い部分は赤く，Facebook度の高い部分は緑になります</p>')
            $('#result-image').append(vbtn).append(tx);
            visbtn = document.getElementById('visbtn');
            visbtn.disabled = false;
            tweetImg.attr('content', `data:image/png;base64,${b64img}`)
            $(".tweet").socialbutton("twitter", {
              button: "horizontal",
              url: siteUrl,
              lang: "ja",
              text: "わっほっほい #インスタさん2018"
            });
          })
          .fail((e) => {
            console.log(e);
          })
      }
      image.src = e.target.result;
    }
    reader.readAsDataURL(file);

  })

});

function argMax(array) {
  return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

const getResult = (res) => {
  const list = [];
  res.forEach((i) => {
    list.push(i.value);
  });
  const max = argMax(list);
  if (max === 0) {
    return "Twitter";
  } else if (max === 1) {
    return "Instagram";
  } else {
    return "Facebook";
  }
}

const visclick = () => {
  const b64img = canvas.get(0).toDataURL('image/jpeg');
  visbtn.disabled = true;
  dispLoading("処理中...");
  $.ajax({
    url: 'grad',
    method: 'POST',
    dataType: 'json',
    data: JSON.stringify({
      'file': b64img
    }),
    contentType: 'application/json',
  }).done((res) => {
    //reader.onload = function(e) {
    gradCam.src = 'data:image/png;base64,' + res['img'];
    gradCam.width = res['width'];
    gradCam.height = res['height'];
    gradCam.onload = () => {
      let w, h;
      let maxImageSize = getCorrectImsize();
      if (gradCam.width > gradCam.height) {
        w = maxImageSize[0];
        h = Math.floor(maxImageSize[0] * gradCam.height / gradCam.width);
      } else {
        w = Math.floor(maxImageSize[1] * gradCam.width / gradCam.height);
        h = maxImageSize[1];
      }
      const ctx = canvas[0].getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(gradCam, 0, 0, gradCam.width, gradCam.height, 0, 0, w, h);
    }
    //image.src = e.target.result;
    //}
    //reader.readAsDataURL(file);
  }).fail((e) => {
    console.log(e);
  }).always(() => {
    removeLoading();
  })
}