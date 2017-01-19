var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
//passport必须要引入的木块-start
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
//passport必须要引入的木块-end
var ejs = require('ejs');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

//modify engine
app.set('views', path.join(__dirname, 'views'));
app.engine('.html', ejs.__express);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//static file
app.use('/public', express.static('./public'))

app.use('/', routes);
app.use('/users', users);

//设置session,passport必须
app.use(session({ secret: '12345', name: 'test', cookie: { maxAge: 10000 }, resave: true, saveUninitialized: true }));

//刷新session信息，如果你想要执行每次请求的时候都更新过期时间，那么必须写这个
app.use(function(req, res, next){
    req.session.a = Date();
    req.session.touch();
    next();
});

//初始化passport,passport必须
app.use(passport.initialize());
app.use(passport.session());

//序列化用户信息,passport必须
passport.serializeUser(function (user, done) {
  done(null, user);
});
//反序列化用户信息,passport必须
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

//验证策略,passport必须
passport.use(new LocalStrategy({
  usernameField: 'username',//指定请求中的哪个字段作为用户名
  passwordField: 'password',//指定请求中的哪个字段作为密码
  passReqToCallback: true//指定将req这个参数传递到回调中
},
  function (req, username, password, done) {

    //这里可以写自己的验证逻辑了,正常我们是应该去查数据库的,现在我只是简单的举例，所以就直接写死了
    var user = {
      username: 'admin',
      password: '123456',
      name: 'zengxianlong',
      mobile: 123456789
    };
    if (username != user.username) {
      return done(null, false, { message: '用户名不存在' });//message这个属性是固定写法
    }
    if (password != user.password) {
      return done(null, false, { message: '密码错误' });
    }

    //验证通过
    return done(null, user);

  }
));
//登录方式1
// app.post('/login',
//   passport.authenticate('local', { failureRedirect: '/logincheckfail' }),
//   function(req,res){
//     res.json({ "Result": "success", "Msg": "登录成功" });
// });
//登录方式2
//app.post('/login',passport.authenticate('local', { successRedirect:'/loginchecksuccess', failureRedirect: '/logincheckfail' }));
//登录方式3
app.post('/login', function (req, res, next) {
  
  passport.authenticate('local', function (err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/logincheckfail'); }
    req.logIn(user, function (err) {
      if (err) { return next(err); }
      return res.redirect('/loginchecksuccess');
    });
    
  })(req, res, next);
  
});

//登录成功的事件
app.get('/loginchecksuccess', function (req, res) {
  res.json({ "Result": "success", "Msg": "登录成功" });
});
//登录失败的事件
app.get('/logincheckfail', function (req, res) {
  res.json({ "Result": "fail", "Msg": "用户名或密码错误" });
});
//获取数据
app.get('/getdata', function (req, res) {

  if (req.isAuthenticated()) {

    var data = req.user;
    return res.json({ "Result": "success", "Data": data,"ExpiredTime":req.session.cookie.maxAge });
  } else {
    return res.json({ "Result": "fail", "Msg": "您还未登录" });
  }

});
//退出登录
app.post('/logout', function (req, res) {
  req.logout();
  res.json({ "Result": "success", "Msg": "退出成功" });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
