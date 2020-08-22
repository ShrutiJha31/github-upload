const express =require('express');
const router=express.Router();
const {check,validationResult} = require('express-validator');
const auth = require('../../middleware/auth');

const Post=require('../../models/Posts');
const Profilet=require('../../models/Profile');
const User=require('../../models/User');
//@route Post api/posts
//@desc create a post 
//@access private
router.post('/',[auth,[
    check('text','Text is required').not().isEmpty()
]],
async (req,res)=>{
         const errors = validationResult(req);
         if(!errors.isEmpty()) {
             return res.status(400).json({errors:errors.array()});
         }
         try {
                 const user=await User.findById(req.user.id).select('-password');
        const newPost= new Post({
            text:req.body.text,
            name:user.name,
            avatar:user.avatar,
            user:req.user.id
        });
        const post=await newPost.save();
        res.json(post);
         } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');l 
         }
    
});


// @route  Get api/posts
//@desc  Get all posts
//@access Private

router.get('/',auth,async (req,res)=>{
  try {
      const posts= await Post.find().sort({date:-1}); 
      res.json(posts);
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
  } 
});
// @route  Get api/posts/:id
//@desc  Get post by th eid of the post
//@access Private

router.get('/:id',auth,async (req,res)=>{
    try {
        const post= await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json({msg:'POST NOT FOUND'});
        } 
        res.json(post);
    } catch (err) {
        console.error(err.message); 
        if(err.kind === 'ObjectId') {
            return res.status(404).json({msg:'POST NOT FOUND'});
        } 
        res.status(500).send('Server Error');
    } 
  });

// @route  Delete api/posts/:id
//@desc  delete post by the id of the post
//@access Private

router.delete('/:id',auth,async (req,res)=>{
    try {
        const post= await Post.findById(req.params.id);
        // we need to check that the person who is deletig the post is the person who owns the post
        if(post.user.toString() !==req.user.id) {
         return res.status(401).json({msg:'Only the one who created it is allowed to delete it :)'});
        }
        await post.remove();
        res.json({msg:'Post removed!'});
    } catch (err) {
        console.error(err.message); 
        if(err.kind === 'ObjectId') {
            return res.status(404).json({msg:'POST NOT FOUND'});
        } 
        res.status(500).send('Server Error');
    } 
  });


  // @route  put api/posts/like/:id
//@desc  like a post by the id of the post
//@access Private

router.put('/like/:id',auth,async (req,res)=>{
    try {
        const post= await Post.findById(req.params.id);
       //check if post has already been liked by the user
        if(post.likes.filter(like=>like.user.toString()===req.user.id).length>0){
              return res.status(400).json({msg:'Post Already Liked'});
        }   

        post.likes.unshift({user:req.user.id});
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message); 
          /*  if(err.kind === 'ObjectId') {
            return res.status(404).json({msg:'POST NOT FOUND'});
        } */
        res.status(500).send('Server Error');
    } 
  });
  
  // @route  put api/posts/unlike/:id
//@desc  unlike a post by the id of the post
//@access Private
//unlike is not a feature we support, its can only be used to remove your like
router.put('/unlike/:id',auth,async (req,res)=>{
    try {
        const post= await Post.findById(req.params.id);
       //check if post has not been liked by the user
        if(post.likes.filter(like=>like.user.toString()===req.user.id).length===0){
              return res.status(400).json({msg:'You have not liked the post yet'});
        }   

       const removeIndex =post.likes
       .map(like=>like.user.toString())
       .indexOf(req.user.id);
       post.likes.splice(removeIndex,1);
       await post.save();
       res.json(post.likes);
    } catch (err) {
        console.error(err.message); 
          /*  if(err.kind === 'ObjectId') {
            return res.status(404).json({msg:'POST NOT FOUND'});
        } */
        res.status(500).send('Server Error');
    } 
  });


  //@route Post api/posts/comment/:id
//@desc comment on a post
//@access private
router.post('/comment/:id',[auth,[
    check('text','Text is required').not().isEmpty()
]],
async (req,res)=>{
         const errors = validationResult(req);
         if(!errors.isEmpty()) {
             return res.status(400).json({errors:errors.array()});
         }
         try {
                 const user=await User.findById(req.user.id).select('-password');
                 const post=await Post.findById(req.params.id);
        const newComment= ({
            text:req.body.text,
            name:user.name,
            avatar:user.avatar,
            user:req.user.id
        });
        post.comments.unshift(newComment);
      await post.save();
        res.json(post.comments);
         } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
         }
    
});


  //@route Post api/posts/comment/:id/:comment_id
//@desc delete comment on a post
//@access private
router.delete('/comment/:id/:comment_id', auth,
async (req,res)=>{
  
         try {
               
          const post=await Post.findById(req.params.id);

          const comment = post.comments.find(comment=>comment.id==req.params.comment_id);
          if(!comment){
              return res.status(404).json({msg:'Comment not found'});
          }

          //check user
          if(comment.user.toString()!==req.user.id) {
            return res.status(401).json({msg:'You are not authorized to delete this comment'});
          }
          const removeIndex =post.comments
          .map(comment=>comment.user.toString())
          .indexOf(req.user.id);
          post.comments.splice(removeIndex,1);
          await post.save();
          res.json(post.comments);


         } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
         }
    
});

module.exports=router;