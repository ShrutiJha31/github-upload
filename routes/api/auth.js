const express =require('express');
 const router=express.Router();
const auth=require('../../middleware/auth');
const User = require('../../models/User')
const jwt=require('jsonwebtoken');
const config =require('config');
const bcrypt=require('bcryptjs');
const { check, validationResult } = require('express-validator')
//@route Get apiu/auth
//@desc TEst route
//@access public
 router.get('/',auth,async(req,res)=>{
  try{
const user= await User.findById(req.user.id).select('-password');
res.json(user);

  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
 });

 //@route Get apiu/auth
//@desc TEst route
//@access public
router.post('/',[
  
  check('email','Please enter valid email').isEmail(),
  check('password','Password Required').exists()
],
async(req,res)=>{
   const errors =validationResult(req);
   if(!errors.isEmpty()){
          return res.status(400).json({errors:errors.array()});    //if errors send 400 which is code for bad request
   }


   const {email,password} = req.body;
try {
//see if user exists
let user = await User.findOne({email});
//to check if he is a user
if(!user) {
   return res.status(400).json({errors:[{ msg:'Invalid email or password.'}]});
}
   //checking the password
   const isMatch= await bcrypt.compare(password,user.password);
                                                //encrypted password
   
    if(!isMatch) {
      return res.status(400).json({errors:[{ msg:'Invalid email or password.'}]});
    }                                            
   const payload = {
       user: {
           id:user.id
       }
   }
 jwt.sign(payload,config.get('jwtToken'),{expiresIn:360000},(err,token)=> {
     if(err) throw err;
     res.json({token});
 

 });


}catch(err){

 console.error(err,messsage);
 res.status(500,send('Server error'));

}
   

 
});

  

 module.exports=router;