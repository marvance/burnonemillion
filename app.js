var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs')
var sessionsModule = require('client-sessions')
var pug = require('pug');

var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

var UltimateModel = require('./dbmodels/createprofile')
var BadgeModel = require('./dbmodels/badgemodels')
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('./uploads'))

//Begin login code 
mongoose.connect("mongodb://localhost/burndb", function(err){
  if(err){console.error(err)}
    else{ console.info('mongoose initialized')}
})

var checkIfLoggedIn = function(req, res, next){
    if ( req.session._id ) {
        console.log("user is logged in")
        next()
    }
    else {
        console.log("no one is logged in")
        res.redirect('/')
    }
}

var checkIfLoggedInForAjax = function(req, res, next){
    if ( req.session._id ) {
        console.log("user is logged in")
        next()
    }
    else {
        console.log("no one is logged in")
        res.send({failure:'not logged in'})
    }
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('./'))

app.use(sessionsModule({
    cookieName: 'auth-cookie',  // front-end cookie name
    secret: 'DR@G0N$',        // the encryption password : keep this safe
    requestKey: 'session',    // we can access our sessions at req.session,
    duration: (86400 * 1000) * 7, // one week in milliseconds
    cookie: {
        ephemeral: true,     // when true, cookie expires when browser is closed
        httpOnly: true,       // when true, the cookie is not accessible via front-end JavaScript
        secure: false         // when true, cookie will only be read when sent over HTTPS
    }
})) // encrypted cookies

app.use(function(req, res, next){
    console.log('session? ', req.session)
    next()
})

app.get('/', function(req, res){
    res.sendFile('./views/index.html', {root:'./'})
})

app.get('/checkout', function(req,res){
    res.sendFile('./views/checkout.html', {root: './'})
})

app.post('/submitpurchase', function(req,res){
    // Set your secret key: remember to change this to your live secret key in production
    // See your keys here: https://dashboard.stripe.com/account/apikeys
    var stripe = require("stripe")("sk_test_X41QsEL2eUPqiwNet26pzRXZ");

    (async function() {
      // Create a Customer:
      var customer = await stripe.customers.create({
        source: 'tok_mastercard',
        email: 'paying.user@example.com',
      });

      // Charge the Customer instead of the card:
      var charge = await stripe.charges.create({
        amount: 1000,
        currency: 'usd',
        customer: 'CUSTOMER',
      });

      // YOUR CODE: Save the customer ID and other info in a database for later.

    })();

    (async function() {
      // When it's time to charge the customer again, retrieve the customer ID.
      var charge = stripe.charges.create({
        amount: 1500, // $15.00 this time
        currency: 'usd',
        customer: 'CUSTOMER', // Previously stored, then retrieved
      });
    })();
    // res.send(charge)
    res.sendFile('./views/thanks.html', {root:'./'})
})

app.get('/session-test', function(req, res){
    console.log('session? ', req.session)
    if ( !req.session.counter ) {
        req.session.counter = 1
    }
    else {
        req.session.counter++
    }
    res.send('session counter: ' + req.session.counter)
})

app.all('/signup', function(req, res){
    UltimateModel.findOne({username: req.body.username}, function(err, user){
        if ( err ) { console.log('there was an error')}
        else if ( user ) { 
            res.send('<h1>User already exists; please log in.</h1>')
        }
        else {
            var newUser = new UltimateModel(req.body)
            var aspiringAuthor = new BadgeModel({
                title: "Aspiring Author",
                summary: "You joined Burn 1 Million",
                img: "/public/images/aspiringbadge.png"
            })
            aspiringAuthor.save()
            newUser.badges.push(aspiringAuthor)
            var announcement = newUser.name + " earned the Aspiring Author badge."
            newUser.badgeAnnouncements.push(announcement)
            newUser.photo = "/public/images/nobody.png"
            newUser.total = 0
            // this user object has a plain-text password
            // we hash the password before we save the user
            bcrypt.genSalt(11, function(saltErr, salt){
                if (saltErr) {console.log(saltErr)}
                // console.log('salt generated: ', salt)
                bcrypt.hash(newUser.password, salt, function(hashErr, hashedPassword){
                    if ( hashErr){ console.log(hashErr) }
                    newUser.password = hashedPassword
                    newUser.save(function(saveErr, user){
                        if ( saveErr ) { console.log(saveErr)}
                        else {
                            req.session._id = user._id // this line is what actually logs the user in. 
                            res.send(user)
                        }
                    })
                })
            })
        }
    })
})

app.get('/isloggedin', function(req,res){
    UltimateModel.findOne({_id: req.session._id}, function(err, user){
        if(user) {
            res.send(user)        
        }
        else {
            res.send("no user")
        }
    })
})

app.post('/login', function(req, res){
    UltimateModel.findOne({username: req.body.username}, function(err, user){
        if ( err ) { console.log('Failed to log in')}
        else if ( !user ) { 
            console.log('no user found')
            res.send('Failed to log in')
        }
        else {
            //user exists; does password match?
            bcrypt.compare(req.body.password, user.password, function(bcryptErr, matched){
                if ( bcryptErr ) { console.log(bcryptErr)}
                //matched will be either true or false
                else if ( !matched ) {
                    console.log('passwords dont match')
                    res.send('Failed to log in')
                }
                else {
                    req.session._id = user._id
                    // res.send({success:'success!'})
                    res.send(user)
                } 
            })
        }
    }) 
})

