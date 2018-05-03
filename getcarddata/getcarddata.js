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
    
    callback(null,card)
      
  })
  .catch(error => {
    callback(JSON.stringify(error))
  })
};
