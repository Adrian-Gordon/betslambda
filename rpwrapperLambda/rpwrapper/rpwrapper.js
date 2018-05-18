'use strict'

const moment = require('moment')

const PEG = require("pegjs")

const cheerio = require('cheerio')

const getDateCards = (rptoolurl, date) => {
  let result = []
  return new Promise((resolve, reject) => {
    if (typeof date === 'undefined') {
      date = moment().format('YYYY-MM-DD')
    }

    const url = rptoolurl + '/racecards/' + date

    const request = require('request')
    const headers = {
      'User-Agent': 'Mozilla/5.0'
    }

    const options = {
      url: url,
      headers: headers

    }

    request(options, (error, resp, body) => {
      if (error) {
        const obj = {
          status: 'ERROR',
          message: error
        }
        reject(obj)
      } else if (typeof resp === 'undefined') {
        const obj = {
          status: 'ERROR',
          message: 'No response from: ' + url
        }
        reject(obj)
      } else if (resp.statusCode !== 200) {
        var obj = {
          status: 'ERROR',
          message: JSON.stringify('bad response code: ' + resp.statusCode + ' from: ' + url)
        }
        console.log('bad response code: ' + resp.statusCode + ' from: ' + url)
        reject(obj)
      } else {
        
        let $ = cheerio.load(body)
        $('.RC-meetingItem a').each(function (index, value) {
          let raceUrl = $(value).attr('href')
          result.push(raceUrl)
        })

        resolve(result)
      }
    })
  })
}

const getCardData = (rproot,cardurl) => {

  return new Promise((resolve, reject) => {
     const url = rproot + cardurl

      const request = require('request')
      const headers = {
        'User-Agent': 'Mozilla/5.0'
      }

      const options = {
        url: url,
        headers: headers

      }


      request(options, (error, resp, body) => {
      if (error) {
        const obj = {
          status: 'ERROR',
          message: error
        }
        reject(obj)
      } else if (typeof resp === 'undefined') {
        const obj = {
          status: 'ERROR',
          message: 'No response from: ' + url
        }
        reject(obj)
      } else if (resp.statusCode !== 200) {
        var obj = {
          status: 'ERROR',
          message: JSON.stringify('bad response code: ' + resp.statusCode + ' from: ' + url)
        }
        //console.log('bad response code: ' + resp.statusCode + ' from: ' + url)
        reject(obj)
      } else {
        //parse the card data
        //console.log(body)
        try{
          const cardData = parseCardDataFromRaceUrl(url,body)
          let horsesRacesPromises=[]
          //iterate over each horse
          for(let horseid in cardData.horses){
            const horse = cardData.horses[horseid]
            const horseUrl= rproot + horse.url
            //console.log(horseUrl)
            const promise = new Promise((resolve, reject)=> {
              getHorseRaces(horseUrl).then(races => {
                //console.log(races)
                cardData.horses[horseid].races = races
                resolve(true)
              })
            })
            horsesRacesPromises.push(promise)


          }

          Promise.all(horsesRacesPromises).then(results => {
              resolve(cardData)
            })
          
        }catch(error){
          reject(error)
        }
      }
    })
  })
}

const getHorseRaces = hurl => {

  const horseurl = hurl.replace("profile/","profile/tab/") + "/form";
  return new Promise((resolve, reject) => {
     
      const request = require('request')
      const headers = {
        'User-Agent': 'Mozilla/5.0'
      }

      const options = {
        url: horseurl,
        headers: headers

      }


      request(options, (error, resp, body) => {
      if (error) {
        const obj = {
          status: 'ERROR',
          message: error
        }
        reject(obj)
      } else if (typeof resp === 'undefined') {
        const obj = {
          status: 'ERROR',
          message: 'No response from: ' + url
        }
        reject(obj)
      } else if (resp.statusCode !== 200) {
        var obj = {
          status: 'ERROR',
          message: JSON.stringify('bad response code: ' + resp.statusCode + ' from: ' + url)
        }
        //console.log('bad response code: ' + resp.statusCode + ' from: ' + url)
        reject(obj)
      } else {
        //parse the horse
        //console.log(body)
        try{
          const horseRacesData = parseHorseRacesFromUrl(body)
          resolve(horseRacesData)
        }catch(error){
          reject(error)
        }
      }
    })
   })
}

const getRaceResult = rurl => {

  console.log("getRaceResult rurl: " + rurl)
  return new Promise((resolve, reject) => {
     
      const request = require('request')
      const headers = {
        'User-Agent': 'Mozilla/5.0'
      }

      const options = {
        url: rurl,
        headers: headers

      }


      request(options, (error, resp, body) => {
      if (error) {
        const obj = {
          status: 'ERROR',
          message: error
        }
        
        reject(obj)
      } else if (typeof resp === 'undefined') {
        const obj = {
          status: 'ERROR',
          message: 'No response from: ' + url
        }
       
        reject(obj)
      } else if (resp.statusCode !== 200) {
        var obj = {
          status: 'ERROR',
          message: JSON.stringify('bad response code: ' + resp.statusCode + ' from: ' + url)
        }
        //console.log('bad response code: ' + resp.statusCode + ' from: ' + url)
        
        reject(obj)
      } else {
        
        //console.log(body)
        try{
          //console.log(body)
          const resultData = parseResultPageBeta(rurl,body)
          
          resolve(resultData)
        
        }catch(error){
          
          reject(error)
        }
      }
    })
   })
}


