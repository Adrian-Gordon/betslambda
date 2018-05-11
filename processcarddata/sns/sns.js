'use strict'

const AWS = require('aws-sdk')
AWS.config.region = 'eu-west-1'

const publishMessage = (arn, message) =>{

  

  const sns = new AWS.SNS()

  const params ={
    Message: message,
    TopicArn: arn
  }

 


  return(sns.publish(params).promise())


}

module.exports = Object.assign({}, {publishMessage})