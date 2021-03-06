'use strict'

const AWS = require('aws-sdk')
AWS.config.region = 'eu-west-1'

const publishMessage = (arn, message) =>{

  console.log('publish ' + message)

  const sns = new AWS.SNS()

  const params ={
    Message: message,
    TopicArn: arn
  }

  console.log("params: " + params)

  return(sns.publish(params).promise())


}

module.exports = Object.assign({}, {publishMessage})