const  parseCardDataFromRaceUrl = (raceurl,body) => {

  var i=raceurl.lastIndexOf('/');

  var raceid=raceurl.substring(i+1,raceurl.length);
  var raceDateStr=raceurl.substring(i-10,i);
  //console.log('raceDateStr ' + raceDateStr);
  var yearS=raceDateStr.substring(0,4);
  var monthS=raceDateStr.substring(5,7);
  var dayS=raceDateStr.substring(8,11);

  var object={
    
    status:"OK",
    _id:raceid,
    url:raceurl,
    date:{year:yearS,month:monthS,day:dayS},
    horses:{}
  }
  

  const $ = cheerio.load(body);

  var offTime=$('.RC-courseHeader__time').text().replace(/(\r\n|\n|\r)/gm,"").trim();
  var i=offTime.indexOf(':');
  //logger.info("offTime: " + offTime + " i: " + i + " hrs: " + offTime.substring(0,i) + " mins: " + offTime.substring(i+1));
  var otHrs=parseInt(offTime.substring(0,i));
  var otMins=parseInt(offTime.substring(i+1));
  //logger.info(offTime);
  object.offtimeS=offTime;
  object.offtime={
    hours:otHrs,
    minutes:otMins
  }
  

  var fullPlaceText=$('.RC-courseHeader__name').text();
  //console.log("fullPlaceText: " + fullPlaceText);

  try{
    object.meeting=fullPlaceText.replace(/(\r\n|\n|\r)/gm,"").trim().toUpperCase();
  }catch(err){
      object.status='ERROR';
      object.statusmessage="parse error: " + err.message + " when parsing " + fullPlaceText + " in race " + raceurl;
      console.log("parse error: " + err.message + " when parsing " + fullPlaceText + " in race " + raceurl);

  }
  object.surface='TURF';
  if((object.meeting.indexOf("(")!== -1)&&(object.meeting.indexOf(")")!== -1)){
      if((object.meeting.indexOf("(AW)")!== -1)||(object.meeting.indexOf("(AW)")!== -1)){
        object.surface="AW";
      }

    
  }
  //var dateText=$('.RC-courseHeader__date').text();
  //console.log('dateText: ' + dateText);
  var distanceRound=$('.RC-cardHeader__distance').text().trim();
  //logger.info("distanceRound: " + distanceRound);

  try{
    var distObj=cardDistParser.parse(distanceRound);
    //console.log('distance Obj: ' + JSON.stringify(distObj));
    object.distance=distObj;
  }catch(err){
    object.status='ERROR';
    object.statusmessage="parse error: " + err.message + " when parsing " + distanceRound + " in race " + raceurl;
    console.log("parse error: " + err.message + " when parsing " + distanceRound + " in race " + raceurl);

  }

  var conditionsText="";
  var courseInformation=$('.RC-cardHeader__courseDetails span[data-test-selector]');
  //console.log('courseInformation :' + courseInformation.html());
  courseInformation.each(function(index){
    //console.log('text: '+ JSON.stringify($(this).get(0).attribs['data-test-selector']) + ' ' +$(this).text());
    var selector=$(this).get(0).attribs['data-test-selector'];
    if(selector=='RC-header__raceDistance'){
      //console.log('there is a full distance');
      try{
      var distObj=cardDistParser.parse($(this).text().trim().replace('(','').replace(')',''));
      //console.log('distance Obj: ' + JSON.stringify(distObj));
      object.distance=distObj;
      }catch(err){
        //object.status='ERROR';
        //object.distance="parse error: " + err.message + " when parsing " + distanceRound + " in race " + raceurl;
       console.log("parse error: " + err.message + " when parsing " + $(this).text().trim() + " in race " + raceurl);

      }

    }
    else if(selector == 'RC-header__raceInstanceTitle'){
      object.raceType='FLAT';
      if($(this).text().toUpperCase().indexOf(' HURDLE') !== -1){
        object.raceType='HURDLE';
      }
      else if($(this).text().toUpperCase().indexOf(' CHASE') !== -1){
        object.raceType='CHASE';
      }
      else if($(this).text().toUpperCase().indexOf(' NATIONAL HUNT FLAT') !== -1){
        object.raceType='NHFLAT';
      }
      
       

    }
    else if(selector == 'RC-header__raceClass' || selector == 'RC-header__rpAges'){
       conditionsText+= $(this).text().trim();
    }
  });
//  console.log("conditionsText: " +conditionsText);
  try{
   object.conditions=cardConditionsParser.parse(conditionsText);
  }catch(err){
      object.statusmessage="parse error: " + err.message + " when parsing " + conditionsText + " in race " + raceurl;
      object.status='ERROR';
     console.log("parse error: " + err.message + " when parsing " + conditionsText + " in race " + raceurl);

  }

  var goingInformation=$('.RC-cardHeader div[data-test-selector]');
  //console.log($(goingInformation).text());
  goingInformation.each(function(index){
    //console.log($this).text();
    var selector=$(this).get(0).attribs['data-test-selector'];
    if(selector=="RC-headerBox__going"){
    //  console.log("selector: " + selector + "text: " +$(this).text());
      var goingEl=$(this).find('.RC-headerBox__infoRow__content');
      var goingText= $(goingEl).text();
      try{
        var goingObj=cardGoingParser.parse(goingText);
        object.going=goingObj;

      }catch(err){
        object.status='ERROR';
        object.statusmessage="parse error: " + err.message + " when parsing " + goingText + " in race " + raceurl;
        console.log("parse error: " + err.message + " when parsing " + goingText + " in race " + raceurl);
      }
    }
  });

  
  $('.RC-runnerCardWrapper').each(function(index){
    var horseLink=$(this).find('.RC-runnerMainWrapper a');
    var hUrl=horseLink.attr('href');
    var index = hUrl.indexOf('#');
    hUrl=hUrl.substring(0,index);
    var index1=hUrl.indexOf('horse/');
    var index2=hUrl.lastIndexOf('/');
    var hid=hUrl.substring(index1+6,index2);
    var horseName=horseLink.text().trim().toUpperCase();
    

    var weight=$(this).find('.RC-runnerWgt__carried').get(0).attribs['data-order-wgt'];;

 // console.log(hid + " horsename: " + horseName + " url: " + hUrl +" " +  weight);
    object.horses[hid]={
      name:horseName,
      url:hUrl,
      weight:weight
    }

  });
  
  return(object);



}

