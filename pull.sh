echo 'Starting Git Pull'

sudo git pull
sudo npm i
sudo forever restartall
sudo forever list

echo 'Finish Git Pull'