'use strict'

const rpWrapper =  require('./rpwrapper/rpwrapper.js')

exports.handler =  (event, context, callback) => {
  console.log(event)

  if(event.functionname == 'getDateCards'){

      rpWrapper.getDateCards(process.env.RPROOT_URL)
      .then(cards => {
          callback(null, cards)
      })
      .catch(error =>{
          callback(JSON.stringify(error))
      })
    }
  else if(event.functionname == 'getCardData'){

      rpWrapper.getCardData(process.env.RPROOT_URL, event.cardUrl)
      .then(card => {
          callback(null, card)
      })
      .catch(error =>{
          callback(JSON.stringify(error))
      })
    }
 
}