const parseHorseRacesFromUrl = body => {
  let racesArray=[]
  try{
    //console.log("Go PArse")
    const parsed = JSON.parse(body)
    //console.log("parsed: " + JSON.stringify(parsed))
    const form = parsed.form
    //console.log(JSON.stringify(form))
    for(let id in form){
      const race=form[id];
     //console.log("RACE: " + JSON.stringify(race));
      const raceid=race.raceInstanceUid
      let raceDateTime=race.raceDatetime
      const index=raceDateTime.indexOf('T')
      const raceDate=raceDateTime.substring(0,index)
      const courseUid=race.courseUid
      let courseName=race.courseName
      courseName=courseName.replace(' (A.W)','-aw').toLowerCase().replace(" (july)","-july").replace(' ','-')
     // console.log(raceid + " " + raceDate + " " + courseUid + " " + courseName);
      const url="/results/" + courseUid + "/" + courseName + "/" + raceDate + "/" + raceid
      racesArray.push(url)
    }

  }catch(exception){
    console.log("Exception" + exception)
  }

  return(racesArray)
}


//parse result page from the beta site
const  parseResultPageBeta = (url,body) =>{
    let lps
    let object=new Object()
    object.horseids=[]
    object.horses={}
    object.url=url
   // logger.info("url: " + url);
    const i1=url.lastIndexOf('/')
    object.date=url.substring(i1-10,i1)

    //console.log("body: " + body);
    let $ = cheerio.load(body)

    const raceTime=$('h1 span').first().text()
   // console.log("raceTime: " + raceTime);
    object.time=raceTime

    const course=$('h1 a').text().trim().toUpperCase()
   // logger.info("Course: " + course);
    object.course=course
    
    let textDesc=$('h2').text()

    object.raceType='FLAT'
    if(textDesc.toUpperCase().indexOf(' HURDLE') !== -1){
      object.raceType='HURDLE'
    }
    else if(textDesc.toUpperCase().indexOf(' CHASE') !== -1){
      object.raceType='CHASE'
    }
    else if(textDesc.toUpperCase().indexOf(' NATIONAL HUNT FLAT') !== -1){
      object.raceType='NHFLAT'
    }

    const raceClassS=$(".rp-raceTimeCourseName_class").text().trim()
   // console.log("raceClassS: " + raceClassS);

    const raceAgesS=$(".rp-raceTimeCourseName_ratingBandAndAgesAllowed").text().trim()

   // console.log("raceAgesS: " + raceAgesS);

    const condsS=raceClassS + raceAgesS
     if(condsS !="")
        object.conditions=conditionsParser.parse(condsS)


    const raceDistFullS=$(".rp-raceTimeCourseName_distanceFull").text().trim()

   // console.log("raceDistFullS: " + raceDistFullS);

    if(raceDistFullS !== ""){
      let raceDistObj=conditionsParser.parse(raceDistFullS)
     // console.log("raceDistObj: " + JSON.stringify(raceDistObj));
      if(raceDistObj[0] !== null){

        if(typeof raceDistObj[0].miles == 'undefined')
            raceDistObj[0].miles=0
          if(typeof raceDistObj[0].furlongs=='undefined')
            raceDistObj[0].furlongs=0
          if(typeof raceDistObj[0].yards == 'undefined')
            raceDistObj[0].yards=0
          //logger.info("distancep cond: " + JSON.stringify(cond));
          object.distanceinyards=(raceDistObj[0].miles * 1760) + (raceDistObj[0].furlongs * 220) + raceDistObj[0].yards
          object.distanceinmetres=object.distanceinyards * 0.9144

      }
    }
    else{
      const raceDistS=$(".rp-raceTimeCourseName_distance").text().trim()
     // console.log("raceDistS: " + raceDistS);
      let raceDistObj=conditionsParser.parse(raceDistS)
      //console.log('rdo: ' + JSON.stringify(raceDistObj));
      if(raceDistObj[0] !== null){

        if(typeof raceDistObj[0].miles == 'undefined')
            raceDistObj[0].miles=0
          if(typeof raceDistObj[0].furlongs=='undefined')
            raceDistObj[0].furlongs=0
          if(typeof raceDistObj[0].yards == 'undefined')
            raceDistObj[0].yards=0
          //logger.info("distancep cond: " + JSON.stringify(cond));
          object.distanceinyards=(raceDistObj[0].miles * 1760) + (raceDistObj[0].furlongs * 220) + raceDistObj[0].yards
          object.distanceinmetres=object.distanceinyards * 0.9144

      }
    }

    

     const goingS=$(".rp-raceTimeCourseName_condition").text().trim()
    // console.log("goingS: " + goingS);
     object.going=goingS

     const raceTimeS=$(".rp-raceInfo span").eq(1).text().trim()
    // console.log("raceTimeS: " + raceTimeS);
     object.racetime=timeParser.parse(raceTimeS)[0]
     object.racetime.timeinseconds=(object.racetime.minutes * 60) + object.racetime.seconds + (object.racetime.milliseconds /100)
     //console.log("Racetime: " + JSON.stringify(object.racetime));

     if(typeof lps=='undefined'){
      let surface="TURF";
      if(object.going.indexOf('Standard') !== -1 ||object.going.indexOf('Fast')!== -1 ||object.going.indexOf('Slow')!== -1){
        surface="AW"
      }

      lps = getLPS(object.raceType,surface,object.course,object.going,url)
      object.surface=surface
    }
   // console.log("lps: " + lps);

    
    const resultGrid=$(".rp-horseTable__mainRow")

    for(let i=0;i<resultGrid.length;i++){
      
      const theTr=resultGrid[i]


      let pos=$(theTr).find(".rp-horseTable__pos__number").text()
      let index=pos.indexOf('(')
        if(index != -1){
          pos=pos.substring(0,index-1).trim()
        }
        else pos=pos.trim()
     // logger.info("pos: " + pos);

      const horse=$(theTr).find(".rp-horseTable__horse a").first()
      const horseName=$(horse).text().trim().toUpperCase()
      const horseUrl=$(horse).attr('href')
      const i1=horseUrl.indexOf('horse/')
      const i2=nthIndex(horseUrl,'/',4)
      const horseId=horseUrl.substring(i1+6,i2)


      //console.log('horseid:' + horseId +' horseName: ' + horseName + " " + horseUrl);

      const horsePriceS=$(theTr).find(".rp-horseTable__horse__price").text().trim()
     // console.log("horsePriceS: " + horsePriceS);
      let price
      try{
           price=priceParser.parse(horsePriceS)
      }catch(exception){
            price={fractiontop:0, fractionbottom:0}
      }
     // console.log('price: ' + JSON.stringify(price));

      const weightStonesS=$(theTr).find(".rp-horseTable__wgt span").eq(0).text().trim()
     // console.log("weightStonesS: " + weightStonesS);

      const weightLbS=$(theTr).find(".rp-horseTable__wgt span").eq(1).text().trim()
     // console.log("weightLbS: " + weightLbS);

      const weight=parseInt(weightStonesS) * 14 + parseInt(weightLbS)
      //console.log("weight: " + weight);

      const beatenByS=$(theTr).find(".rp-horseTable__pos__length span").eq(0).text().trim()

      const beatenByCumulativeS=$(theTr).find(".rp-horseTable__pos__length span").eq(1).text().trim().replace('[','').replace(']','')

      let dist=0
      let cumulativeDist=0
     //logger.info("beatenByS: " + beatenByS + " beatenByCumulativeS: " + beatenByCumulativeS); 

     // console.log('char: ' + beatenByCumulativeS.charCodeAt(2).toString(16));
      if(parseInt(pos)==1){

      }
      else if(parseInt(pos)==2){
         if(beatenByS !== ""){
           dist=distParser.parse(beatenByS)
            cumulativeDist=dist
          }
      }
      else{
        if(beatenByS !== ""){
           dist=distParser.parse(beatenByS)
           if(beatenByCumulativeS !== "")
            cumulativeDist=distParser.parse(beatenByCumulativeS)
           else cumulativeDist=dist
        }

       
      }
      if((cumulativeDist==0)&&(parseInt(pos) !== 1)){
        dist=500
        cumulativeDist=500
      }
     
      
     // console.log("dist: " + dist + " cumulativeDist: " + cumulativeDist);

      let cumulativetime=cumulativeDist * (1.0 / lps)
      let totaltime=cumulativetime + object.racetime.timeinseconds
      let speed=object.distanceinmetres/totaltime
     // console.log("cumulativetime: " + cumulativetime + " totaltime:  " + totaltime + " speed: " + speed);

      if(typeof horseId !== 'undefined'){
        //var weight=weightParser.parse(weightCarriedS);
        object.horseids.push(horseId)
        object.horses[horseId]={name:horseName,horseUrl,dstDesc:beatenByS,pos:parseInt(pos),dist:dist,cumulativedist:cumulativeDist,weight:weight,price:price,cumulativetime:cumulativetime,totaltime:totaltime,speed:speed}
      }

    }

    return(object)


  
}


