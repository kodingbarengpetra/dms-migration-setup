CREATE DATABASE IF NOT EXISTS temp;

USE temp;

CREATE TABLE random (
     id BIGINT NOT NULL AUTO_INCREMENT,
     random VARCHAR(30) NOT NULL,
     PRIMARY KEY (id)
);
