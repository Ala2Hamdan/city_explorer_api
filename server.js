'use strict';
const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const cors = require('cors');
let app = express();
const superagent = require('superagent'); 

const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PARKS_API_KEY = process.env.PARKS_API_KEY;
let lat='';
let lon='';
app.use(cors());
app.get('/location',handleLocation);
app.get('/weather',handleWeather);
app.get('/parks',handlePark);
app.listen(PORT,()=>{
    console.log(`this app is listening to the port ${PORT}`);
});


function handleLocation(req,res){
const  locationCity = req.query.city;
let url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&format=json&q=${locationCity}`;
superagent.get(url).then(dataResponse =>{
    const data=dataResponse.body[0];
    // let cityLocation = 
    lat = data.lat;
   lon = data.lon;  
    res.send(new Location(locationCity,data.display_name , data.lat ,data.lon));
    console.log(data);
});

}

function handleWeather(req,res){
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?key=${WEATHER_API_KEY}&lat=${lat}&lon=${lon}`
    superagent.get(url).then(response =>{
        const result =response.body;
       res.send( result.data.map(element =>{

       return new Weather (element.weather.description, element.datetime ) ;
    
        })
         ) 
       
})


}

function handlePark(req,res){

  const url=`https://developer.nps.gov/api/v1/parks?parkCode=la&limit=10&api_key=${PARKS_API_KEY}`;
    superagent.get(url).then(response =>{
        // console.log(response.body.data);
    let parkData= response.body.data.map(data=>{
        
            let name =data.fullName;
            let address=data.addresses[0].city;
            let fee=data.entranceFees[0].cost;
            let description= data.description;
            let  url=data.url;
            
            return  new Parks(name,address ,fee,description,url);
            // console.log(parkDataObject);
        
        })
       
        res.send(parkData);
    })
      .catch((error) => {
      res.status(500).send('something wrong');
      })
    }




function Location (search_query,formatted_query,latitude,longitude){
    this.search_query=search_query;
    this.formatted_query=formatted_query;
    this.latitude=latitude;
    this.longitude=longitude;
}
let arr=[];
function Weather (forecast,time){
    this.forecast=forecast;
    this.time=time;
    arr.push(this);
}

function Parks (name,address ,fee,description,url){
    this.name=name;
    this.address= address;
    this.fee=fee;
    this.description=description;
    this.url=url

}