const lengthsPerSecond={
  "FLAT":{
    "TURF":{
      "Firm":6,
      "Good To Firm":6,
      "Good":6,
      "Good To Soft":5.5,
      "Good To Yielding":5.5,
      "Soft":5,
      "Yielding":5,
      "Heavy":5

    },
    "AW":{
       "LINGFIELD (AW)":6,
       "KEMPTON (AW)":6,
       "NEWCASTLE (AW)":6,
       "WOLVERHAMPTON (AW)": 6,
       "SOUTHWELL (AW)" : 5,
       "CHELMSFORD (AW)":6,
       "DUNDALK (AW)":6,
       "DUNDALK (AW) (IRE)":6,
       "MEYDAN":6,
       "AL AIN":6

    }

  },
  "HURDLE":{
      "Firm":5,
      "Good To Firm":5,
      "Good":5,
      "Good To Soft":4.5,
      "Good To Yielding":4.5,
      "Soft":4,
      "Yielding":4,
      "Heavy":4

  },
  "CHASE":{
      "Firm":5,
      "Good To Firm":5,
      "Good":5,
      "Good To Soft":4.5,
      "Good To Yielding":4.5,
      "Soft":4,
      "Yielding":4,
      "Heavy":4
  },
  "NHFLAT":{
      "Firm":5,
      "Good To Firm":5,
      "Good":5,
      "Good To Soft":4.5,
      "Good To Yielding":4.5,
      "Soft":4,
      "Yielding":4,
      "Heavy":4

  },
}

