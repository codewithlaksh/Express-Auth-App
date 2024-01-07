const express = require('express');
const cookieParser = require('cookie-parser');
const exphbs = require('express-handlebars');
const path = require('path');
const connectToMongo = require('./middleware/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

connectToMongo();

app.set('views', path.join(__dirname, 'views'))

app.engine('hbs', exphbs.engine({
    extname: 'hbs',
    defaultLayout: 'basic.hbs'
}))
app.set('view engine', 'hbs')

app.use(cookieParser());
app.use(express.json());
app.use(async (req, res, next) => {
    if (!req.cookies['authToken']) {
        res.locals.session = false;
    } else {
        const token = req.cookies['authToken'];
        const data = jwt.verify(token, process.env.AUTH_SECRET);
        const user = await User.findById(data._id);
        res.locals.user = user.email.split('@')[0];
        res.locals.session = true;
    }
    next()
})

app.use('/static', express.static('public'))

app.get('/', (req, res) => {
    if (!req.cookies['authToken']) {
        res.render('index', {title: 'Home | MyAuth'})
    } else {
        return res.redirect('/welcome')
    }
})

app.get('/signup', (req, res) => {
    if (!req.cookies['authToken']) {
        res.render('signup', {title: 'Signup | MyAuth'})
    } else {
        return res.redirect('/welcome')
    }
})

app.get('/welcome', (req, res) => {
    if (req.cookies['authToken']) {
        res.render('welcome', {title: 'Welcome | MyAuth'})
    } else {
        return res.redirect('/')
    }
})

app.post('/api/signup', async (req, res) => {
    const { email, password, cpassword } = req.body;
    let regex = /^([_\-\.0-9a-zA-Z]+)@([_\-\.0-9a-zA-Z]+)\.([a-zA-Z]){2,7}$/;
    let success = false;

    if (email === '' || password === '' || cpassword === '') {
        res.status(200).json({
            success,
            message: 'Credentials cannot be empty!'
        })
    } else {
        if (regex.test(email)) {
            if (password.length < 4) {
                res.status(200).json({
                    success,
                    message: 'Password must contain atleast 4 characters!'
                })
            } else if (password != cpassword) {
                res.status(200).json({
                    success,
                    message: 'Passwords do not match!'
                })
            } else {
                // Generate salt and hash the password
                const salt = await bcrypt.genSalt(12);
                const secPass = await bcrypt.hash(password, salt);

                const user = new User({
                    email: email,
                    password: secPass
                })
                await user.save();
                success = true;

                res.status(200).json({
                    success,
                    message: 'User created successfully'
                })
            }
        } else {
            res.status(200).json({
                success,
                message: 'Email is not valid!'
            })
        }
    }
})

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    let regex = /^([_\-\.0-9a-zA-Z]+)@([_\-\.0-9a-zA-Z]+)\.([a-zA-Z]){2,7}$/;
    let success = false;

    if (email === '' || password === '') {
        res.status(200).json({
            success,
            message: 'Credentials cannot be empty!'
        })
    } else {
        if (regex.test(email)) {
            const user = await User.findOne({email: email})
            if (user) {
                const passwordCompare = await bcrypt.compare(password, user.password);
                if (passwordCompare) {
                    success = true;
                    const payload = {
                        _id: user._id
                    }
                    const token = jwt.sign(payload, process.env.AUTH_SECRET);

                    res.status(200).json({
                        success,
                        message: 'You have been logged in successfully!',
                        token
                    })
                } else {
                    res.status(200).json({
                        success,
                        message: 'Invalid password!'
                    })
                }

            } else {
                res.status(200).json({
                    success,
                    message: 'No such user exists!'
                })
            }
        } else {
            res.status(200).json({
                success,
                message: 'Email is not valid!'
            })
        }
    }
})

app.listen(8080, () => {
    console.log('Auth app listening on port 8080');
})
