'use strict';
const AWS = require('aws-sdk')
AWS.config.region = 'eu-west-1'

const lambda = new AWS.Lambda()

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
    const message = event.Records[0].Sns.Message;
    //console.log('From SNS:', message);
    const parsedMessage = JSON.parse(message)
    //console.log(parsedMessage.horseid + " " + parsedMessage.raceid + " " + parsedMessage.resulturl)
    const params = {
	    FunctionName: 'rpwrapperlambda',
	    InvocationType: 'RequestResponse',
	    LogType: 'Tail',
	    Payload: '{"functionname":"getRaceResult","resultUrl":"' + parsedMessage.resulturl + '"}'
  	}

	  const invocation = lambda.invoke(params).promise()

	  invocation.then(data => {
	  	const result = JSON.parse(data.Payload)


	  	//console.log(JSON.stringify(result))

	  	Promise.all(getHorsePromises(result,parsedMessage.raceid))		//process each of the horses in this race
	  	.then(horseresults =>{						//then process the race itself
	  			console.log("horseresults: " + JSON.stringify(horseresults))
			  	let raceDocument={
			      meeting:result.course,
			      date:result.date,
			      offtime:result.time,
			      conditions:[]
			    }

			   
				    //logger.info("Race: " + race.raceid);
				raceDocument._id=parsedMessage.raceid
				raceDocument.runners=result.horseids
				raceDocument.distance=result.distanceinmetres
				raceDocument.going=result.going
				raceDocument.surface=result.surface
				raceDocument.racetype=result.raceType
				raceDocument.winningtime=result.racetime.timeinseconds
				raceDocument.resulturl=parsedMessage.resulturl

				let conditions=result.conditions
				if(typeof conditions !== 'undefined'){
				   for(let x=0;x<conditions.length;x++){
					    if(conditions[x]!==null){
					      raceDocument.conditions.push(conditions[x])
					    }
				    }
				 }
			  	//console.log(JSON.stringify(raceDocument))

			  	//Add to the database
			  	const docClient = new AWS.DynamoDB.DocumentClient()

			  	const queryParams ={
			  		TableName: 'races',
			  		Key:{
			  			_id:parsedMessage.raceid
			  		}
			  	}

			  	docClient.get(queryParams).promise()
			  	.then(existingDoc => {
			  		//console.log("ExistingDoc: " + JSON.stringify(existingDoc))
			  		
			  		if(existingDoc.Item){
			  			//console.log("ExistingDoc: " + JSON.stringify(existingDoc))
			  			callback(null,  "result for " + parsedMessage.resulturl + " already exists")
			  		}
			  		else{ //add it to the database
			  			
					    const addParams={
					      TableName: 'races',
					      Item: raceDocument
					    }

					    docClient.put(addParams).promise().then(data => {
					      callback(null, "added result for " + parsedMessage.resulturl)
					    })
					    .catch(error => {
					      callback(JSON.stringify(error))
					    })
					 }

				})
				.catch(error => {
					      callback("Error looking for race " + JSON.stringify(error))
				})
		})
	  	.catch(error => {
	  		//console.log("Promise.all error " + JSON.stringify(error))
	  		callback("Promise.all error " + JSON.stringify(error))
	  	})

  	
  })
  .catch(error => {
  	//console.log("Caught error: " + JSON.stringify(error))
    callback("rpwrapperlambda invocationn error: " + JSON.stringify(error) + " invocation: " + JSON.stringify(params) + "message: " + message)
  })
    
}


const getHorsePromises = (results, raceid) => {

	return results.horseids.map(horseid => {
		return new Promise((resolve, reject) =>{
			

			//build a performance record for this horse
			let performance = {
	            date:results.date,
	            distance:results.distanceinmetres,
	            going:results.going,
	            surface:results.surface,
	            racetype:results.raceType,
	            weight:results.horses[horseid].weight,
	            speed:results.horses[horseid].speed,
	            position:results.horses[horseid].pos,
	            price: results.horses[horseid].price,
	            resulturl:results.url

            }

            //does the horse exist
            const docClient = new AWS.DynamoDB.DocumentClient()

		  	const queryParams ={
		  		TableName: 'horses',
		  		Key:{
		  			_id:horseid
		  		}
		  	}

		  	docClient.get(queryParams).promise()
		  	.then(existingDoc => {
		  		//console.log("ExistingDoc: " + JSON.stringify(existingDoc))
		  		
		  		if(existingDoc.Item){
		  			//console.log("ExistingDoc: " + JSON.stringify(existingDoc))
		  			if(existingDoc.Item.performances[raceid]){
		  				//console.log("Existing Performance")
		  				resolve(horseid + " performance exists(" + raceid + ")")
		  			}
		  			else{ //add a new performance for an existing horse
		  				let horseDocument = existingDoc.Item
		  				horseDocument.performances[raceid] = performance
		  				let addParams={
					      TableName: 'horses',
					      Item: horseDocument
					    }
					    //console.log("Add perf horseDocument: " + JSON.stringify(horseDocument))
					    docClient.put(addParams).promise().then(data => {
					      //console.log("Added new performance for horse: " + horseid)
					      resolve(horseid + " added new performance(" + raceid + ")")
					    })
					    .catch(error => {
					      reject("Error adding new performance to existing horse:" + horseid + " " + JSON.stringify(error))
					    })


		  			}
		  			
		  		}
		  		else{ //add it to the database
		  			
		  			let horseDocument = {
		  				_id: horseid,
		  				name: results.horses[horseid].name,
		  				horseurl: results.horses[horseid].horseUrl,
		  				performances: {}
		  			}

		  			horseDocument.performances[raceid] = performance

				    let addParams={
				      TableName: 'horses',
				      Item: horseDocument
				    }

				    docClient.put(addParams).promise().then(data => {
				      //console.log("Added horse: " + horseid)
				      resolve(horseid + " Added new horse")
				    })
				    .catch(error => {
				      reject("Error adding new horse: " + horseid + " " +JSON.stringify(error))
				    })
				 }

			})
			.catch(error => {
				      reject("Error looking for horse record: " + horseid + " " + JSON.stringify(error))
			})


            //console.log("resolve horseid: " + JSON.stringify(performance))
			//resolve(horseid)
		})
	})

}

