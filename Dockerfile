FROM python:3.6

RUN apt-get update
RUN apt-get upgrade
COPY . /app
WORKDIR /app

RUN pip3 install numpy pillow tensorflow keras flask flask-cors pandas matplotlib

EXPOSE 40001

CMD ["python3", "server.py"]