/* USAGE: getLPS('FLAT','AW','LINGFIELD (AW)', 'Good',)*/
const getLPS = (raceType,surface,course,going,url) => {
  //logger.info("getLPS " + raceType + " " + surface + " " + course + " " + going);
  try{
  var lps
  var typeObj=lengthsPerSecond[raceType]

  if(raceType=='FLAT'){
    if(surface=='TURF'){
      lps=typeObj['TURF'][going]

    }
    else{
      lps=typeObj["AW"][course]
    }
  }
  else{
    lps=typeObj[going]
  }
  if(typeof lps == 'undefined'){
   console.log("No LPS: " + raceType + " " + surface + " |" + course + "| " + going + "|" + url)
    if(raceType=='FLAT'){
      return(5.5)
    }
    else{
      return(4.5)
    }
  }
  else{
    //logger.info("LPS returns: " + lps);
  }


  return(lps)
  }catch(err){
    console.log("error in getLPS: " + err + " " + raceType + " " + surface + " " + course + " " + going + "|" + url)
    
    if(raceType=='FLAT'){
      return(5.5)
    }
    else{
      return(4.5)
    }
  }

}


const cardDateParseStr="start=dateExpr\n"
+"dateExpr=dayTextExpr ', ' day:day month:month year:year {return {year:year,month:month,day:day}}\n"
+"dayTextExpr='MONDAY'\n"
+"/'TUESDAY'\n"
+"/'WEDNESDAY'\n"
+"/'THURSDAY'\n"
+"/'FRIDAY'\n"
+"/'SATURDAY'\n"
+"/'SUNDAY'\n"
+"day=day:[0-9]+ ' ' { return day.join(''); }\n"
+"month='JANUARY ' {return '01'}\n"
+"/'FEBRUARY ' {return '02'}\n"
+"/'MARCH ' {return '03'}\n"
+"/'APRIL ' {return '04'}\n"
+"/'MAY ' {return '05'}\n"
+"/'JUNE ' {return '06'}\n"
+"/'JULY ' {return '07'}\n"
+"/'AUGUST ' {return '08'}\n"
+"/'SEPTEMBER ' {return '09'}\n"
+"/'OCTOBER ' {return '10'}\n"
+"/'NOVEMBER ' {return '11'}\n"
+"/'DECEMBER ' {return '12'}\n"
+"year=year:[0-9]+ { return year.join(''); }\n"

