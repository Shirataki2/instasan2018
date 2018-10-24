from flask import Flask, jsonify, make_response, send_file
from flask import request, render_template, abort
from flask_cors import CORS
from datetime import datetime
from PIL import Image, ImageChops
from io import BytesIO
from binascii import a2b_base64
import numpy as np
import tensorflow as tf
import keras
import keras.backend as K
from collections import Counter, OrderedDict
from math import pi
import pandas as pd
import matplotlib.pyplot as plt
import random
import os
import base64

app = Flask(__name__)
model = keras.models.load_model('./model/sample_model_9.h5')
global graph
graph = tf.get_default_graph()
imsize = 128
plt.style.use('ggplot')
plt.rcParams.update({'font.size': 15})
K.set_learning_phase(0)
layername = 'activation_6'

@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  return response


CORS(app)


@app.route('/')
def hello():
    return render_template('index.html')


@app.route('/run', methods=['POST'])
def run():
  img = request.json['file']
  img_b64 = str(img).split(',')[1]
  if img_b64:
    img = Image.open(BytesIO(a2b_base64(img_b64))).convert('RGB')
    img = img.resize((imsize,imsize))
    img = np.array(img, np.uint8).reshape((1, imsize, imsize, 3))/255.
    print(img.min(), img.max())
    with graph.as_default():
      ret = model.predict(img)
    ret = list(ret.reshape((3,))*100)
    odr = [
      {'label':'Twitter',   "value":float(ret[0])},
      {'label':'Instagram', "value":float(ret[1])},
      {'label':'Facebook',  "value":float(ret[2])}
      ]
       # odr = OrderedDict(sorted(dic.items(), key=lambda x: x[1]))
    print(odr)
    #name = str(random.randint(10000000, 99999999)) + '.png'
    #piechart(odr, name)
    #result_b64 = base64.encodestring(open(name, 'rb').read())
    #os.remove(name)
    return make_response(jsonify({
      #"img": str(result_b64.decode('utf8')),
      "result": odr,
    }))
  else:
    return make_response(jsonify({
            "result": "Error",
          }))


@app.route('/grad', methods=['POST'])
def grad():
  img = request.json['file']
  img_b64 = str(img).split(',')[1]
  if img_b64:
    raw = Image.open(BytesIO(a2b_base64(img_b64))).convert('RGB')
    npraw = np.array(raw, np.uint8)
    img = np.asarray(raw.resize((imsize, imsize))).reshape((1, imsize, imsize, 3))/255.
    gra = GradCam(model, img, layername)
    gra = gra.resize(raw.size, Image.BILINEAR)
    gra.save('a.png')
    d = Image.fromarray((.3*npraw).astype(np.uint8))
    d.save('b.png')
    comp = ImageChops.screen(d, gra)
    comp.save('c.png')
    name = str(random.randint(10000000, 99999999)) + '.png'
    comp.save(name)
    result_b64 = base64.encodestring(open(name, 'rb').read())
    os.remove(name)
    return make_response(jsonify({
      "img": str(result_b64.decode('utf8')),
      "width": comp.size[0],
      "height": comp.size[1],
    }))

  return make_response(jsonify({
            "result": "grad::Error",
          }))

def GradCam(input_model, x, layer_name):
  '''
  Args:
     input_model: モデルオブジェクト
     x: 画像(array)
     layer_name: 畳み込み層の名
  Returns:
     jetcam: 影響の大きい箇所を色付けした画像(array
  '''
  
  X = x.astype('float32')
  preprocessed_input = X 
  print(preprocessed_input.max())
  
  imgs = []
  for i in [1, 2, 0]:
    with graph.as_default():

      class_output = model.output[:, i]

      conv_output = model.get_layer(layer_name).output   # layer_nameのレイヤーのアウトプット
      grads = K.gradients(class_output, conv_output)[0]  # gradients(loss, variables) で、variablesのlossに関しての勾配を返す
      gradient_function = K.function([model.input], [conv_output, grads])  # model.inputを入力すると、conv_outputとgradsを出力する関数

      output, grads_val = gradient_function([preprocessed_input])
      output, grads_val = output[0], grads_val[0]

      # 重みを平均化して、レイヤーのアウトプットに乗じる
      weights = np.mean(grads_val, axis=(0, 1))
      cam = np.dot(output, weights)
      imgs.append(cam)
  
  imgs = np.array(imgs).transpose((1,2,0))
  
  img = (255*(np.maximum(imgs, 0) / imgs.max())).astype(np.uint8)
  img = Image.fromarray(img)
  return img 

def piechart(odr, name):
  fig = plt.figure(figsize=(8,6))
  plt.pie(list(odr.values()), explode=[0, 0, 0],autopct=lambda p:'{:.1f}%'.format(p) if p>=5 else '', colors=["#77daff", "#ff82e6", "#8199d1"], shadow=True, startangle=90,counterclock=False)
  plt.legend(list(odr.keys()),fancybox=True,loc='center left',bbox_to_anchor=(0.9,0.5))
  plt.subplots_adjust(left=0,right=0.7)
  plt.axis('equal') 
  plt.savefig(name,bbox_inches='tight',pad_inches=0.05)
  plt.close()


@app.route('/d3js')
def d3js():
  return render_template("d3js.html")

@app.route('/.well-known/acme-challenge/j8QbZps6bmjrNolMKrzPsGgo70nYHNcjrKMawPefSMQ')
def acme():
  return render_template("j8QbZps6bmjrNolMKrzPsGgo70nYHNcjrKMawPefSMQ.html")
if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0" ,port=80)
