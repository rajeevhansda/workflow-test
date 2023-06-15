console.log('hello');
const fs = require('fs'); 
require("dotenv").config();

const apiKey = process.env.API_KEY;

 

 

if(apiKey === 'mykey'){
    console.log('dotenv');
    fs.appendFile('example.txt', 'FOUND DOTENV.', (err) => { 
        if (err) throw err; 
        console.log('The text was appended to the file!'); 
      }); 

}else{
    console.log('no - dotenv');
    fs.appendFile('example.txt', 'MISSING DOTENV.', (err) => { 
        if (err) throw err; 
        console.log('The text was appended to the file!'); 
      }); 

}


console.log('---------END---------');