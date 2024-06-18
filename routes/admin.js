var express = require('express');
const { render } = require('../app');
var router = express.Router();
const session = require('express-session');
var productHelper=require('../helpers/product-helpers');
var adminHelper=require('../helpers/admin-helper')
/* GET users listing. */




verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }
  else{
    res.redirect('/admin-login')
  }
  }

 

router.get('/', function(req, res, next) {
  let admin=req.session.admin
  if(admin){
  productHelper.getAllProducts().then((products)=>{
    res.render('admin/view-product',{adminPanel:true,products,admin})
  }) 
  }else{
    res.render('admin/admin-login',{adminPanel:true})
  }
  });
  router.get('/admin-login',(req,res)=>{
    if(req.session.admin){
      res.redirect('/admin/')
    }else{
    res.render('admin/admin-login',{'loginErr':req.session.adminLoginErr,adminPanel:true}) 
    req.session.adminLoginErr=false
    }
  })
  router.post('/admin-login',(req,res)=>{
    adminHelper.doLogin(req.body).then((response)=>{
      if(response.status){
        req.session.admin=response.admin 
        req.session.adminLoggedIn=true
        res.redirect('/admin/')
      }else{
        req.session.adminLoginErr="Invalid Username or Password"
        res.redirect('/admin/admin-login')
      }
    })
  })
  router.get('/logout',(req,res)=>{ 
    req.session.admin=null
    req.session.adminLoggedIn=false
    res.redirect('/admin/admin-login')
  })
  router.get('/add-product',function(req,res){
    let admin=req.session.admin
    res.render('admin/add-product',{adminPanel:true,admin})
  })

  
  
  router.post('/add-product',(req,res)=>{

    productHelper.addProduct(req.body,(id)=>{
      let image=req.files.Image
      image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
        if(!err){
          res.render('admin/add-product',{adminPanel:true})
        } 
      })
      
    })
  })
router.get('/delete-product/:id',(req,res)=>{
  let prodId=req.params.id
  productHelper.deleteProduct(prodId).then((response)=>{
    res.redirect('/admin/')
  })
})
router.get('/edit-product/:id', async (req,res)=>{
  let product=await productHelper.getProductDetails(req.params.id)
    res.render('admin/edit-product',{product})
})
router.post('/edit-product/:id', (req,res)=>{
  let id=req.params.id
productHelper.updateProduct(req.params.id,req.body).then(()=>{
  res.redirect('/admin/')
  if(req.files.Image){
    let image=req.files.Image
    image.mv('./public/product-images/'+id+'.jpg')
      
  }
})
})

router.get('/all-orders',async(req,res)=>{
  let admin=req.session.admin
  let allOrders= await adminHelper.getAllOrders()
  res.render('admin/all-orders',{allOrders,adminPanel:true,admin})
})
router.post('/change-status',(req,res)=>{
  console.log(req.body.orderId)
  adminHelper.changeStatus(req.body.orderId).then((response)=>{
    res.json({status:true})
  })
})
router.get('/all-users',async(req,res)=>{
  let admin=req.session.admin
  let allUsers= await adminHelper.getAllUsers()
  console.log(allUsers)
  res.render('admin/all-users',{allUsers,adminPanel:true,admin})
})
module.exports = router;
