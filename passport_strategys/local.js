
var _LocalStrategy = require('passport-local').Strategy;

var localStrategy = new _LocalStrategy({
        usernameField: 'username', //对应前端提交的参数名，默认为username
        passwordField: 'password', //对应前端提交的参数名，默认为password
        passReqToCallback: true, //设置将request作为第一个参数传到下面的回调函数中
        session: true //如果不需要session支持，可以设置为false。默认为true
    },
    function(req, username, password, done) {
        //这里可以写查询数据库的逻辑来验证登录信息是否有效。
        //如果程序出异常，将err作为第一个参数传给done。如果是登录方式1和登录方式2，done()方法内部会直接将err传递给next方法。所以，需要我们自己捕获处理。
        //如果验证失败，将false作为第二个参数传给done。
        //如果验证成功，将用户信息作为第二个参数传给done，最终用户信息会被保存在req.user上。
        //done的第三个参数是个可选的提示信息，用于验证失败时提示失败原因
        //return done(new Error('error test'));
        if(username === 'test' && password === '123'){
            //如果设置了successFlash: true，那么将来可以通过req.flash('success')取到message信息
            return done(null, {username:'test',password:'123',id:1,name:'test'}, {type: 'success', message: '验证成功'});
        } else{
            //如果设置了failureFlash: true，那么将来可以通过req.flash('fail')取到message信息
            return done(null, false, {type: 'fail', message: '用户名或密码错误'});
        }
    }
);

module.exports = localStrategy;