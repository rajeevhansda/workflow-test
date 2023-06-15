console.log('hello');
require("dotenv").config();

if(process.env.KEY === 'mykey'){
    console.log('dotenv');

}else{
    console.log('no - dotenv');

}
console.log('--------END-------');