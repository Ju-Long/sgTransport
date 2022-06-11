echo "Starting Script"

sudo npm i
sudo forever start ./app.js
sudo forever list

echo "Script Complete"