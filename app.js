var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var ejs = require('ejs');
var flash = require('connect-flash');

var app = express();

//配置路由
var routesPage = require('./routes/pages.js');
var routesIndex = require('./routes/index.js');
var routesUsers = require('./routes/users.js');

app.use('/page', routesPage);
app.use('/index', routesIndex);
app.use('/users', routesUsers);


//template engine
app.set('views', path.join(__dirname, 'views')); //设置res.render函数查找的目录
app.engine('.html', ejs.__express); //设置模板引擎为html
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.use(flash());

//static file
app.use('/public', express.static('./public'));

//使用passport的local策略
passport.use(require('./passport_strategys/local.js'));

//持久化session到redis，passport必须
app.use(session({
	store: new RedisStore({host: '127.0.0.1', port: 6379, ttl: 60 * 60 * 24, prefix: 'passport:'}),
	name: 'test',//cookie名
	secret: '12345',
	cookie: {
		maxAge: 1000 * 60 * 60 * 24
	},
	resave: false,//官方文档强烈建议设置为false
	saveUninitialized: false //官方文档强烈建议设置为false
}));

//刷新session信息，如果你想要执行每次请求的时候都更新过期时间，那么必须写这个
app.use(function(req, res, next) {
	req.session.a = Date();
	//req.session.touch();//不需要显示调用，session中间件会自动做
	next();
});

//初始化passport,passport必须
app.use(passport.initialize());
//如果要持久化登陆session，注意在这之前要先使用express.session()
app.use(passport.session());

//序列化用户信息,passport必须
passport.serializeUser(function(user, done) {
	done(null, user);
});
//反序列化用户信息,passport必须
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});


//登录方式1
//设置successFlash或failureFlash时，需要req.flash()，但是express 3.x后该方法被删除了，所以需要引入connect-flash来实现。
app.post('/login1', passport.authenticate('local', {
	successFlash: true,
	successRedirect: '/loginchecksuccess',
	failureFlash: true,
	failureRedirect: '/logincheckfail'
}));
//登录成功的事件
app.get('/loginchecksuccess', function(req, res) {
	var message = req.flash('success');
	if (message) {
		message = message[0];
	}
	res.json({
		"Result": "success",
		"Msg": message
	});
});
//登录失败的事件
app.get('/logincheckfail', function(req, res) {
	var message = req.flash('fail');
	if (message) {
		message = message[0];
	}
	res.json({
		"Result": "fail",
		"Msg": message
	});
});

//登录方式2
app.post('/login2', passport.authenticate('local', {
	successFlash: true,
	failureFlash: true
}), function(req, res, next) {
	//至于策略验证成功才会调用该方法。如果验证失败需要像登录方式1一样指定失败时调用的函数或者在页面中判断返回状态401。
	var message = req.flash('success');
	if (message) {
		message = message[0];
	}
	res.json({
		"Result": "success",
		"Msg": message
	});
});

//登录方式3
//如果上述两种内置的方式都无法满足你的需求，那么你可以通过直接调用的方式验证。
app.post('/login3', function(req, res, next) {

	passport.authenticate('local', function(err, user, info) {
		//err user info 分别对应策略中传入done()函数中的值。
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.json({"Result": "fail","Msg": info.message});
		}
		//这种方式需要我们自己调用req.logIn方法来建立session。
		req.logIn(user, function(err) {
			if (err) {
				return next(err);
			}
			return res.json({"Result": "success","Msg": info.message});
		});

	})(req, res, next);

});


//获取数据
app.get('/getdata', function(req, res) {

	if (req.isAuthenticated()) {

		var data = req.user;
		return res.json({
			"Result": "success",
			"Data": data,
			"ExpiredTime": req.session.cookie.maxAge
		});
	} else {
		return res.json({
			"Result": "fail",
			"Msg": "您还未登录"
		});
	}

});
//退出登录
app.post('/logout', function(req, res) {
	req.logout();
	res.json({
		"Result": "success",
		"Msg": "退出成功"
	});
});

// 处理404
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// 这里处理所有传递给next()的err
// 开发环境处理
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.json({"Result":"error","Msg":err.stack});
	});
} else {
	// 生产环境处理
	app.use(function(err, req, res, next) {
		console.error(err.stack);
		res.status(err.status || 500);
		res.json({"Result":"error","Msg":err.stack});
	});
}

app.listen(9000, function(req, res) {
	console.log('listen localhost:9000/');
});

module.exports = app;