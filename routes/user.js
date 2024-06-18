var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers');
const userHelper = require('../helpers/user-helpers');
const session = require('express-session');


var noProduct=false
var key=null
verifyLogin=(req,res,next)=>{
if(req.session.userLoggedIn){ 
  next()
}
else{
  res.redirect('/login')
}
}
/* GET home page. */

router.get('/', async function(req, res, next) {
  req.params.key=null
  let user=req.session.user
  let cartCount=null
  if(user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
  }
  productHelper.getAllProducts().then((products)=>{ 
  noProduct=false
    res.render('user/view-product',{products,user,cartCount,noProduct})
  }) 

});
router.get('/login',(req,res)=>{
  if(req.session.user){
    user=req.session.user
    res.redirect('/')
  }else{
  res.render('user/login',{'loginErr':req.session.userLoginErr}) 
  req.session.userLoginErr=false
  }
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
  userHelper.doSignup(req.body).then((response)=>{
    req.session.user=response
    req.session.userLoggedIn=true
     
    res.redirect('/')
  })
}) 
router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.user=response.user
      req.session.userLoggedIn=true
      res.redirect('/')
    }else{
      req.session.userLoginErr="Invalid Username or Password"
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')
})
router.get('/cart',verifyLogin,async(req,res)=>{
  let products=await userHelper.getCartProducts(req.session.user._id)
  let totalValue=0
  if(products.length>0){
   totalValue=await userHelper.getTotalAmount(req.session.user._id)
   res.render('user/cart',{products,userId:req.session.user._id,totalValue,user:req.session.user})
  }else{
    res.redirect('/')

  }
 
})
router.get('/add-to-cart/:id',verifyLogin,async(req,res)=>{
  userHelper.addToCart(req.params.id,req.session.user._id).then((response)=>{ 
    if(response){
    res.json({status:true})
    }
  })

})  
router.post('/change-product-quantity',async(req,res,next)=>{ 
  console.log(req.body) 
  let products=await userHelper.getCartProducts(req.body.user)
  userHelper.changeProductQuantity(req.body).then(async(response)=>{
   if(response.status){
    response.total=await userHelper.getTotalAmount(req.body.user)
   }
    if(products[0].product.length>0){
    response.total=await userHelper.getTotalAmount(req.body.user) 
    
    }else if(products[0].product.length<=0){
      response.total=0 
    }
    res.json(response)
  }) 
})
router.post('/delete-cart-item',(req,res,next)=>{
  userHelper.deleteItem(req.body).then((response)=>{
    res.json(response)
  })
})
router.get('/place-order',verifyLogin, async(req,res)=>{
  let products=await userHelper.getCartProducts(req.session.user._id)
  let total=0
  if(products.length>0){
  total=await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,userId:req.session.user._id,user:req.session.user})  
  }else{
    res.redirect('/')

  }
})
router.post('/place-order', verifyLogin,async(req,res)=>{
  let products=await userHelper.getCartProductList(req.body.userId) 
  let product=await userHelper.getCartProducts(req.body.userId)
  let totalPrice=0
  if(product.length>0){
  totalPrice=await userHelper.getTotalAmount(req.body.userId)
  }
  userHelper.placeOrder(req.body,products,totalPrice).then((orderId)=>{ 
    if(req.body['payment-method']==='COD'){ 
      res.json({codSuccess:true}) 
    }else{ 
      userHelper.generateRazorpay(orderId,totalPrice).then((response)=>{
        if(response.id){   
        userHelper.paymentDetailes(response)
        }
        res.json(response)
      })
    }
    
  }) 
})
router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user}) 
})
router.get('/orders',verifyLogin,async(req,res)=>{
  let orders=await userHelper.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders}) 
}) 
router.get('/view-order-products/:id',async(req,res)=>{
   let products=await userHelper.getOrderProducts(req.params.id) 
  res.render('user/view-order-products',{user:req.session.user,products}) 
})
router.post('/verify-payment',(req,res)=>{
  console.log('suceess')
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{ 
      
      res.json({status:true})
    })
  }).catch((err)=>{
    res.json({status:false})  
  })
})
router.post('/payment',async(req,res)=>{   

  userHelper.getPaymentDetailes(req.body.orderId).then((response)=>{
    if(response.length>0){
    res.json(response[0])
    }else{
      userHelper.generateRazorpay(req.body.orderId,req.body.total).then((response)=>{
     
        if(response.id){   
        userHelper.paymentDetailes(response)
        }
        res.json(response)
      })
    }
    
  })
     
})
router.get('/product-search/:key',async(req,res)=>{
  let user=req.session.user
  let cartCount=null
  if(key==req.params.key){
    req.params.key=null
  }
  key=req.params.key
  if(user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
  }
  if(req.params.key){
  userHelper.searchProduct(req.params.key).then((products)=>{
    noProduct=false
    if(products.length<1){

   
        noProduct=true
      
      productHelper.getAllProducts().then((products)=>{ 
        res.render('user/view-product',{products,user,cartCount,key,noProduct})
      }) 
    }else{
      
    res.render('user/view-product',{products,user,cartCount,key,noProduct})
    }
  })
}else{
  res.redirect('/')
}
})
module.exports = router; 
