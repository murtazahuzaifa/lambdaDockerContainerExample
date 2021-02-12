VERSION="grafana-7.4.0"
cur_path=$(pwd)  #current path
conf_file="grafana.ini"

# path where we want to install grafana
cd $1

#installing grafana
# echo -e "Intalling $VERSION ..."
wget https://dl.grafana.com/oss/release/$VERSION.linux-amd64.tar.gz
tar -zxvf $VERSION.linux-amd64.tar.gz


#installing plugin
# echo "Intalling plugin ..."
$VERSION/bin/grafana-cli --pluginsDir "./$VERSION/plugins" plugins install grafana-timestream-datasource

mv $VERSION grafana #renaming the folder

#removing the .tar.gz file
rm $VERSION.linux-amd64.tar.gz

# echo "$VERSION Intallation Done."