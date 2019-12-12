const localStrategy = require('passport-local').Strategy;
const JwtCookieComboStrategy = require('passport-jwt-cookiecombo')
const user = require('./models/user');
const bcrypt = require('bcrypt');


function initialize(passport, getUserById){
     const authUser = async (login , password, done) => {
        try {
            const searchedUser = await user.findUserByLogin(login);
            if(searchedUser == null)
                return done(null, false, {message: 'No user with that login'});

            if(await bcrypt.compare(password, searchedUser.password))
                return done(null, searchedUser);
            else 
                return done(null, false, {message: "password incorrect"});
            
        } catch(err) {
            return done(err);
        }
    }

    passport.use('jwt',new JwtCookieComboStrategy({

        secretOrPublicKey: 'StRoNGs3crE7'
    }, (payload, done) => {
        return done(null, payload.user);
    }));
    passport.use(new localStrategy({usernameField: 'login'},authUser));
    passport.serializeUser((user, done) => {done(null, user.id)});
    passport.deserializeUser((id, done) => {
        getUserById(id)
            .then( user=> {
                
                done(null, user);
            })
            .catch(err => console.log(err))
    });
}

module.exports = initialize;