const cardConditionsParserStr="start= (ws /expr)+\n"
+"ws=[ \\n]+ {return null}\n"
+"expr=classExpr\n"
+"/condExpr\n"
+"/ageParCondExpr\n"
+"/ageORCondExpr\n"
+"classExpr='(' 'CLASS' ws int:integer ')'   {return{conditiontype:'class', value:int}}\n"
+"/'(' 'Grade' ws int:integer ')'   {return{conditiontype:'grade', value:int}}\n"
+"/'(' 'Class' ws int:integer ')'   {return{conditiontype:'class', value:int}}\n"
+"ageORCondExpr='(' agecond:agecond ' ' ORCond:ORCond ')' {return[agecond,ORCond]}\n"
+"condExpr='(' lower:integer '-' upper:integer ')'  {return{conditiontype:'conditions',upper:upper,lower:lower}}\n"
+"/'(' lower:integer '-' upper:integer ',' ws age:agecond ')'  {return{conditiontype:'conditions',upper:upper,lower:lower,ageconditions:age}}\n"
+"ageParCondExpr= '(' lower:integer '-' upper:integer 'yo' ')' {return{conditiontype:'conditions',ageconditions:{upper:upper,lower:lower}}}\n"
+"/ '(' lower:integer 'yo+' ')' {return{conditiontype:'conditions',ageconditions:{lower:lower}}}\n"
+"/ '(' lower:integer 'yo' ')' {return{conditiontype:'conditions',ageconditions:{lower:lower,upper:lower}}}\n"
+"agecond= int:integer 'yo+' {return {conditiontype:'conditions', ageconditions:{lower: int}}}\n"
+"/int:integer 'yo' {return {conditiontype:'conditions',ageconditions:{lower:int,upper:int}}}\n"
+"/lower:integer '-' upper:integer {return{condtitiontype:'conditions',ageconditions:{upper:upper,lower:lower}}}\n"
+"ORCond= lower:integer '-' upper:integer  {return{conditiontype:'conditions',upper:upper,lower:lower}}\n"
+"integer 'integer'= digits:[0-9]+ { return parseInt(digits.join(''), 10); }\n"
+"anything=.* {return null}"


const cardDistParserStr="start=de:distExpr ' Inner' {return de}\n"
+"/de:distExpr ' Old' {return de}\n"
+"/de:distExpr ' New' {return de}\n"
+"/de:distExpr ' Grand National' {return de}\n"
+"/de:distExpr ' Row' {return de}\n"
+"/distExpr\n"
+"distExpr=miles:integer 'm' yards:integer 'y'  {return{miles:miles,yards:yards}}\n"
+"/furlongs:integer 'f' yards:integer 'y'  {return{furlongs:furlongs,yards:yards}}\n"
+"/miles:integer 'm' furlongs:integer 'f' yards:integer 'y'  {return{miles:miles,furlongs:furlongs,yards:yards}}\n"
+"/miles:integer 'm' furlongs:integer '\xBD' 'f'  {return{miles:miles,furlongs:(furlongs + 0.5)}}\n"
+"/miles:integer 'm' '\xBD' 'f'  {return{miles:miles,furlongs: 0.5}}\n"
+"/miles:integer 'm' furlongs:integer 'f'  {return{miles:miles,furlongs:furlongs}}\n"
+"/furlongs:integer '\xBD' 'f'  {return{furlongs:f(urlongs + 0.5)}}\n"
+"/furlongs:integer 'f'  {return{furlongs:furlongs}}\n"
+"/miles:integer 'm'  {return{miles:miles}}\n"
+"integer 'integer'= digits:[0-9]+ { return parseInt(digits.join(''), 10); }\n"

const cardGoingParserStr="start=goingExpr\n"
+"goingExpr= going:'Standard To Slow' anything {return{going:going}}\n"
+"/going:'Standard' anything {return{going:going}}\n"
+"/going:'Slow' anything {return{going:going}}\n"
+"/going:'Fast' anything {return{going:going}}\n"
+"/going:'Heavy' anything {return{going:going}}\n"
+"/going:'Very Soft' anything {return{going:'HEAVY'}}\n"
+"/going:'Soft' anything {return{going:going}}\n"
+"/going:'Good To Soft' anything {return{going:going}}\n"
+"/going:'Good To Firm' anything {return{going:going}}\n"
+"/going:'Good To Yielding' anything {return{going:going}}\n"
+"/going:'Good' anything {return{going:going}}\n"
+"/going:'Firm' anything {return{going:going}}\n"
+"/going:'Yielding' anything {return{going:going}}\n"
+"integer 'integer'= digits:[0-9]+ { return parseInt(digits.join(''), 10); }\n"
+"anything=.* {return null}\n"

