#!/usr/bin/env bash

# Install requirements
wget -O jq https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64
chmod +x ./jq
cp jq /usr/bin
yum update -y
yum install -y python3 mysql
pip3 install mysql-connector-python

# Get secret values
SECRET_VALUE=$(aws secretsmanager get-secret-value --region $REGION --secret-id $DATABASE_SECRET_NAME | jq -r .SecretString)
DATABASE_HOST=$(echo $SECRET_VALUE | jq -r .host)
DATABASE_PASSWORD=$(echo $SECRET_VALUE | jq -r .password)
DATABASE_USERNAME=$(echo $SECRET_VALUE | jq -r .username)

# Set up environment variables
SCRIPT_NAME=/etc/profile.d/init.sh
echo "export DMS_DATA=\"$DMS_DATA\"" >> $SCRIPT_NAME
echo "export DATABASE_SECRET_NAME=\"$DATABASE_SECRET_NAME\"" >> $SCRIPT_NAME
echo "export DATABASE_HOST=\"$DATABASE_HOST\"" >> $SCRIPT_NAME
echo "export DATABASE_PASSWORD=\"$DATABASE_PASSWORD\"" >> $SCRIPT_NAME
echo "export DATABASE_USERNAME=\"$DATABASE_USERNAME\"" >> $SCRIPT_NAME

# Initialize database
if [ $POPULATE ]; then
    source $SCRIPT_NAME
    mysql -u $DATABASE_USERNAME -h $DATABASE_HOST -p$DATABASE_PASSWORD < /home/ec2-user/schema.sql
    python3 /home/ec2-user/populate.py
fi
