'use strict';
const AWS = require('aws-sdk')
AWS.config.region = 'eu-west-1'

const lambda = new AWS.Lambda()

const SNS = require('./sns/sns.js')

const arn = process.env.SNS_ARN

console.log('Loading function');

exports.handler = (event, context, callback) => {
   // console.log('Received event:', JSON.stringify(event, null, 2));
   let promises = []
    event.Records.forEach((record) => {
       // console.log(record.eventID);
       // console.log(record.eventName);
       // console.log('DynamoDB Record: %j', record.dynamodb);
       if(record.eventName == "INSERT"){
           //console.log(record.dynamodb.NewImage)
           const recordData = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
           for(let horseid in recordData.horses){
              let horse = recordData.horses[horseid]
              for(let i= 0; i< horse.races.length; i++){
                let index = horse.races[i].lastIndexOf('/')
                let resultId = horse.races[i].substring(index + 1,horse.races[i].length)
                //console.log(horseid + " " + resultId + " " + horse.races[i])
                const messageObj = {
                  horseid: horseid,
                  raceid: resultId,
                  resulturl: horse.races[i]
                }
                
                let promise = SNS.publishMessage(arn, JSON.stringify(messageObj))
                promises.push(promise)
                

              }
              
           }
           
       }
    })
    
    Promise.all(promises).then(results =>{
      callback(null, `Successfully sent ${promises.length} messages to the results SNS topic`);
    })
    .catch(error =>{
      callback(JSON.stringify(error))
    })
    
};