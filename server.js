
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
  }
  const fs = require('fs');
  const express = require('express')
  const app = express()
  const bcrypt = require('bcrypt')
  const passport = require('passport')
  const flash = require('express-flash')
  const session = require('express-session')
  const methodOverride = require('method-override')
  const User = require('./models/users')
   const mongoose = require('mongoose');
  const initializePassport = require('./passport-config')
  initializePassport(
    passport,
    email => User.findOne({email: email}),
    id => User.findById(id)
  )
  const dayjs = require('dayjs');
  const bodyParser = require('body-parser');
  const multer=require('multer');
  const gridfs=require('gridfs-stream');
  //const upload = multer({ dest: 'documents/' });
  //
  const { google } = require('googleapis');
  const axios = require('axios');
const {OAuth2} = google.auth;
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
)
const SCOPES = ['https://www.googleapis.com/auth/calendar.events',
'https://www.googleapis.com/auth/calendar.calendarlist',
];



let accessToken;
let refreshToken;






  
// app.get('/schedule_event',async(req,res)=>{
//   await calendar.events.insert({
//     calendarId: 'primary',
//     auth: oauth2Client,
//     requestBody:{
//       summary:assignmentname,
//       description:'this is a test description',
//       start:{
//         dateTime: dueDate.toISOString(),
//         timeZone:'Asia/Kolkata'
//       },
//       end:{
//         dateTime:dueDate.toISOString(),
//         timeZone:'Asia/Kolkata'
//       },
//     }

//   })

//   res.send({
//     msg:' i am success'
//   });
// })




// const oauth2Client = new OAuth2(
//   '270435967336-6qmohepdspe51c32pra7ogfebs4lrnmu.apps.googleusercontent.com',
//   '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',
//   'http://localhost:3000/google'
//   // '853659705276-q9fco93vjg4suvf6usn9sol0t0upornp.apps.googleusercontent.com',
//   //   'CqGl494eryOUsMfgzTpFgDC1',
//   //   'http://localhost:3000/google'
// );
// // Set the access and refresh tokens

// // Generate the URL for user authorization

// const auth = new google.auth.GoogleAuth({
//   keyFile: 'token.json',
//   scopes: ['https://www.googleapis.com/auth/calendar'],
// });

// oauth2Client.setCredentials(
//   {
//     access_token: 'token.json',
//   }
// );

  app.set('view-engine', 'ejs')
  app.use(express.urlencoded({ extended: false }))
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(flash())
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }))
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(methodOverride('_method'))
  app.use('/uploads', express.static('uploads'));
  app.get('/', checkAuthenticated, (req, res) => {
    res.render('home.ejs', { name: req.user.name })
  })
  app.get('/google', (req, res) => {
    const url =oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      version: 'v3',
    })
    res.redirect(url)
})

// app.get('/google/redirect', async (req, res) => {
//   const code = req.query.code;

//   try {
//     const response = await axios.post("https://oauth2.googleapis.com/token", {
//       code: code,
//       client_id: process.env.CLIENT_ID,
//       client_secret: process.env.CLIENT_SECRET,
//       redirect_uri: process.env.REDIRECT_URL,
//       grant_type: "authorization_code",
//     });
//       console.log(response.data);
//     // Store the access token and refresh token in your session or database
//     accessToken = response.data.access_token;
//      refreshToken = response.data.refresh_token;
// console.log(accessToken);
// console.log(refreshToken);
//     // Perform further operations with the tokens (e.g., save them in the database)

//     res.send({ msg: 'Authentication successful' });
//   } catch (error) {
//     console.error('Failed to get access token:', error);
//     res.status(500).send('Failed to get access token');
//   }
// });
// const mongoose = require('mongoose');

// ... (previous code)

app.get('/google/redirect', async (req, res) => {
  const { code } = req.query;
  try {
    // Exchange the authorization code for an access token and refresh token
    const { tokens } = await oauth2Client.getToken(code);
    console.log(tokens);
    // Store the access token and refresh token in the user's document
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    user.googleAccessToken = tokens.access_token;
    user.googleRefreshToken = tokens.refresh_token;
    await user.save();

    // Redirect the user to the desired page (e.g., the homepage or a "welcome" page)
    res.redirect('/');
    res.send({ msg: 'Authentication successful' });
  } catch (error) {
    console.error('Error occurred during OAuth2 callback:', error);
    res.status(500).send('Error occurred during OAuth2 callback');
  }
});

  app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
  })
  
  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }))
  
  app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
  })
  
  app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword
                });
                await user.save();
                console.log(user);
                res.redirect('/login');
      
    } catch(error){
        console.log(error);
      res.redirect('/register')
    }
  })
  
  app.delete('/logout', (req, res) => {
    //req.logOut()
    res.redirect('/login')
  })
  
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/login')
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/')
    }
    next()
  }
