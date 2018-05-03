'use strict'

const AWS = require('aws-sdk')
AWS.config.region = 'eu-west-1'

const lambda = new AWS.Lambda()

const SNS = require('./sns/sns.js')

const arn = process.env.SNS_ARN

exports.handler = function (event, context, callback) {
  console.log(event)

  const params = {
    FunctionName: 'rpwrapperlambda',
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: '{"functionname":"getDateCards"}'
  }

  const invocation = lambda.invoke(params).promise()

  invocation.then(data => {
    const cards = JSON.parse(data.Payload)
    const snsPromises = cards.map(card =>{
        
        SNS.publishMessage(arn,card)
      })

      Promise.all(snsPromises).then(resolvedPromises => {
        console.log("Yeah, done all the Promises")
        callback(null, cards)
      })
      .catch(error =>{
        callback(JSON.stringify(error))
      })
  })
  .catch(error => {
    callback(JSON.stringify(error))
  })
 
}