app.get('/dashboard', checkIfLoggedIn, function(req, res){
    UltimateModel.findOne({_id: req.session._id}, function(err, user){
        if ( user ) {
            res.send(`Hello, ${user.username}. Welcome to your dashboard!
                <a href="/logout">Log Out</a>
            `)
        }
        else {
            res.send("you don't belong here!")
        }
    })
})

app.get('/me', checkIfLoggedInForAjax, function(req, res){
    UltimateModel.findOne({_id:req.session._id}, function(err, user){
        res.send(user)
    })
})

app.get('/logout', function(req, res){
    req.session.reset()
    res.redirect('/')
})

//End login code

// TO DO:
//Hemingway badge
//Word count milestone badges

app.post('/createprofile', upload.single('photo'), function(req,res){
    console.log(req.body)
    console.log(req.file)

    UltimateModel.findOne({_id:req.session._id}, function(err,user){
        if ( user ){
            user.name = req.body.name;
            user.genre = req.body.genre;
            user.bio = req.body.bio;
            if(req.file) {
                user.photo = req.file.filename;
            }
            user.save()
        }
        res.send(user)
        //else (i.e. if no user) direct to signup (and login?)       
    })
})

app.get("/getcounts", function(req,res){
    UltimateModel.findOne({_id:req.session._id}, function(err,user){
        if (user){
            res.send(user.counts)
        }
        else {
            res.send("please log in")
        }
    })
})

app.post("/addcount", function(req,res){
    UltimateModel.findOne({_id:req.session._id}, function(err, user){
        if(user){
            if (!user.counts.length) {
                var firstEntry = new BadgeModel({
                    title: "First Entry",
                    summary: "You wrote a thing",
                    img: "/public/images/firstentrybadge.png"
                })
                firstEntry.save()
                user.badges.push(firstEntry)
                var announcement = user.name + " earned the First Entry badge."
                user.badgeAnnouncements.push(announcement)
            }
            count = {
                date: req.body.date,
                words: req.body.words
            }
            user.counts.push(count)
            user.save()
            res.send(user)
        }
        else {
            //show overlay containing login
            res.send("Please log in")
        }
    })
})

app.post("/recordtotal", function(req,res){
    UltimateModel.findOne({_id:req.session._id}, function(err,user){
        if(user){
            user.total = req.body.allTimeTotal
            user.save()
            res.send(user)
        }
    })
})

app.post("/setgoal", function(req,res){
    UltimateModel.findOne({_id:req.session._id}, function(err,user){
        if (user) {
            if (!user.goal.words){
                var goalBadge = new BadgeModel({
                    title: "Goal Oriented",
                    summary: "You set a goal",
                    img: "/public/images/goalbadge.png"
                })
                goalBadge.save()
                user.badges.push(goalBadge)
                var announcement = user.name + " earned the Goal Oriented badge."
                user.badgeAnnouncements.push(announcement)
            }
            user.goal = {
                date: req.body.date,
                words: req.body.words
            }
            user.save()
            res.send(user)
        }
    })
})

app.get("/getstrangers",function(req,res){
    UltimateModel.findOne({_id:req.session._id}, function(err,myself){
        if(myself){
            var excluded = []
            excluded.push(myself)
            for(var i=0; i<myself.friends.length; i++){
                excluded.push(myself.friends[i])
            }
            UltimateModel.find({}, function(err,users){
                if(users){
                    var filteredStrangers = users.filter(function(user_el){
                        return excluded.filter(function(excluded_el){
                            return excluded_el.id == user_el.id;
                        }).length == 0
                    });
                    res.send(filteredStrangers)
                }
                else {
                    res.send("please log in")
                }
            })
        }
    })
})

app.post("/addfriend", function(req, res){
    UltimateModel.findOne({_id:req.body.newFriendId}, function(err, newFriend){
        if(newFriend){
            UltimateModel.findOne({_id:req.session._id}, function(err, user){
                if(user){
                    if(!user.friends.length) {
                        var socialBadge = new BadgeModel({
                            title: "Social",
                            summary: "You made a friend",
                            img: "/public/images/socialbadge.png"
                        })
                        socialBadge.save()
                        user.badges.push(socialBadge)
                        var announcement = user.name + " earned the Social badge."
                        user.badgeAnnouncements.push(announcement)
                    }
                    user.friends.push({
                        id: newFriend._id,
                        name: newFriend.name,
                        genre: newFriend.genre,
                        bio: newFriend.bio,
                        photo: newFriend.photo,
                        total: newFriend.total
                    })
                    user.save()
                    var userInfo = {
                        user: user,
                        newFriend: newFriend.name
                    }
                    res.send(userInfo)
                }
                else {
                    res.send("please log in")
                }
            })
        }
        else {
            res.send("no user found")
        }
    })
})


app.get("/getfamous", function(req,res){
    UltimateModel.find({famous:true}, function(err, users){
        res.send(users)
    })
})

//resume node boilerplate
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
