var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('../app')
const { resolve, reject } = require('promise')
const ObjectId=require('mongodb').ObjectId
const Razorpay=require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_kZe1ppdQ07dEoZ',
    key_secret: '6w5Jce7Cz6JUk3Zn9rcCFJH5'
  });
module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user =await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log('login success')
                        response.user=user
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
    addToCart:(prodId,userId)=>{
        let proObj={
            item:ObjectId(prodId),
            quantity:1
        }
       return new Promise(async(resolve,reject)=>{
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
        if(userCart){
            let proExist=userCart.products.findIndex(product=> product.item==prodId)
            if(proExist!=-1){
                await db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:ObjectId(userId),'products.item':ObjectId(prodId)},
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then(()=>{
                    resolve()
                })
            }else{
            await db.get().collection(collection.CART_COLLECTION)
            .updateOne({user:ObjectId(userId)},{
                $push:{products:proObj}
            }).then((response)=>{
                resolve({status:true})
            })
        }
        }else{
            let cartObj={
                user:ObjectId(userId),
                products:[proObj]
            }
            await db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                resolve({status:true})
            })
        }

       })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise (async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            console.log(cart)
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:ObjectId(details.cart)},
                {
                    $pull:{products:{item:ObjectId(details.product)}}
                }
                ).then((response)=>{
               
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:ObjectId(details.cart),'products.item':ObjectId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count}
                }
                ).then((response)=>{
               
                    resolve({status:true})
                })
            }
           
        })
    },
    deleteItem:(details)=>{
        return new Promise((resolve,reject)=>{
        db.get().collection(collection.CART_COLLECTION)
        .updateOne({_id:ObjectId(details.cart)},
        {
            $pull:{products:{item:ObjectId(details.product)}}
        }
        ).then((response)=>{
           resolve(true)
        })
    })
    },
    
    getTotalAmount:async(userId)=>{
        // let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(userId)} 
                },
                {
                    $unwind:'$products'
                }, 
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    } 
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity',{$toInt:'$product.Price'}]}}
                    }
                }
                
            ]).toArray()
            resolve(total[0].total)     
            
        }) 
    
    },
    placeOrder:(order,products,total)=>{
        
        return new Promise(async(resolve,reject)=>{
            let status=order['payment-method']==='COD'?'placed':'pending'
            let pending=status==='pending'?true:false
            let date=new Date()
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(order.userId)})
            date=date.toLocaleString()
            let ordrObj={
                deliveryDetails:{
                    mobile:order.Mobile,
                    address:order.Address,
                    pincode:order.Pincode,
                    username:user.Name
                },
                userId:ObjectId(order.userId),
                paymentMethod:order['payment-method'], 
                products:products,
                status:status,
                pending:pending,
                totalAmount:total,
                date:date
            }
            console.log(user)
            db.get().collection(collection.ORDER_COLLECTION).insertOne(ordrObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).removeOne({user:ObjectId(order.userId)})
               
                resolve(response.ops[0]._id)
                 
            })
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart =await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            resolve(cart.products)  
        })
    },
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:ObjectId(userId)}).toArray()
            resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,total:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                
            ]).toArray()
            resolve(orderItems)
        }) 
    },
    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                if(err){
                 resolve(err)
                }else{
                resolve(order) 
                }
              });
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto=require('crypto')
            let hmac=crypto.createHmac('sha256','6w5Jce7Cz6JUk3Zn9rcCFJH5')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)  
            .updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status:'placed',
                    pending:false
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    paymentDetailes:(payment)=>{
        db.get().collection(collection.PAYMENT_COLLECTION).insertOne(payment)
    },
    getPaymentDetailes:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let payment=await db.get().collection(collection.PAYMENT_COLLECTION).find({receipt:orderId}).toArray()
            resolve(payment)
        })
    },
    searchProduct:(key)=>{
        return new Promise(async(resolve,reject)=>{
            let products= await db.get().collection(collection.PRODUCT_COLLECTION).find({Name:{$regex:key,$options:'i'}}).toArray()
            resolve(products)
        })
    }
}