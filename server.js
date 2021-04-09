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
const MOVIE_API_KEY=process.env.MOVIE_API_KEY;
const YELP_API_KEY=process.env.YELP_API_KEY;


let lat='';
let lon='';
app.use(cors());
app.get('/location',handleLocation);
app.get('/weather',handleWeather);
app.get('/parks',handlePark);
app.get('/movies',handlMovies);
app.get('/yelp',handleYelp);

const pg = require('pg');
const client = new pg.Client(DATABASE_URL);
client.on('error', err => { console.log('Unable to connect to database'); });


function handleLocation(request,response){
const  locationCity = request.query.city;
const dbsql = "SELECT * FROM locations WHERE search_query=$1"
 let values = [locationCity]
 client.query(dbsql, values).then((data)=>{
      if (data.rowCount){
        response.send(data.rows[0]);
        lat = data.rows[0].latitude;
        lon = data.rows[0].longitude;
      }else{
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
              });
      }

  })   
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
  const city = req.query.search_query;
  const url=`https://developer.nps.gov/api/v1/parks?limit=10&api_key=${PARKS_API_KEY}&q=${city}`;
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
function handlMovies(request,response){
  movieArray=[];
   const url=`https://api.themoviedb.org/3/movie/top_rated?api_key=${MOVIE_API_KEY}`;
   superagent.get(url).then(res=>{
    

    const data =res.body.results;
    data.forEach(element=>{
  
     let movieObject = new Movies(element.title,element.overview,element.vote_average,element.vote_count,element.poster_path,element.popularity,element.release_date);
    })

    response.send(movieArray);

   })
   .catch((error) => {
    res.status(500).send('something wrong');
    });
}
let startNumber=0;
function handleYelp(request,response){
  yelpArrayObject=[];
  const  locationCity = request.query.city;
  const url =`https://api.yelp.com/v3/businesses/search?location=${locationCity}&limit=30`;
  superagent.get(url).set('Authorization',`Bearer ${YELP_API_KEY}`).then(data=>{
    // console.log(data.body);
    const superdata = data.body.businesses;
    superdata.forEach(dataYelp=>{
      new Yelp (dataYelp.name ,dataYelp.image_url,dataYelp.price,dataYelp.rating,dataYelp.url)

    })
    let secoundGroup=startNumber+5;
    let groups=yelpArrayObject.slice(startNumber,secoundGroup);
    startNumber=startNumber+5;

   response.send(groups);

  })

  .catch((error)=>{res.status(500).send(error)})

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
let movieArray=[];
function Movies (title,overview,average_votes,total_votes,image_url,popularity,released_on){
    this.title = title;
    this.overview=overview;
    this.average_votes=average_votes;
    this.total_votes=total_votes;
    this.image_url='https://image.tmdb.org/t/p/w500/'+image_url;
    this.popularity=popularity;
    this.released_on=released_on;
    movieArray.push(this);
}

let yelpArrayObject=[];
function Yelp (name ,image_url,price, rating,url){
  this.name = name;
  this.image_url=image_url;
  this.price=price;
  this.rating=rating;
  this.url=url;
  yelpArrayObject.push(this);
}
 
client.connect().then(() => {
    app.listen(PORT, () => {
      console.log('app is listning on port' + PORT);
    });
  }).catch(err => {
    console.log('Sorry there is an error' + err);
  });

