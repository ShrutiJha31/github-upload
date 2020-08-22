const express =require('express');
const request = require('request');
const config= require('config');
 const router=express.Router();
 const {check, validationResult }= require('express-validator');
 const auth=require('../../middleware/auth');
const Profile =require('../../models/Profile');
const User=require('../../models/User');

//@route Get api/profile/me  
//@desc get my profile
//@access private
 router.get('/me' ,auth
 ,async(req,res)=>{
        try{
          const profile =await Profile.findOne({user: req.user.id}).populate('user',['name','avatar']); 
          if(!profile) {
              return res.status(400).json({msg:'There is no profile for this user'});
          } 
          res.json(profile);  
       
        }catch(err) {
            console.error(err.message);
            res.status(500).send('Server Error'); 
        }

       

 });
 //@route Post api/profile/me  
//@desc create or update user profile
//@access private
router.post('/',[auth,[check('status','Status is requird')
.not()
.isEmpty(),
check('skills','Skills is required')
.not()
.isEmpty()

]],
   async (req,res)=>{
   const errors= validationResult(req);
   if(!errors.isEmpty())
   {
       return res.status(400).json({errors:errors.array()});
   }   
   const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin
} = req.body;

//Build profile object

const profileFields = {};
profileFields.user = req.user.id;
  if(company) profileFields.company=company;
  if(website) profileFields.website=website;
  if(location) profileFields.location=location;
  if(bio) profileFields.bio=bio;
  if(status) profileFields.status=status;
  if(githubusername) profileFields.githubusername=githubusername;
  if(skills){
   
       profileFields.skills=skills.split(',').map(skill =>skill.trim())
  }
  //Build social object
   profileFields.social =   {}
   if(twitter) profileFields.social.twitter=twitter;
   if(youtube) profileFields.social.youtube=youtube;
   if(facebook) profileFields.social.facebook=facebook;
   if(linkedin) profileFields.social.linkedin=linkedin;
   if(instagram) profileFields.social.instagram=instagram;
 
    try {
        let profile = await Profile.findOne({user:req.user.id});
        if(profile)
        {
          profile=await Profile.findOneAndUpdate({user:req.user.id},{$set:profileFields},{new:true});
          return res.json(profile);
       
        }
        
        //create-if profile not found we will create it 
        profile = new Profile(profileFields);

        await profile.save();
        return res.json(profile);
      }catch(err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
}); 

//@route Get api/profile  
//@desc get all profiles
//@access public

router.get('/', async (req,res) => {
  try{
       const profiles   = await Profile.find().populate('user',['name','avatar']);
       res.json(profiles);
  }catch(err){
    
    console.error(err.message);
    
    res.status(500).send('Server Error');
  }
});



//authorization of profiles

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
/*router.get(
  '/user/:user_id',
  
  async ({ params: { user_id } }, res) => {
    try {
      const profile = await Profile.findOne({
        user: user_id
      }).populate('user', ['name', 'avatar']);

      if (!profile) return res.status(400).json({ msg: 'Profile not found' });

      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ msg: 'Server error' });
    }
  }               
);*/



// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']);

    if (!profile) return res.status(400).json({ msg: 'Profile not found' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
});
//@route Delete api/profile  
//@desc delete the profile, user &post
//@access private
router.delete('/', auth,async (req,res) => {
  try{
     await Profile.findOneAndRemove({user : req.user.id});// removing profile 
     await User.findOneAndRemove({_id: req.user.id});// removing user

       res.json({msg:'User removed'});
  }catch(err){
    
    console.error(err.message);
    
    res.status(500).send('Server Error');
  }
});
//@route PUT api/profile/experience
//@desc ADD profile experience
//@access private

router.put('/experience',[auth, [
  check('title','title is required').not().isEmpty(),
  check('company','company is required').not().isEmpty(),
  check('from','From date is required').not().isEmpty(),
]], async(req,res)=>{
     const errors= await validationResult(req);
     if(!errors.isEmpty()) {
      return res.status(400).json({errors:errors.array()});
     }
     const {
       title,
       company,
       location,
       from,
       to,
       current,
       description
     } = req.body;
    
     
     const newExp = {
       title,
       company,
       location,
       from,
       to,
       current,
       description


     } 


     try {
       const profile = await Profile.findOne({user:req.user.id});
       if(profile!==null)
       {
       profile.experience.push(newExp);
      
       await profile.save();

       res.json(profile);
           } }catch (err) {
       console.error(err.message);
       res.status(500).send('Server Error');
     }
});
//@route Get api/profile/github/:username
//@desc Get user repos from github
//@access Public


router.get('./github/:username', (req,res) =>{
  try {
       const options = {
         uri:`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc,client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
         method: 'GET',
         headers: {'user-agent':'node.js'} //taking only nodejs projects
       };

      request(options,(error,response,body)=>{
         if(error) console.error(error);


         if(response.statusCode!==200){
           return res.status(400).json({msg:'No github profile found'});
         }
         res.json(JSON.parsebody)
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

 module.exports=router;