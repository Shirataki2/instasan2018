from flask import Flask, jsonify, make_response, send_file
from flask import request, render_template, abort
from flask_cors import CORS
from datetime import datetime
from PIL import Image
from io import BytesIO
from binascii import a2b_base64
import numpy as np
import tensorflow as tf
import keras
from collections import Counter, OrderedDict
from math import pi
import pandas as pd
import matplotlib.pyplot as plt
import random
import os
import base64
# import cgi

app = Flask(__name__)
model = keras.models.load_model('./model/sample_model_2.h5')
global graph
graph = tf.get_default_graph()
imsize = 64
plt.style.use('ggplot')
plt.rcParams.update({'font.size':15})

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
    ret = (ret.reshape((3,))*10000).astype(np.int16)/100
    odr = {'Twitter': ret[0], 'Instagram': ret[1], 'Facebook': ret[2]}
    # odr = OrderedDict(sorted(dic.items(), key=lambda x: x[1]))
    print(odr)
    name = str(random.randint(10000000,99999999)) + '.png'
    piechart(odr, name)
    result_b64 = base64.encodestring(open(name, 'rb').read())
    os.remove(name)
    return make_response(jsonify({
      "img": str(result_b64.decode('utf8')),
      "result": list(odr.values()),
    }))
  else:
    return make_response(jsonify({
            "result": "Error",
          }))


def piechart(odr, name):
  fig = plt.figure(figsize=(8,6))
  plt.pie(list(odr.values()), explode=[0, 0, 0],autopct=lambda p:'{:.1f}%'.format(p) if p>=5 else '', colors=["#77daff", "#ff82e6", "#8199d1"], shadow=True, startangle=90,counterclock=False)
  plt.legend(list(odr.keys()),fancybox=True,loc='center left',bbox_to_anchor=(0.9,0.5))
  plt.subplots_adjust(left=0,right=0.7)
  plt.axis('equal') 
  plt.savefig(name,bbox_inches='tight',pad_inches=0.05)

if __name__ == "__main__":
    app.run(debug=False,host="0.0.0.0" ,port=80)