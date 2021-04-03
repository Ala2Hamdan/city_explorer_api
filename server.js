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
const DATABASE_URL= process.env.DATABASE_URL;

let lat='';
let lon='';
app.use(cors());
app.get('/location',handleLocation);
app.get('/weather',handleWeather);
app.get('/parks',handlePark);
// app.listen(PORT,()=>{
//     console.log(`this app is listening to the port ${PORT}`);
// });
const pg = require('pg');
const client = new pg.Client(DATABASE_URL);
client.on('error', err => { console.log('Unable to connect to database'); });


function handleLocation(request,response){
const  locationCity = request.query.city;
const dbsql = "SELECT * FROM locations WHERE search_query=$1"
 let values = [locationCity]
 client.query(dbsql, values).then((data)=>{
    if(data.rowCount === 0){
      let url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&format=json&q=${locationCity}`;
      superagent.get(url).then(res => {
        let data = res.body[0];
        lat = data.lat;
        lon = data.lon;
        let locationObject = new Location(locationCity, data.display_name,data.lat,data.lon);
        const insertValue = 'INSERT INTO locations (search_query,formatted_query, latitude,longitude) VALUES ($1, $2 ,$3 ,$4);';
        const newRow = [locationObject.search_query, locationObject.formatted_query ,locationObject.latitude,locationObject.longitude];
        client.query(insertValue, newRow)
        .then((data) => {
          response.send(data.rows[0]);
        });
      })
    } else {
      lat = data.rows[0].latitude;
      lon = data.rows[0].longitude;
      response.send(data.rows[0]);
    }
  })
// let url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&format=json&q=${locationCity}`;
// superagent.get(url).then(dataResponse =>{
//     const data=dataResponse.body[0];
   
//     lat = data.lat;
//    lon = data.lon;  
//     res.send(new Location(locationCity,data.display_name , data.lat ,data.lon));
//     // console.log(data);
// });

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
 
client.connect().then(() => {
    app.listen(PORT, () => {
      console.log('app is listning on port' + PORT);
    });
  }).catch(err => {
    console.log('Sorry there is an error' + err);
  });
