// EDIT THIS FILE to change business details, prices and cars.
var CONFIG={
  name:"Mafikeng Wheels Car Rental",
  whatsapp:"+27 67 316 3109",   // TODO: real number, format 27XXXXXXXXX
  phone:"+27 84 345 4872",  // TODO
  deliveryFee:100,          // TEMP: set 0 for no delivery fee
  deliveryAreas:"Mafikeng and Mmabatho",
  depositPct:0.3,           // TEMP: share of total paid online as the deposit
  longTermDays:30,longTermDiscount:0.1 // TEMP: long-term = 30+ days, 10% off
};
// TEMP prices: replace with the Daily_Rate values from the database.
var CATEGORIES=[
  {id:1,name:"Economy",desc:"Small, fuel-efficient and budget friendly. Great for students.",rate:350,icon:"🚗"},
  {id:2,name:"Standard",desc:"Comfortable everyday cars for work and family.",rate:550,icon:"🚙"},
  {id:3,name:"SUV",desc:"Extra space for trips to Sun City and Pilanesberg.",rate:850,icon:"🚐"},
  {id:4,name:"Luxury",desc:"Arrive in style for business and special occasions.",rate:1300,icon:"🏎️"}];
// status: Available, Rented or In Service. Optional photo: images/car-ID.jpg
var VEHICLES=[
  {id:1,make:"Toyota",model:"Starlet",year:2022,seats:5,status:"Available",cat:1},
  {id:2,make:"Suzuki",model:"Swift",year:2023,seats:5,status:"Available",cat:1},
  {id:3,make:"Toyota",model:"Corolla",year:2022,seats:5,status:"Available",cat:2},
  {id:4,make:"VW",model:"Polo Sedan",year:2021,seats:5,status:"Rented",cat:2},
  {id:5,make:"Toyota",model:"Fortuner",year:2022,seats:7,status:"Available",cat:3},
  {id:6,make:"Ford",model:"Everest",year:2021,seats:7,status:"In Service",cat:3,photo:"https://raw.githubusercontent.com/khensanelebohang/mafikeng-car-rentals/main/car-6.jpg"},
  {id:7,make:"BMW",model:"3 Series",year:2022,seats:5,status:"Available",cat:4}];