const conditionsParserStr="start=(ws /expr)+\n"
+"ws=[ \\n]+ {return null}\n"
+"expr=classExpr\n"
+"/condExpr\n"
+"/ageParCondExpr\n"
+"/distParExpr\n"
+"/distExpr\n"
+"/distCourseExpr\n"
+"/goingExpr\n"
+"classExpr='(' 'Class' ws int:integer ')'   {return{conditiontype:'class', value:int}}\n"
+"condExpr='(' lower:integer '-' upper:integer ')'  {return{conditiontype:'conditions',upper:upper,lower:lower}}\n"
+"/'(' lower:integer '-' upper:integer ',' ws age:agecond ')'  {return{conditiontype:'conditions',upper:upper,lower:lower,ageconditions:age}}\n"
+"ageParCondExpr= '(' lower:integer '-' upper:integer 'yo' ')' {return{conditiontype:'conditions',ageconditions:{upper:upper,lower:lower}}}\n"
+"/ '(' integer '-' integer ', ' lower:integer '-' upper:integer 'yo' ')' {return{conditiontype:'conditions',ageconditions:{upper:upper,lower:lower}}}\n"
+"/ '(' integer '-' integer ', ' lower:integer 'yo+' ')' {return{conditiontype:'conditions',ageconditions:{lower:lower}}}\n"
+"/ '(--, ' lower:integer 'yo+' ')' {return{conditiontype:'conditions',ageconditions:{lower:lower}}}\n"
+"/ '(--, ' lower:integer 'yo' ')' {return{conditiontype:'conditions',ageconditions:{lower:lower}}}\n"
+"/ '(--, ' lower:integer '-' upper:integer 'yo' ')' {return{conditiontype:'conditions',ageconditions:{lower:lower,upper:upper}}}\n"
+"/ '(' lower:integer 'yo+' ')' {return{conditiontype:'conditions',ageconditions:{lower:lower}}}\n"
+"/ '(' lower:integer 'yo' ')' {return{conditiontype:'conditions',ageconditions:{lower:lower,upper:lower}}}\n"
+"agecond= int:integer 'yo+' {return {lower: int}}\n"
+"/int:integer 'yo' {return {lower:int,upper:int}}\n"
+"/lower:integer '-' upper:integer {return{ageconditions:{upper:upper,lower:lower}}}\n"
+"distParExpr='(' miles:integer 'm' yards:integer 'y' ')' {return{conditiontype:'distancep',miles:miles,yards:yards}}\n"
+"/'(' miles:integer 'm' yards:integer 'yds' ')' {return{conditiontype:'distancep',miles:miles,yards:yards}}\n"
+"/'(' furlongs:integer 'f' yards:integer 'y' ')' {return{conditiontype:'distancep',furlongs:furlongs,yards:yards}}\n"
+"/'(' furlongs:integer 'f' yards:integer 'yds' ')' {return{conditiontype:'distancep',furlongs:furlongs,yards:yards}}\n"
+"/'(' miles:integer 'm' furlongs:integer 'f' yards:integer 'y' ')' {return{conditiontype:'distancep',miles:miles,furlongs:furlongs,yards:yards}}\n"
+"/'(' miles:integer 'm' furlongs:integer 'f' yards:integer 'yds' ')' {return{conditiontype:'distancep',miles:miles,furlongs:furlongs,yards:yards}}\n"
+"distExpr=miles:integer 'm' furlongs:'\xBD' 'f' {return{conditiontype:'distance',miles:miles,furlongs:furlongs}}\n"
+"/miles:integer 'm' furlongs:integer '\xBD' 'f' {return{conditiontype:'distance',miles:miles,furlongs:furlongs + '\xBD'}}\n"
+"/miles:integer 'm' furlongs:integer 'f' {return{conditiontype:'distance',miles:miles,furlongs:furlongs}}\n"
+"/miles:integer 'm' {return{conditiontype:'distance',miles:miles}}\n"
+"/furlongs:integer 'f' {return{conditiontype:'distance',furlongs:furlongs}}\n"
+"/furlongs:integer '\xBD' 'f' {return{conditiontype:'distance',furlongs:furlongs}}\n"
+"distCourseExpr='Str'\n"
+"/'Rnd' {return null}\n"
+"/'OMS' {return null}\n"
+"/'Inner' {return null}\n"
+"/'July' {return null}\n"
+"/'Row' {return null}\n"
+"/'omsNew' {return null}\n"
+"/'New' {return null}\n"
+"/'Poly' {return null}\n"
+"/'Old' {return null}\n"
+"/'Grand National' {return null}\n"
+"/'Row' {return null}\n"
+"/'Mildmay' {return null}\n"
+"/'Brush' {return null}\n"
+"/'Winter' {return null}\n"
+"/'Summer' {return null}\n"
+"/'X-Country' {return null}\n"
+"/'Tap' {return null}\n"
+"/'Bank' {return null}\n"
+"goingExpr= going:'Standard To Slow' anything {return{conditiontype:'going',going:going}}\n"
+"/going:'Standard' anything {return{conditiontype:'going',going:going}}\n"
+"/going:'Slow' anything {return{conditiontype:'going',going:going}}\n"
+"/going:'Fast' anything {return{conditiontype:'going',going:going}}\n"
+"/going:'Heavy' anything {return{conditiontype:'going',going:going}}\n"
+"/going:'Very Soft' anything {return{conditiontype:'going',going:'Heavy'}}\n"
+"/going:'Hard' anything {return{conditiontype:'going',going:'Firm'}}\n"
+"/going:'Holding' anything {return{conditiontype:'going',going:'Soft'}}\n"
+"/going:'Soft' anything {return{conditiontype:'going',going:going}}\n"
+"/going:'Good To Soft' anything {return{conditiontype:'going',going:going}}\n"
+"/going:'Yielding To Soft' anything {return{conditiontype:'going',going:going}}\n"
+"/going:'Good To Firm' anything {return{conditiontype:'going',going:going}}\n"
+"/going:'Good To Yielding' anything {return{conditiontype:'going',going:going}}\n"
+"/going:'Good' anything {return{conditiontype:'going',going:going}}\n"
+"/going:'Firm' anything {return{conditiontype:'going',going:going}}\n"
+"/going:'Yielding' anything {return{conditiontype:'going',going:going}}\n"
+"integer 'integer'= digits:[0-9]+ { return parseInt(digits.join(''), 10); }\n"
+"anything=.* {return null}\n"

