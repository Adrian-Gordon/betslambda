'use strict';

const AWS = require('aws-sdk')
AWS.config.region = 'eu-west-1'

const lambda = new AWS.Lambda()

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
    const cardUrl = event.Records[0].Sns.Message;

    const params = {
    FunctionName: 'rpwrapperlambda',
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: '{"functionname":"getCardData","cardUrl":"' + cardUrl + '"}'
  }

  const invocation = lambda.invoke(params).promise()

  invocation.then(data => {
    const card = JSON.parse(data.Payload)

    const docClient = new AWS.DynamoDB.DocumentClient()
    
    const params={
      TableName: 'cards',
      Item: card
    }

    const docPut = docClient.put(params).promise()
    docPut.then(data => {
      callback(null,data)
    })
    .catch(error => {
      callback(JSON.stringify(error))
    })
    
    
      
  })
  .catch(error => {
    callback(JSON.stringify(error))
  })
};
