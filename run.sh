APPSRVNAME1=appsrv1
APPSRVNAME2=appsrv2
APPSRVIMAGE=flaskapp

PROXYSRVNAME=proxysrv
PROXYSRVIMAGE=nginxporxy

HOSTPORT=8080

if [ $1 = "run" ]; then
  docker run -d -rm --name $APPSRVNAME1\
    -v $(pwd)/app/app:/var/www/app $APPSRVIMAGE

  docker run -d --rm --name $PROXYSRVNAME\
    -p $HOSTPORT:80 --link $APPSRVNAME1:$APPSRVNAME1\
    -v $(pwd)/proxy/www:/var/www\
    -v $(pwd)/proxy/conf.d:/etc/nginx/conf.d $PROXYSRVIMAGE
  
  exit
fi

if [ $1 = "stop" ]; then
  docker stop $APPSRVNAME1
  docker stop $PROXYSRVNAME
  exit
fi

if [ $1 = "build"]; then
  docker build -t $APPSRVNAME1 ./app/.
  docker build -t $PROXYSRVNAME ./proxy/.
  exit
fi