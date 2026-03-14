const mongoose = require("mongoose");

mongoose.connect("mongodb://sarvampatel456_db_user:CoreTech7704@ac-y2wwf6w-shard-00-00.fveolfy.mongodb.net:27017,ac-y2wwf6w-shard-00-01.fveolfy.mongodb.net:27017,ac-y2wwf6w-shard-00-02.fveolfy.mongodb.net:27017/?ssl=true&replicaSet=atlas-cxqtib-shard-0&authSource=admin&appName=blog-cluster")
.then(()=>console.log("Connected"))
.catch(err=>console.log(err));