// ... (previous code)

app.get('/createassignment', checkAuthenticated, (req, res) => {
    res.render('createassignment.ejs');
  });
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix);
    }
  });
  
  const upload = multer({ storage: storage });

  app.post('/createassignment', checkAuthenticated, (req, res) => {
  //   oauth2Client.setCredentials({
  //     access_token: accessToken,
  //     refresh_token: refreshToken,
  //   });
  //   const calendar = google.calendar({ 
  //     version: 'v3', 
  //     auth: oauth2Client,
  //   });
    const { assignmentname, dueDate, course } = req.body;
  const attachmentFile = req.file;

    // Create a new assignment object
    const newAssignment = {
      assignmentname,
      dueDate,
      course,
      file:req.file?req.file.filename: null 
    };
  
    // Find the user by ID
    User.findById(req.user._id)
      .then(user => {
        if (!user) {
          return res.status(404).send('User not found');
        }
  
        // Add the new assignment to the user's assignments array
        user.assignments.push(newAssignment);
  
        // Save the user document
        return user.save();
      })
      
        .then(savedUser => {
          console.log('Assignment created:', savedUser);
    
          // After saving the assignment to the user, add it to Google Calendar
          // addAssignmentToGoogleCalendar(savedUser.googleAccessToken, newAssignment)
          //   .then(() => {
          //     res.redirect('/profile');
          //   })
            // .catch(error => {
            //   console.error('Error occurred while adding assignment to Google Calendar:', error);
            //   res.redirect('/profile');
            // });
            res.redirect('/profile');
        })
        .catch(error => {
          console.error('Error occurred:', error);
          res.status(500).send('Error occurred while creating assignment or event');
        });
    });
    
    // Function to add the assignment to Google Calendar
    async function addAssignmentToGoogleCalendar(email, assignment) {
      const oAuth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URL
      );
    
      oAuth2Client.setCredentials({
        access_token: 'USER_ACCESS_TOKEN',
        refresh_token: 'USER_REFRESH_TOKEN',
      });
    
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    
      const event = {
        summary:assignment.assignmentname,
        description: 'This is a test description',
        start: {
          dateTime: assignment.dueDate, // Should be in the format: '2023-07-31T12:00:00Z'
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: assignment.dueDate, // You can adjust the end time if needed
          timeZone: 'Asia/Kolkata',
        },
      };
    
      // Insert the event into the user's calendar
      return calendar.events.insert({
        auth: oAuth2Client,
        calendarId: 'primary',
        resource: event,
      });
    }
    app.post('/uploadAssignment', checkAuthenticated, upload.single('attachment'), (req, res) => {
      // Now, you can access the uploaded file details using req.file
      const { assignmentname, dueDate, course } = req.body;
      const attachmentFile = req.file;
    
      // Create a new assignment object with the attachment details
      const newAssignment = {
        assignmentname,
        dueDate,
        course,
        attachments: [
          {
            filename: attachmentFile.filename,
            path: attachmentFile.path,
            mimetype: attachmentFile.mimetype,
          },
        ],
      };
    
      // Find the user by ID and save the new assignment with attachment
      // to the user's assignments array
      User.findById(req.user._id)
        .then(user => {
          if (!user) {
            return res.status(404).send('User not found');
          }
    
          user.assignments.push(newAssignment);
    
          return user.save();
        })
        .then(savedUser => {
          console.log('Assignment created:', savedUser);
          res.redirect('/profile');
        })
        .catch(error => {
          console.error('Error occurred:', error);
          res.status(500).send('Error occurred while creating assignment or event');
        });
    });
    
    app.get('/downloadAttachment/:userId/:assignmentId/:attachmentIndex', checkAuthenticated, (req, res) => {
      const { userId, assignmentId, attachmentIndex } = req.params;
    
      User.findById(userId)
        .then(user => {
          if (!user) {
            return res.status(404).send('User not found');
          }
    
          const assignment = user.assignments.id(assignmentId);
          if (!assignment) {
            return res.status(404).send('Assignment not found');
          }
    
          const attachment = assignment.attachments[attachmentIndex];
          if (!attachment) {
            return res.status(404).send('Attachment not found');
          }
    
          const attachmentPath = path.join(__dirname, attachment.path);
          if (!fs.existsSync(attachmentPath)) {
            return res.status(404).send('Attachment file not found');
          }
    
          // Set appropriate headers for download
          res.setHeader('Content-Disposition', `attachment; filename=${attachment.filename}`);
          res.setHeader('Content-Type', attachment.mimetype);
    
          // Stream the file to the response
          fs.createReadStream(attachmentPath).pipe(res);
        })
        .catch(error => {
          console.error('Error occurred:', error);
          res.status(500).send('Error occurred while fetching attachment');
        });
    });
    
    
  // ... (previous code)
  app.get('/profile', checkAuthenticated, (req, res) => {
    res.render('profile.ejs',{user:req.user});
  });
