FROM alpine

RUN apk update

# nginxのインストール
RUN apk add nginx

# 事前にフォルダ作ってないとこけたのでフォルダ作成
RUN mkdir /run/nginx

# これは要らないかもしれないけど、デーモン起動をオフに
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

# ポートは80番
EXPOSE 80

# Nginx起動コマンド
CMD ["nginx","-c","/etc/nginx/nginx.conf"]