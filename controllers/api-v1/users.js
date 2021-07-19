const router = require('express').Router()
const db = require('../../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const authLockedRoute = require('./authLockedRoute.js')


// GET /users -- test api endpoint
router.get('/', (req, res) => {
  res.json({msg: 'hi! the user endpoint is ok 👌'})
})

// GET ALL LOCATIONS  - - - - - - - - - - - - - - - - -
router.get('/location', (req, res) => {
    db.Location.find().populate('user')
    .then(foundLocations => { res.json(foundLocations) })
    .catch(err => { console.log(err) })
})

// GET SPECIFIC LOCATION  - - - - - - - - - - - - - - - - -
router.get('/location/:id', (req, res) => {
    db.Location.findById(req.params.id).populate('friends').populate('location')
    .then(foundLocation => { res.send(foundLocation) })
    .catch(err => { console.log(err) })
})

// DELETE SPECIFIC LOCATION  - - - - - - - - - - - - - - - - -
router.delete('/location/:id', (req, res) => {
    db.Location.findOneAndDelete({
        _id: req.params.id
    }, {useFindAndModify: false})
    .then(deletedLocation => { res.send(deletedLocation) })
    .catch(err => { console.log(err) })
})

// GET current user location  - - - - - - - - - - - - - - - - -
router.get('/profile/:id', async (req, res) => {
    try {
        const findUser = await db.User.findById(req.params.id).populate('location').populate('friends')
        res.json(findUser)
    } catch (err) {
        console.log(err)
    }
})

// PUT (update) current user location  - - - - - - - - - - - - - - - - -
router.put('/profile/:id', async (req, res) => {
    try {
        const currentUser = await db.User.findById(req.params.id).populate('location').populate('friends')
        const oldLocation = await db.Location.findOne({name: currentUser.location[0].name})
        const newLocation = await db.Location.findOne({name: req.body.placeName})

        currentUser.location = await newLocation
        oldLocation.user.remove(currentUser._id)
        newLocation.user.push(currentUser._id)

        await currentUser.save()
        await oldLocation.save()
        await newLocation.save()
        
        res.json({currentUser})

    } catch (err) {
        res.send(err)
    }
})

// adding friend list route  - - - - - - - - - - - - - - - - -
router.get('/friends/:id', async (req,res) => {
    try{
        const findUser = await db.User.findById(req.params.id).populate('friends')
        res.json(findUser)
    } catch (err) {
        res.send(err)
    }
})

// POST -- ADD NEW FRIENDS - - - - - - - - - - - - - - - - -
router.post('/friends/:id', async(req,res) => {
    try {  
        const currentUser = await db.User.findById(req.params.id)
        const findFriend = await db.User.findOne({ name: req.body.name })
        if (!findFriend) return res.status(400).json({msg: 'Your friend does not have this app' })
        currentUser.friends.addToSet(findFriend._id)
        findFriend.friends.addToSet(currentUser._id)
    
        await currentUser.save()
        await findFriend.save()
        res.json({currentUser})

    } catch (err) {
        console.log(err)
    }
})

// DELETE FRIENDS - - - - - - - - - - - - - - - - -
router.delete('/friends/:id', async (req, res) => {
    try {
        const currentUser = await db.User.findById(req.params.id)
        const findFriend = await db.User.findOne({ name: req.body.name })

        currentUser.friends.remove(findFriend._id)
        findFriend.friends.remove(currentUser._id)
        
        await currentUser.save()
        await findFriend.save()
        res.json({currentUser})

    } catch (err) {
        console.log(err)
    }
})


// DELETE CURRENT USER - - - - - - - - - - - - - - - - -
router.delete('/delete/:id', (req, res) => {
    db.User.findOneAndDelete({
        _id: req.params.id
    }, {useFindAndModify: false})
    .then(deletedUser => { res.send(deletedUser) })
    .catch(err => { console.log(err) })
})

<<<<<<< HEAD
=======
// Event Creation Route


>>>>>>> a489116851128a1e359df962b61de34dc2557b9d
// GET current user location  - - - - - - - - - - - - - - - - -
router.get('/events/:id', async (req, res) => {
  try {
      const findUser = await db.User.findById(req.params.id).populate('events')
      res.json(findUser)
  } catch (err) {
      console.log(err)
  }
})

// Event Creation Route
router.post('/events/:id', async (req, res) => {
  let { friend, location, eventName } = req.body
  let findSelf = await db.User.findById(req.params.id)
  let foundUser = await db.User.findOne({ name: friend })
  let createdEvent = await db.Event.create({eventName: eventName})
  let locationName = await db.Location.findOne({ name: location })
  try {
    createdEvent.location.push(locationName._id)
    findSelf.events.push(createdEvent._id)
    foundUser.events.push(createdEvent._id)
    createdEvent.users.push(foundUser._id)
    createdEvent.users.push(findSelf._id)
    // createdEvent.users.push(locationName._id)
    findSelf.save()
    foundUser.save()
    locationName.save()
    createdEvent.save()
    console.log(createdEvent)
    res.redirect(`/api-v1/users/events/${findSelf._id}`)
  } catch(err) {
    console.log(`you have an ${err} in Event postroute`)
  }
})

// POST /users/register -- CREATE new user (aka register) - - - - - - - - - - - - - - - - -
router.post('/register', async (req, res) => {
  try {
    // check if user exists alrdy
    const findUser = await db.User.findOne({
      email: req.body.emails
    })
    .populate('friends')
    .populate('location')
    // if the user found -- dont let them register
    if(findUser) return res.status(400).json({msg: 'user already exists in the db'})

    // hash password from req.body
    const password = req.body.password
    const salt = 12
    const hashedPassword = await bcrypt.hash(password, salt)

    // create our new user
    const newUser = db.User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    }) 
    await newUser.save()

    // create the jwt payload
    const payload = {
      name: newUser.name,
      email: newUser.email,
      id: newUser.id,
     }
     // sign the jwt and send a response
     const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d'})

     res.json({ token })

  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'internal server error'})
  }
})

// POST /user/login -- validate login credentials - - - - - - - - - - - - - - - - -
router.post('/login', async (req, res) => {
    try {
        // try to find the user in the database
        const findUser = await db.User.findOne({
        email: req.body.email
        })
        .populate('friends')
        .populate('location')

        const validationFailedMessage = 'incorrect username or password 🤣'
        // if the user found -- return immediately 
        if (!findUser) return res.status(400).json({msg: validationFailedMessage })
        // check the user's password from the db against what is in the req.body
        const matchPassword = await bcrypt.compare(req.body.password, findUser.password)
        // if the password doesnt match -- return immediately
        if (!matchPassword) return res.status(400).json({msg: validationFailedMessage })
        // create the jwt payload
        const payload = {
        name: findUser.name,
        email: findUser.email,
        id: findUser.id
        }
        // sign the jwt and send it back
        const token = await jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '24h' })
        res.json({ token })
    
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'internal server error'})
    }
})

// GET /auth-locked -- will redirect if a bad jwt is found - - - - - - - - - - - - - - - - -
  router.get('/auth-locked', authLockedRoute, (req, res) => {
    // do whatever we like with the user
    // console.log(res.locals.user)
    // send private data back
    res.json({ msg: ' welcome to the auth locked route 🐶🐶🐶'})
  })

router.put('/profile/edit', (req, res) => {
  db.User.findById(req.params.id)
  .then(user => {
    user.name = req.body.name

    user.save()
    .then(() => {
      res.redirect('/profile')
    })
    .catch ((err) => console.log(err))
  })
  .catch ((err) => console.log(err))
})

module.exports = router