// ... (previous code)

function getCategoryTotal(category, expenses) {
  let total = 0;
  expenses.forEach(expense => {
    if (expense.category === category) {
      total += expense.amount;
    }
  });
  return total;
}
function getTotalExpenses(expenses) {
  let total = 0;
  expenses.forEach(expense => {
    total += expense.amount;
  });
  return total;
}
function getRemainingBudget(monthlyBudget, expenses) {
  const totalExpenses = getTotalExpenses(expenses);
  const remainingBudget = monthlyBudget - totalExpenses;
  return remainingBudget >= 0 ? remainingBudget : 0;
}

// ... (remaining code)

app.get('/expenseTracker', checkAuthenticated, (req, res) => {
  res.render('expenseTracker.ejs', { user: req.user,getCategoryTotal: getCategoryTotal ,getTotalExpenses: getTotalExpenses, getRemainingBudget: getRemainingBudget,monthlyBudget: req.user.monthlyBudget});
   
});

app.post('/addExpense', checkAuthenticated, (req, res) => {
  const { amount, date, category } = req.body;
  
  const newExpense = {
    amount: Number(amount),
    date: new Date(date),
    category
  };

  User.findById(req.user._id)
    .then(user => {
      if (!user) {
        return res.status(404).send('User not found');
      }

      user.expenses.push(newExpense);

      return user.save();
    })
    .then(savedUser => {
      console.log('Expense added:', savedUser);
      res.redirect('/expenseTracker');
    })
    .catch(error => {
      console.error('Failed to add expense:', error);
      res.status(500).send('Internal Server Error');
    });
});

app.post('/setBudget', checkAuthenticated, (req, res) => {
  const { budget } = req.body;

  User.findById(req.user._id)
    .then(user => {
      if (!user) {
        return res.status(404).send('User not found');
      }

      user.monthlyBudget = Number(budget);

      return user.save();
    })
    .then(savedUser => {
      console.log('Monthly budget set:', budget);
      res.redirect('/expenseTracker');
    })
    .catch(error => {
      console.error('Failed to set monthly budget:', error);
      res.status(500).send('Internal Server Error');
    });
});
//


  
  
// const calendar=google.calendar({
//   version:'v3',
//   auth:oauth2Client,
//   auth:auth
// })
// //to create event
// function start(req, res) {
//   calendar.events.insert(
//     {
//       // auth: oauth2Client,
//       auth: auth,
//       calendarId: "primary",
//       resource: calenderEvent,
//     },
//     function (err, event) {
//       if (err) {
//         console.log(
//           "There was an error contacting the Calendar service: " + err
//         );
//         return;
//       }
//      // req.flash("success_msg", "event added to google calendar successfully");
      
//       res.redirect("/profile");
//     }
//   );
// }

  function connectDB() {
        const dbURI = 'mongodb+srv://bharani11044:NH88duwvt3WFKQwn@cluster0.bon7obr.mongodb.net/?retryWrites=true&w=majority';
      
        mongoose.connect(dbURI, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        })
        .then(() => {
          console.log('MongoDB Connected...');
          startServer();
        })
        .catch(err => {
          console.error('Failed to connect to MongoDB:', err);
        });
      }
      // Check if already connected to MongoDB Atlas
      if (mongoose.connection.readyState === 1) {
          // Already connected, start the server
          startServer();
        } else {
          // Not connected, establish connection and then start the server
          connectDB();
        }
        
    
    const PORT = process.env.NODE_ENV || 3000;
    function startServer() {
      
            app.listen(PORT, () => {
              console.log('Server started on port 3000');
            });
          }


// if (process.env.NODE_ENV !== 'production') {
//   require('dotenv').config()
// }

