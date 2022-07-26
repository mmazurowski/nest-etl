#!/bin/bash

aws dynamodb create-table --table-name orders --attribute-definitions AttributeName=PK,AttributeType=S --key-schema AttributeName=PK,KeyType=HASH --endpoint-url http://localhost:8000 --billing-mode PAY_PER_REQUEST