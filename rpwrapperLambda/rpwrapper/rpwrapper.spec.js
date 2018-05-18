'use strict'

const rpwrapper = require('./rpwrapper.js')

const should = require('should')

const expect = require('chai').expect

const rproot = process.env.RPROOT_URL


describe('Rpwrapper Module', () => {



    it('can get cards for today', () => {

      const cardsPromise = rpwrapper.getDateCards(rproot)
     return cardsPromise.then((result) => {
        console.log(result)
        expect(result).to.exist
        expect(result).to.be.an('array')
     }).catch((error) => {
        //console.log(error)
        expect(error).to.not.exist
     })

    })

    describe('get a valid card for today', () =>{
      let todaysCards
      before('todays cards',() =>{
        return rpwrapper.getDateCards(rproot).then( cards =>{
          todaysCards = cards
        })

      })
      it('can get data for a valid card', () => {

         // const cardUrl = todaysCards[0]
         const cardUrl = "/racecards/308/churchill-downs/2018-05-04/701212"
          const cardPromise = rpwrapper.getCardData(rproot,cardUrl)
         ///console.log(cardUrl)
          return cardPromise.then((result) => {
            console.log(JSON.stringify(result))
            expect(result).to.exist
            expect(result.url).to.equal("https://www.racingpost.com" + cardUrl)

          })
          .catch(error =>{
            console.log(error)
          })


      })

    })

    

    it('fails for an ivalid card url', () => {
      const cardPromise = rpwrapper.getCardData(rproot,"/racecards/6/beverleyy/2018-04-26/698045")

      return cardPromise.then((result) => {
        //console.log(result)
        expect.fail()

      })
      .catch((error) => {
        //console.log(error.message)
        expect(error).to.exist
        expect(error.message).to.not.equal("expect.fail()")
      })

    })

    it('can get the list of raceurls for a horse', () => {
      const horseRacesPromise = rpwrapper.getHorseRaces(rproot+"/profile/horse/1321571/floral-bouquet")

      return horseRacesPromise.then( result => {
        //console.log(result)
        expect(result).to.exist
        expect(result).to.be.an('array')

      })
      .catch((error) => {
        //console.log(error)
        expect(error).to.not.exist
     })

    })

    it('can download a result from a result url', () => {

      const raceResultPromise = rpwrapper.getRaceResult(rproot + "/results/87/wetherby/2017-02-21/668040")
      //const raceResultPromise = rpwrapper.getRaceResult(rproot + "/results/1325/windsor-gb/2013-08-25/664315")

      return raceResultPromise.then ( result => {
        //console.log(result)
        expect(result).to.exist
      })
      .catch((error) => {
        //console.log(error)
        expect(error).to.not.exist
      })
    })


})