var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const Promise=require('promise')
const ObjectId=require('mongodb').ObjectId
module.exports={
doLogin:(adminData)=>{
    return new Promise(async(resolve,reject)=>{
        let loginStatus=false
        let response={}
        let admin =await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
        if(admin){
            bcrypt.compare(adminData.Password,admin.Password).then((status)=>{
                if(status){
                    console.log('login success')  
                    response.admin=admin
                    response.status=true 
                    resolve(response)
                }else{
                    console.log('login failed')
                    resolve({status:false})
                }
            })
        }else{
            console.log('login failed')
            resolve({status:false})
        }
    })
},
getAllOrders:()=>{
    return new Promise(async(resolve,reject)=>{
        let orders= await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
       resolve(orders)
    })
},
changeStatus:(orderId)=>{
    console.log(orderId)
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION)
        .updateOne({_id:ObjectId(orderId)},
        {
            $set:{
                status:'shipped',
                shipped:true
            }
        }
        ).then(()=>{
            resolve({status:true}) 
        })
    })
},
getAllUsers:()=>{
    return new Promise(async(resolve,reject)=>{
        let users= await db.get().collection(collection.USER_COLLECTION).find().toArray()
       resolve(users)
    })
}
}