// const express = require('express')
// const app = express()
// const bcrypt = require('bcrypt')
// const passport = require('passport')
// const flash = require('express-flash')
// const session = require('express-session')
// const methodOverride = require('method-override')
// const User = require('./models/users')
//  const mongoose = require('mongoose');
// const initializePassport = require('./passport-config')
// initializePassport(
//   passport,
//   email => User.findOne({email: email}),
//   id => User.findById(id)
// )
// const bodyParser = require('body-parser');

// //




// app.set('view-engine', 'ejs')
// app.use(express.urlencoded({ extended: false }))
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(flash())
// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: false
// }))
// app.use(passport.initialize())
// app.use(passport.session())
// app.use(methodOverride('_method'))



// const { google } = require('googleapis');
// const OAuth2 = google.auth.OAuth2;
// const calendar = google.calendar('v3');

// const oauth2Client = new OAuth2(
// 'http://451836053069-lqa4ufup4jjfgjodf69pl3m7cjiig06v.apps.googleusercontent.com/',
// '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',
// 'http://localhost:3000/auth/google/callback'
// );

// // Generate the URL for user authorization
// const scopes = ['https://www.googleapis.com/auth/calendar'];
// const authUrl = oauth2Client.generateAuthUrl({
// access_type: 'offline',
// scope: scopes
// });
// const moment = require('moment-timezone');
// const timeZone = moment.tz.guess();
// console.log('Time Zone:', timeZone);


// app.get('/', checkAuthenticated, (req, res) => {
//   res.render('home.ejs', { name: req.user.name })
// })

// app.get('/login', checkNotAuthenticated, (req, res) => {
//   res.render('login.ejs')
// })

// app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
//   successRedirect: '/',
//   failureRedirect: '/login',
//   failureFlash: true
// }))

// app.get('/register', checkNotAuthenticated, (req, res) => {
//   res.render('register.ejs')
// })

// app.post('/register', checkNotAuthenticated, async (req, res) => {
//   try {
//       const hashedPassword = await bcrypt.hash(req.body.password, 10)
//           const user = new User({
//               name: req.body.name,
//               email: req.body.email,
//               password: hashedPassword
//               });
//               await user.save();
//               console.log(user);
//               res.redirect('/login');
    
//   } catch(error){
//       console.log(error);
//     res.redirect('/register')
//   }
// })

// app.delete('/logout', (req, res) => {
//   req.logOut()
//   res.redirect('/login')
// })

// function checkAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next()
//   }

//   res.redirect('/login')
// }

// function checkNotAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     return res.redirect('/')
//   }
//   next()
// }
// // ... (previous code)
// app.get('/auth/google/callback', (req, res) => {
//   const code = req.query.code;

//   // Exchange the authorization code for tokens
//   oauth2Client.getToken(code, (err, tokens) => {
//     if (err) {
//       console.error('Error while exchanging authorization code:', err);
//       res.redirect('/login'); // Redirect to login page on error
//       return;
//     }

//     // Set the credentials on the OAuth2 client
//     oauth2Client.setCredentials(tokens);

//     // Save the tokens in the user's session or database for future use

//     res.redirect('/profile'); // Redirect to the user's profile page
//   });
// });

// //

// app.get('/createassignment', checkAuthenticated, (req, res) => {
//   res.render('createassignment.ejs');
// });

// // app.post('/createassignment', checkAuthenticated, (req, res) => {
// //   const { assignmentname, dueDate, course } = req.body;

// //   // Create a new assignment object
// //   const newAssignment = {
// //     assignmentname,
// //     dueDate,
// //     course
// //   };

// //   // Find the user by ID
// //   User.findById(req.user._id)
// //     .then(user => {
// //       if (!user) {
// //         return res.status(404).send('User not found');
// //       }

// //       // Add the new assignment to the user's assignments array
// //       user.assignments.push(newAssignment);

// //       // Save the user document
// //       return user.save();
// //     })
// //     .then(savedUser => {
// //       console.log('Assignment created:', savedUser);
// //       res.redirect('/profile');
// //     })
// //     .catch(error => {
// //       console.error('Failed to create assignment:', error);
// //       res.status(500).send('Internal Server Error');
// //     });
// // });

// app.post('/createassignment', checkAuthenticated, (req, res) => {
//   const { assignmentname, dueDate, course } = req.body;

//   // Create a new assignment object
//   const newAssignment = {
//     assignmentname,
//     dueDate,
//     course
//   };

//   // Find the user by ID
//   User.findById(req.user._id)
//     .then(user => {
//       if (!user) {
//         return res.status(404).send('User not found');
//       }
// console.log(user);
//       // Add the new assignment to the user's assignments array
//       user.assignments.push(newAssignment);

