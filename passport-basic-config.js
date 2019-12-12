const BasicStrategy = require('passport-http').BasicStrategy;
const user = require('./models/user');
const bcrypt = require('bcrypt');

function initializeBasic(passport, getUserById){
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
   passport.use(new BasicStrategy({usernameField: 'login'}, authUser));
}

module.exports = initializeBasic;