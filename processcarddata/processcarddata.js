'use strict';
const AWS = require('aws-sdk')
AWS.config.region = 'eu-west-1'

console.log('Loading function');

exports.handler = (event, context, callback) => {
   // console.log('Received event:', JSON.stringify(event, null, 2));
    event.Records.forEach((record) => {
       // console.log(record.eventID);
       // console.log(record.eventName);
       // console.log('DynamoDB Record: %j', record.dynamodb);
       if(record.eventName == "INSERT"){
           console.log(record.dynamodb.NewImage)
           const recordData = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
           for(let horseid in recordData.horses){
              let horse = recordData.horses[horseid]
              console.log("A HORSE: " + horseid)
              for(let i= 0; i< horse.races.length; i++){
                console.log(horse.races[i])
              }
           }
       }
    });
    callback(null, `Successfully processed ${event.Records.length} records.`);
};