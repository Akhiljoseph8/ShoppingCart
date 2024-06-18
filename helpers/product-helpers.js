var db=require('../config/connection')
var collection=require('../config/collections')
const collections = require('../config/collections')
const Promise=require('promise')
const { response } = require('../app')
const ObjectId=require('mongodb').ObjectId
module.exports={
    addProduct:(product,callback)=>{
        db.get().collection('product').insertOne(product).then((data)=>{
            callback(data.ops[0]._id)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let product = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:ObjectId(prodId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
           db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(prodId)}).then((product)=>{
            resolve(product)
           })
        })
    },
    updateProduct:(prodId,prodDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:ObjectId(prodId)},{
                $set:{
                    Name:prodDetails.Name,
                    Category:prodDetails.Category,
                    Price:prodDetails.Price,
                    Description:prodDetails.Description
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
}