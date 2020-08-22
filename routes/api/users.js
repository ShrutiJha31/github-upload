 const express = require('express');
 const router=express.Router();
 const bcrypt=require('bcryptjs');
 const { check, validationResult } = require('express-validator')
const gravatar=require('gravatar');
const jwt=require('jsonwebtoken');
const config =require('config');
 const User= require('../../models/User');
//@route Get apiu/users
//@desc TEst route
//@access public
 router.post('/',[
    check('name','Name is Required').not().isEmpty() ,
    check('email','Please enter valid email').isEmail(),
    check('password','Please enter a proper password with 6 or more characters').isLength({min:6})
 ],
 async(req,res)=>{
     const errors =validationResult(req);
     if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});    //if errors send 400 which is code for bad request
     }


     const {name,email,password} = req.body;
try {
  //see if user exists
let user = await User.findOne({email});

if(user) {
    return res.status(400).json({errors:[{ msg:'User already exists.'}]});
}

     //get users gravator

const avatar=gravatar.url(email,{
    s:'200',
    r:'pg',
    d:'mm' //when user doesn't have a gravatar
})

user = new User({
    name,
    email,
    avatar,
    password
});


     //encrypt password
const salt =await bcrypt.genSalt(10);
user.password=await bcrypt.hash(password,salt);

await user.save();


     //return jwt

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


 module.exports = router;