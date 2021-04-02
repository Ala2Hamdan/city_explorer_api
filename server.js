'use strict';
const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const cors = require('cors');
let app = express();



app.use(cors());

app.get('/location',handleLocation);
app.get('/weather',handleWeather);
app.use('*', errors);

function errors(requset, response ){
    response.status(500).send('there is Error');
}

let arrayDataWeather=[];
app.listen(PORT,()=>{
    console.log(`this app is listening to the port ${PORT}`);
});


function handleLocation(req,res){
const  locationCity = req.query.city;
const locationDataJson = require('./data/location.json');
console.log(locationDataJson);
  
    res.send(new Location(locationCity,locationDataJson[0].display_name , locationDataJson[0].lat ,locationDataJson[0].lon));


}

function handleWeather(req,res){
    arrayDataWeather=[];
    const weatherDataJson = require('./data/weather.json');
    // console.log(weatherDataJson);
    let objectData =weatherDataJson.data;
    console.log(objectData);
    objectData.forEach(element => {
        let description = element.weather.description;
        let datetime=element.datetime;
        
   new  Weather (description,datetime);
   console.log(`valid_date....... ${element.datetime}`)
   console.log(`description ${element.weather.description}`)
    });

    res.send(arrayDataWeather);
    
}



    




function Location (search_query,formatted_query,latitude,longitude){
    this.search_query=search_query;
    this.formatted_query=formatted_query;
    this.latitude=latitude;
    this.longitude=longitude;
}

function Weather (forecast,time){
    this.forecast=forecast;
    this.time=time;
    arrayDataWeather.push(this);
}


