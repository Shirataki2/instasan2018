$(() => {
  let file;
  let blob;
  const droparea = document.getElementById("droparea");
  const drawarea = document.getElementById("drawarea");
  const ufield = document.getElementById("upload-field")
  let image = new Image();
  let reader = new FileReader();
  const getCorrectImsize = () => {
    let w = $(window).width();
    if (w >= 1200) {
      return [500, 500];
    } else if (w >= 992) {
      return [450, 450];
    } else if (w >= 500) {
      const l = 385 + (w - 500) / 492 * 65;
      return [l, l];
    } else {
      return [385, 385];
    }
  }
  let maxImageSize = getCorrectImsize();

  $(window).resize(() => {
    maxImageSize = getCorrectImsize();
    if (image.width > image.height) {
      w = maxImageSize[0];
      h = Math.floor(maxImageSize[0] * image.height / image.width);
    } else {
      w = Math.floor(maxImageSize[1] * image.width / image.height);
      h = maxImageSize[1];
    }
    const canvas = $("#canvas").attr('width', w).attr('height', h);
    const ctx = canvas[0].getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, w, h);
  })



  $('input[type=file]').change(() => {
    file = $('input[type=file]').prop('files')[0]
    // 選択画像が対応形式かどうかを判定
    if (file.type != 'image/jpeg' && file.type != 'image/png') {
      file = null;
      Snackbar.show({
        text: "対応している画像ファイル形式ではありません．",
        pos: "top-center",
        actionText: "OK",
        backgroundColor: "#ff3232",
        actionTextColor: "#ffcccc",
        duration: 3000,
      })
      return;
    }

    reader.onloadstart = () => {
      console.log('loadstart');
    }
    console.log('file read');
    reader.onload = function (e) {
      console.log('render load');
      image.onload = function () {
        console.log('image load');
        let w, h;
        if (image.width > image.height) {
          w = maxImageSize[0];
          h = Math.floor(maxImageSize[0] * image.height / image.width);
        } else {
          w = Math.floor(maxImageSize[1] * image.width / image.height);
          h = maxImageSize[1];
        }
        const canvas = $("#canvas").attr('width', w).attr('height', h);
        const ctx = canvas[0].getContext("2d");
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, w, h);
        const b64img = canvas.get(0).toDataURL('image/jpeg');
        drawarea.className = "visible";
        droparea.className = "hidden";
        ufield.style.padding = "0";
        $.ajax({
          url: 'run',
          method: 'POST',
          dataType: 'json',
          data: JSON.stringify({
            'file': b64img
          }),
          contentType: 'application/json',
        }).always((res) => {
          const pieimg = new Image();
          console.log('image recieved')
          pieimg.src = 'data:image/png;base64,' + res['img'];
          console.log(pieimg);
          pieimg.className = "col-md-12 col-xs-12 _1200px"
          $("#result-image").html(pieimg);
        }).fail((e) => {
          console.log(e);
        })
      }
      image.src = e.target.result;
    }
    reader.readAsDataURL(file);

  })
});