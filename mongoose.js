var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/adserver');


var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var SmallCamp = new Schema({
  campId : ObjectId,
  campName : String
});

mongoose.model('SmallCamp',SmallCamp);

var User = new Schema({
  name : String,
  created : Date,
  login : String,
  Password : String,
  campaigns : [SmallCamp]
});

mongoose.model('User',User);

var Client = new Schema({
  name: String,
  details : {},
  campaigns : [SmallCamp]
});

mongoose.model('Client',Client);

var Agency = new Schema({
  name : String,
  clients : [Client]
});

mongoose.model('Agency',Agency);

var Creative = new Schema({
  name : String,
  destination : String,
  html : String,
  width : Number,
  height : Number,
  message : String,
  file : String
});

mongoose.model('Creative',Creative);

var Schedule = new Schema({
  publisher : String,
  site : String,
  'location' : String,
  width : Number,
  height : Number,
  start : Date,
  end : Date,
  comment : String,
  targeting : String,
  buyType : String,
  goal : Number,
  price : Number
});

mongoose.model('Schedule',Schedule);


var Rotation = new Schema({
  type : String,
  info : {type:String},
  width : Number,
  height : Number,
  creative : {cid:String,name:String,message:String},
  lineitem : {lid:String,target:String}
});

mongoose.model('Rotation',Rotation);


var Campaign = new Schema({
  name : String,
  schedule : [Schedule],
  creative : [Creative],
  rotation : [Rotation]
});

mongoose.model('Campaign',Campaign);

function setClient(obj,fn){
  var client = new Client();
  for(i in obj){
    if(obj[i] instanceof Array)
      client[i] = obj[i].slice(0);
    else  
      client[i] = obj[i];
  }
}

function createCampaign(name,fn){
  var A = mongoose.model('Campaign');
  var campaign = new A();
  campaign.name = name;
  var B = mongoose.model('SmallCamp');
  var smallCamp = new B();
  smallCamp.name = name;
  campaign.save(function(err){if(!err)smallCamp.save(function(err1){if(!err1)fn();});});
}



createCampaign("test campaign 1",function(){var myModel = mongoose.model('Campaign'); myModel.find({},function(err,docs){console.log(docs)});});
