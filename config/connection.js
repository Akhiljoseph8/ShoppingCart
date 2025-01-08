const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=function(done){
    const url='mongodb+srv://akhil:akhil@cluster0.kzna9t8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    const dbname='shopping'
   
    mongoClient.connect(url,{ useUnifiedTopology: true },(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)  
           done()
    })

}
module.exports.get=function(){ 
    return state.db
}

// mongodb+srv://akhil:akhil@cluster0.kzna9t8.mongodb.net/SHOPPINGCART?retryWrites=true&w=majority&appName=Cluster0