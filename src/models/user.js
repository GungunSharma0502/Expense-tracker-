const mongoose=require('mongoose');
const jwt=require("jsonwebtoken");
const validator=require('validator');
const userSchema=new mongoose.Schema({
     firstName:{
        type:String,
        required:true,
        minlength:3,
        maxlength:30,
        index:true
    },
    lastName:{
        type:String,
    },
    emailId: {
        type:String,
            lowercase:true,
         required:true,
         unique:true,
         trim:true,
         validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Email is not valid"+value);
            }

         }
     
    },
    password:{
        type:String,
         required:true,
    }
},{timestamps:true});
userSchema.methods.getJWT=async function(){
    const user=this;
    const token=jwt.sign({_id:user._id},"Gungun@Sharma$790",{expiresIn:"1d"});
    return token;
}
module.exports=mongoose.model("User",userSchema);