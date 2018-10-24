FROM python:3.6

RUN apt-get update -y
RUN apt-get upgrade -y
COPY . /app
WORKDIR /app

RUN pip3 install numpy pillow tensorflow keras flask flask-cors pandas matplotlib uwsgi
RUN mkdir /var/www/app
RUN useradd -r -s /bin/false uwsgiusr
USER uwsgiusr

EXPOSE 8080
CMD ["uwsgi","--ini","/var/www/app/uwsgi.ini"]