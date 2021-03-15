import random
import string
import mysql.connector
import os

def get_random_string(length=20):
    letters = string.ascii_lowercase
    result_str = ''.join(random.choice(letters) for i in range(length))
    return result_str

mydb = mysql.connector.connect(
    host = os.environ['DATABASE_HOST'],
    user = os.environ['DATABASE_USERNAME'],
    password = os.environ['DATABASE_PASSWORD'],
    database = 'temp'
)

mycursor = mydb.cursor()

sql = "INSERT INTO random(random) VALUES (%s)"
for i in range(1, 1000):
    val = [(get_random_string())]
    mycursor.execute(sql, val)

mydb.commit()

print("Last record ID {}".format(mycursor.lastrowid))
