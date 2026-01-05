const mongoose = require("mongoose");
const connectDB=async()=>{
 await mongoose.connect(
        'mongodb+srv://admin:admin@cluster0.youx8ve.mongodb.net/Expense-Backend'
    )
}
module.exports=connectDB;