//       // Save the user document
//       return user.save();
//     })
//     .then(savedUser => {
//       console.log('Assignment created:', savedUser);

//       // Create an event in the user's Google Calendar
//       const event = {
//         summary: assignmentname,
//         start: {
//           dateTime: new Date(dueDate).toISOString(),
//           timeZone: timeZone
//         },
//         end: {
//           dateTime: new Date(dueDate).toISOString(),
//           timeZone: timeZone
//         }
//       };
//       console.log('Access Token:', oauth2Client.credentials.access_token);
//       // Set the OAuth2 client's credentials
//       oauth2Client.setCredentials(req.user.tokens);

//       // Make the API request to insert the event
//       calendar.events.insert(
//         {
//           auth: oauth2Client,
//           calendarId: 'primary',
//           resource: event
//         },
//         (err, createdEvent) => {
//           if (err) {
//             console.error('Error creating Google Calendar event:', err);
//             res.redirect('/profile');
//             return;
//           }

//           console.log('Google Calendar event created:', createdEvent);
//           res.redirect('/profile');
//         }
//       );
//     })
//     .catch(error => {
//       console.error('Failed to create assignment:', error);
//       res.status(500).send('Internal Server Error');
//     });
// });

// app.get('/profile', checkAuthenticated, (req, res) => {
//   res.render('profile.ejs',{user:req.user});
// });
// // ... (previous code)
// // ... (previous code)

// function getCategoryTotal(category, expenses) {
// let total = 0;
// expenses.forEach(expense => {
//   if (expense.category === category) {
//     total += expense.amount;
//   }
// });
// return total;
// }
// function getTotalExpenses(expenses) {
// let total = 0;
// expenses.forEach(expense => {
//   total += expense.amount;
// });
// return total;
// }
// function getRemainingBudget(monthlyBudget, expenses) {
// const totalExpenses = getTotalExpenses(expenses);
// const remainingBudget = monthlyBudget - totalExpenses;
// return remainingBudget >= 0 ? remainingBudget : 0;
// }

// // ... (remaining code)

// app.get('/expenseTracker', checkAuthenticated, (req, res) => {
// res.render('expenseTracker.ejs', { user: req.user,getCategoryTotal: getCategoryTotal ,getTotalExpenses: getTotalExpenses, getRemainingBudget: getRemainingBudget,monthlyBudget: req.user.monthlyBudget});
 
// });

// app.post('/addExpense', checkAuthenticated, (req, res) => {
// const { amount, date, category } = req.body;

// const newExpense = {
//   amount: Number(amount),
//   date: new Date(date),
//   category
// };

// User.findById(req.user._id)
//   .then(user => {
//     if (!user) {
//       return res.status(404).send('User not found');
//     }

//     user.expenses.push(newExpense);

//     return user.save();
//   })
//   .then(savedUser => {
//     console.log('Expense added:', savedUser);
//     res.redirect('/expenseTracker');
//   })
//   .catch(error => {
//     console.error('Failed to add expense:', error);
//     res.status(500).send('Internal Server Error');
//   });
// });

// app.post('/setBudget', checkAuthenticated, (req, res) => {
// const { budget } = req.body;

// User.findById(req.user._id)
//   .then(user => {
//     if (!user) {
//       return res.status(404).send('User not found');
//     }

//     user.monthlyBudget = Number(budget);

//     return user.save();
//   })
//   .then(savedUser => {
//     console.log('Monthly budget set:', budget);
//     res.redirect('/expenseTracker');
//   })
//   .catch(error => {
//     console.error('Failed to set monthly budget:', error);
//     res.status(500).send('Internal Server Error');
//   });
// });

// // server.js

// // ...
// // server.js

// // ...


// // ...




// function connectDB() {
//       const dbURI = 'mongodb+srv://bharani11044:NH88duwvt3WFKQwn@cluster0.bon7obr.mongodb.net/?retryWrites=true&w=majority';
    
//       mongoose.connect(dbURI, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//       })
//       .then(() => {
//         console.log('MongoDB Connected...');
//         startServer();
//       })
//       .catch(err => {
//         console.error('Failed to connect to MongoDB:', err);
//       });
//     }
//     // Check if already connected to MongoDB Atlas
//     if (mongoose.connection.readyState === 1) {
//         // Already connected, start the server
//         startServer();
//       } else {
//         // Not connected, establish connection and then start the server
//         connectDB();
//       }
      
  
  
//   function startServer() {
    
//           app.listen(3000, () => {
//             console.log('Server started on port 3000');
//           });
//         }




