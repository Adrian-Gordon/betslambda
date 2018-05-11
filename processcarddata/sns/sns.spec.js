'use strict'

const sns = require('./sns.js')

const should = require('should')

const expect = require('chai').expect

const arn = process.env.SNS_ARN

describe('SNS Module', () => {



    it('can send a sns message', () =>{
      const snsPromise = sns.publishMessage(arn,"This is a test message")

     return snsPromise.then((result) => {
        expect(result).to.exist
     }).catch((error) => {
        expect(error).to.not.exist
     })

    })


})

