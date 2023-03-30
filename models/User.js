const mongoose = require('mongoose')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');


const UserSchema = new mongoose.Schema({
    
    firstname:{
        type:String,
        required:[true , 'Please add Your firstname']
    },
    lastname:{
        type:String,
        required:[true , 'Please add Your lastname']
    },
    username:{
        type:String
    },
    email:{
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please add a valid email',
        ]
    },
    password:{
        type: String,
        required: [true, 'Please add a password'],
        minlength: 8,
        select: false
    },
    photo:{
        type: String,
        default: 'no-photo.jpg'
    },
    role:{
        type:[String],
        required:true,
        default:'user',
        enum:[
            'user',
            'admin'
        ]
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
})

UserSchema.pre('save' , async function(next){
    this.username = (this.firstname +"_"+ this.lastname).toLowerCase()
    if(!this.isModified('password')){
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password , salt);
})

UserSchema.method.getSignedJwtToken = function (){
    return jwt.sign({id:this._id} , process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRE
    })
}

UserSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword , this.password)
}


module.exports = mongoose.model('User',UserSchema)