FROM python3.6

RUN apt-get update -y
RUN apt-get upgrade -y
COPY . /app
WORKDIR /app

RUN pip3 install numpy pillow tensorflow keras flask flask-cors pandas matplotlib

EXPOSE 80

CMD ["python3", "server.py"]
