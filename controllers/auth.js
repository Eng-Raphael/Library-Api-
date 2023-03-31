const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const crypto = require('crypto');
const path = require('path')

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public

exports.register = asyncHandler(async (req , res,next) =>{

    const {firstname,lastname,email,password} = req.body;
    //create User
    const user = await User.create({
        firstname,
        lastname,
        email,
        password
    })

    sendTokenResponse(user , 200 , res)

})

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req,res,next) => {
    const {email , password} = req.body
    if(!email || !password){
        return next(new ErrorResponse('Please provide an email and password', 400))
    }
    const user = await User.findOne({email}).select('+password')
    if(!user){
        return next(new ErrorResponse('Invalid credentials', 401))
    }

    const isMatch = await user.matchPassword(password)

    if(!isMatch){
        return next(new ErrorResponse('Invalid credentials', 401));
    }
    sendTokenResponse(user , 200 , res)
})

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Public
exports.logout = asyncHandler(async (req,res,next) => {
    res.cookie('token' ,'none',{
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    })
    res.status(200).json({
        success: true,
        data: {},
    });
})

// @desc      Get current logged in user
// @route     GET /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req,res,next) => {
    const user = await User.findById(req.user.id)
    res.status(200).json({
        success: true,
        data: user,
      });
})

// @desc      Update user details
// @route     PUT /api/v1/auth/updatedetails
// @access    Private
exports.updateDetails = asyncHandler(async (req,res,next) => {
    const fieldsToUpdate ={
        name:req.body.name ,
        email:req.body.email
    }
    const user =  await User.findByIdAndUpdate(req.user.id , fieldsToUpdate ,{
        new:true,
        runValidators:true
    })
    res.status(200).json({
        success: true,
        data: user,
    });
})

// @desc      Update password
// @route     PUT /api/v1/auth/updatepassword
// @access    Private
exports.updatePassword = asyncHandler(async (req,res,next) =>{
    const user = await User.findById(req.user.id).select('+password')
    if(!await user.matchPassword(req.body.currentPassword)){
        return next(new ErrorResponse('Password is incorrect', 401));
    }
    user.password = req.body.newPassword
    await user.save()

    sendTokenResponse(user, 200, res);
})

//@desc     Upload photo for bootcamp
//@route    PUT /api/v1/auth/:id/photo
//@access   Private
exports.userPhotoUpload = asyncHandler(async (req,res,next) =>{
    
    const user = await User.findById(req.params.id)

    if(!user){
        return next(new ErrorResponse(`User not found with id : ${req.params.id}`,404));
    }

    if(!req.files){
        return next(new ErrorResponse(`Please upload a file`,404))
    }

    const file = req.files.file
    // Make sure image is a photo
    if(!file.mimetype.startsWith('image')){
        return next(new ErrorResponse(`Please upload an image file`,404))
    }

    //check file size
    if(file.size > process.env.MAX_FILE_UPLOAD){
        return next(new ErrorResponse(`Please upload image file lass than ${process.env.MAX_FILE_UPLOAD}`,404))
    }

    //Create custom file name 
    file.name = `photo_${user._id}${path.parse(file.name).ext}`
    
    //move file to folder 
    file.mv(`${process.env.FILE_UPLOAD_PATH}/users/${file.name}`, async err => {
        if(err){
          console.error(err)
          return next(new ErrorResponse(`Error while file upload`,500))  
        }
        await User.findByIdAndUpdate(req.params.id,{photo : file.name})
        res.status(200).json({success:true , data:file.name})
    })

})

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Public
exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
  
    res.status(200).json({
      success: true,
      data: {},
    });
  });

// Get token from model , create cookie and send response 
const sendTokenResponse = (user , statuscode , res) =>{
    const token = user.getSignedJwtToken();
    const options = {
        expires : new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 *60 * 1000) ,
        httpOnly: true
    }

    if(process.env.NODE_ENV === 'production'){
        options.secure = true
    }
    res
        .status(statuscode)
        .cookie('token',token,options)
        .json({
            success:true,
            token
        })
}