const timeParserStr="start=(ws /timeexpr)+\n"
+"ws=[ \\n]+ {return null}\n"
+"timeexpr=minutes:integer 'm' ' ' seconds:integer '.' milliseconds:integer 's' anything {return{minutes:minutes, seconds:seconds,milliseconds:milliseconds}}\n"
+"/seconds:integer '.' milliseconds:integer 's' anything {return{minutes:0, seconds:seconds,milliseconds:milliseconds}}\n"
+"integer 'integer'= digits:[0-9]+ { return parseInt(digits.join(''), 10); }\n"
+"anything=.* {return null}\n";

const priceParseStr="start= priceExpr\n"
+"evensExpr= ignore* 'Evens' ignore* {return{fractiontop:1, fractionbottom:1}}\n"
+"priceExpr= ignore* top:integer '/'  bottom:integer ignore* {return{fractiontop:top,fractionbottom:bottom}}\n"
+"integer 'integer'= digits:[0-9]+ { return parseInt(digits.join(''), 10); }\n"
+"ignore=ws\n"
+"/anything\n"
+"ws=[ \\n\\t\\r]+ {return null}\n"
+"anything=[a-zA-Z()\'] {return null}\n"

//distance beaten, this is:
const distParserStr="start=(integerspace/integerfraction/integer/fraction/space/desc)\n"
+"integer 'integer'= digits:[0-9]+ { return parseInt(digits.join(''), 10); }\n"
+"integerspace=int:integer ' '{return int}\n"
+"integerfraction= int:integer frac:fraction {return (int + frac)}\n"
+"fraction='\xBE ' {return 0.75}\n"
+"/'\xBE' {return 0.75}\n"
+"/'\xBD ' {return 0.5}\n"
+"/'\xBD' {return 0.5}\n"
+"/'\xBC ' {return 0.25}\n"
+"/'\xBC' {return 0.25}\n"
+"space= ' ' {return 0}\n"
+"desc='nk ' {return 0.25}\n"
+"/'nk' {return 0.25}\n"
+"/'snk ' {return 0.25}\n"
+"/'snk' {return 0.25}\n"
+"/'hd ' {return 0.1}\n"
+"/'hd' {return 0.1}\n"
+"/'nse' {return 0.02}\n"
+"/'nse ' {return 0.02}\n"
+"/'shd ' {return 0.05}\n"
+"/'shd' {return 0.05}\n"
+"/'sht-hd ' {return 0.05}\n"
+"/'sht-hd' {return 0.05}\n"
+"/'dht ' {return 0.0}\n"
+"/'dht' {return 0.0}\n"
+"/'dist ' {return 30.0}\n"
+"/'dist' {return 30.0}\n"

const cardDateParser=PEG.generate(cardDateParseStr)

const cardConditionsParser=PEG.generate(cardConditionsParserStr)

const cardDistParser=PEG.generate(cardDistParserStr)

const cardGoingParser=PEG.generate(cardGoingParserStr)

const conditionsParser=PEG.generate(conditionsParserStr)

const timeParser=PEG.generate(timeParserStr)

const priceParser=PEG.generate(priceParseStr)

const distParser=PEG.generate(distParserStr)

const nthIndex = (str, pat, n) => {
    let L= str.length, i= -1;
    while(n-- && i++<L){
        i= str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}

module.exports = Object.assign({}, {getDateCards, getCardData, getHorseRaces, getRaceResult})
