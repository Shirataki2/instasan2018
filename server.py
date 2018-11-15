"""
instasanサーバを走らせます．
IP: 0.0.0.0

引数 1: ポート番号
"""

import base64
import os
import random
import sys
from binascii import a2b_base64
from io import BytesIO

import keras
import keras.backend as K
import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from flask import Flask, jsonify, make_response, render_template, request
from flask_cors import CORS
from PIL import Image, ImageChops

global GRAPH


APP = Flask(__name__)
MODEL = keras.models.load_model('./model/sample_model_9.h5')
GRAPH = tf.get_default_graph()
IMSIZE = 128
plt.style.use('ggplot')
plt.rcParams.update({'font.size': 15})
K.set_learning_phase(0)
LAYERNAME = 'activation_6'


@APP.after_request
def after_request(response):
    """CORSの設定"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods',
                         'GET,PUT,POST,DELETE,OPTIONS')
    return response


CORS(APP)


@APP.route('/')
def index():
    """
    ルートページ ./templates/index.html
    """
    return render_template('index.html')


@APP.route('/run', methods=['POST'])
def run():
    """
    クライアントから画像をPOSTされたときに動く．
    やる処理はほとんどここに集約されており，
    予測→グラフ描画が主な流れ．
    jsファイル内でAjaxで呼ばれる
    """
    img = request.json['file']
    img_b64 = str(img).split(',')[1]
    if img_b64:
        img = Image.open(BytesIO(a2b_base64(img_b64))).convert('RGB')
        img = img.resize((IMSIZE, IMSIZE))
        img = np.array(img, np.uint8).reshape((1, IMSIZE, IMSIZE, 3)) / 255.
        print(img.min(), img.max())
        with GRAPH.as_default():
            ret = MODEL.predict(img)
        ret = list(ret.reshape((3, )) * 100)
        odr = [{
            'label': 'Twitter',
            "value": float(ret[0])
        }, {
            'label': 'Instagram',
            "value": float(ret[1])
        }, {
            'label': 'Facebook',
            "value": float(ret[2])
        }]
        # odr = OrderedDict(sorted(dic.items(), key=lambda x: x[1]))
        print(odr)
        # name = str(random.randint(10000000, 99999999)) + '.png'
        # piechart(odr, name)
        # result_b64 = base64.encodestring(open(name, 'rb').read())
        # os.remove(name)
        return make_response(
            jsonify({
                # "img": str(result_b64.decode('utf8')),
                "result": odr,
            }))
    return make_response(jsonify({
        "result": "Error",
    }))


@APP.route('/grad', methods=['POST'])
def grad():
    """
    GradCamをつかってそれっぽい画像を生成する．
    結構重い．
    """
    img = request.json['file']
    img_b64 = str(img).split(',')[1]
    if img_b64:
        raw = Image.open(BytesIO(a2b_base64(img_b64))).convert('RGB')
        npraw = np.array(raw, np.uint8)
        img = np.asarray(raw.resize((IMSIZE, IMSIZE))).reshape(
            (1, IMSIZE, IMSIZE, 3)) / 255.
        gra = grad_cam(MODEL, img, LAYERNAME)
        gra = gra.resize(raw.size, Image.BILINEAR)
        gra.save('a.png')
        d = Image.fromarray((.3 * npraw).astype(np.uint8))
        d.save('b.png')
        comp = ImageChops.screen(d, gra)
        comp.save('c.png')
        name = str(random.randint(10000000, 99999999)) + '.png'
        comp.save(name)
        result_b64 = base64.encodestring(open(name, 'rb').read())
        os.remove(name)
        return make_response(
            jsonify({
                "img": str(result_b64.decode('utf8')),
                "width": comp.size[0],
                "height": comp.size[1],
            }))

    return make_response(jsonify({
        "result": "grad::Error",
    }))


def grad_cam(input_model, x, layer_name):
    '''
    Args:
         input_model: モデルオブジェクト
         x: 画像(array)
         layer_name: 畳み込み層の名
    Returns:
         jetcam: 影響の大きい箇所を色付けした画像(array
    '''

    preprocessed_input = x.astype('float32')
    print(preprocessed_input.max())

    imgs = []
    for i in [1, 2, 0]:
        with GRAPH.as_default():

            class_output = MODEL.output[:, i]

            conv_output = MODEL.get_layer(layer_name).output
            grads = K.gradients(class_output, conv_output)[0]
            gradient_function = K.function([MODEL.input], [conv_output, grads])

            output, grads_val = gradient_function([preprocessed_input])
            output, grads_val = output[0], grads_val[0]

            # 重みを平均化して、レイヤーのアウトプットに乗じる
            weights = np.mean(grads_val, axis=(0, 1))
            cam = np.dot(output, weights)
            imgs.append(cam)

    imgs = np.array(imgs).transpose((1, 2, 0))

    img = (255 * (np.maximum(imgs, 0) / imgs.max())).astype(np.uint8)
    img = Image.fromarray(img)
    return img


if __name__ == "__main__":
    argv = sys.argv
    argc = len(argv)
    if argc > 2:
        print("Usage: python3 server.py port")
        exit()
    try:
        port = argv[1]
    except IndexError:
        port = 80
    
    APP.run(debug=True, host="0.0.0.0", port=port)
