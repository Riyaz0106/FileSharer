const express = require("express");
const app = express();
const cors = require("cors");
const methodOverride = require('method-override');
const FileRoutes = require("./routes/file.route");
const cookieParser = require('cookie-parser');
const session = require('express-session');
const favicon = require('serve-favicon');
const flash = require('connect-flash');
var path = require('path');
const WTCcon  = require("./configWTC");
const auth = require("./services/authUser");
const oneDay = 1000 * 60 * 60 * 24;

app.use(express.static(path.join(__dirname, 'public')));

//middleware
app.use(cors());
app.use(express.json()); //req.body
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(session({
    secret: "thisismysecrctekey343ji43j4n3jn4jk3n",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

app.use(flash());

app.use(favicon(path.join(__dirname, 'public/images/favicon_io/', 'favicon.ico')));

app.use('/', FileRoutes);
app.set("views", "./views");
app.get('/', (req, res) => {
    if(req.session.user){
        res.redirect('/dashboard');
    }
    else{
        res.redirect('/login');
    }
});

app.get('*', function(req, res){
    req.flash('msg', 'File Not Found!');
    res.statusMessage = req.flash('msg')[0];
    res.status(404).render('pages/404.ejs'); // have to create file not found page and render it
});

// app.listen(5000, () => {
//     console.log("App server has started on port 5000");
// });

(async () => {
    const shibSess = await auth.getAuth(WTCcon.username,WTCcon.password);
    if(shibSess.search("Shibsession") !== -1){
        console.log("WTC Authentication Success!");
        WTCcon.shibSess = shibSess.split(":")[1];

        app.listen(5000, () => {
            console.log("App server has started on port 5000");
        });

    } else if(shibSess.search("invalid") !== -1 || shibSess.search("CAPTCHA") !== -1){
        console.log("WTC Authentication Failed. "+shibSess);
        console.log("App Server unable to start. Please restart the server.");
    } else{
        console.log("WTC Authentication failed due to some error in authUser.js");
        console.log("App Server unable to start. Please restart the server.");
    }
})()