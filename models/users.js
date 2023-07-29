
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  
  // assignments: [
  //   {
  //     assignmentname: String,
  //     dueDate: Date,
  //     course: String,
     
  //   }
  // ],
  assignments: [
    {
      assignmentname: String,
      dueDate: Date,
      course: String,
      // Existing assignment fields...
      // Add the attachment field to store attachments
      attachments: [
        {
          filename: String,
          path: String, // Path to  the uploaded file on the server
          mimetype: String, // MIME type of the file
        },
      ],
    },
  ],
  expenses: [
    {
      date: Date,
      amount: Number,
      category: String, 
      
    }
  ],
  monthlyBudget: {
    type: Number,
    default: 0
  },
  
});

module.exports = mongoose.model('User', userSchema);

