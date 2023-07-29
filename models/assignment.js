const mongoose=require('mongoose');

const assignmentSchema=new mongoose.Schema({
    
    assignmentname:{
        type:String,
        required:true
    },
    assignmentdate:{
        type:Date,
        required:true
    },
    assignmentcourse:{
        type:String,
        required:true
    },
    

});

const Assignment=mongoose.model('Assignment',assignmentSchema);
module.exports=Assignment;