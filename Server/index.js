const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const balKand = require('./models/balKand.js');
app.use(bodyParser.json());
app.use(cors());
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = 'your-secret-key';
const User = require('./models/user.js');
const verifyToken = require('./authMiddleware')
const dotenv = require('dotenv'); 
dotenv.config();
app.use(express.json())

mongoose.connect('mongodb://localhost:27017/minor-project')
  .then(() => {
    console.log("MONGO CONNECTION OPEN!!!");
  })
  .catch(err => {
    console.log("OH NO MONGO CONNECTION ERROR!!!!");
    console.log(err);
  });

// Registration routes
 app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
 });

//   app.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ error: 'Authentication failed try Again' });
//     }
//     const passwordMatch = await bcrypt.compare(password, user.password);

//     if (!passwordMatch) {
//       return res.status(401).json({ error: 'Authentication failed try Again' });
//     }
//     // Create a JWT token
//     const token = jwt.sign({ userId: user._id, email: user.email }, secretKey, {
//       expiresIn: '1h',
//     });
//     res.header('Authorization', token).json({ token });


//     res.status(200).json({ token, userId: user._id });
//   } catch (error) {
//     res.status(500).json({ error: 'Authentication failed try Again' });
//   }
// });
//

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Authentication failed. Try Again.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Authentication failed. Try Again.' });
    }

    // Create a JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.header('Authorization', `Bearer ${token}`).status(200).json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed. Try Again.' });
  }
});

//


  app.get('/balKand/:id/:subId',verifyToken, async (req, res) => {
    try {
        const info = "1." + req.params.id.toString();
        const subInfo = req.params.subId.toString();
        if(subInfo.length === 2){
        const slokas = await balKand.findOne({ id: info +"."+ subInfo });
        res.json(slokas);  }
        else if(subInfo.length < 2){
            return res.status(400).json({ error: 'Invalid subId' });
        }
        else{
            const [a,b] = subInfo.split("-");       
            const slokas = await balKand.find({
              id: {
                $gte: `${info}.${a}`,
                $lte: `${info}.${b}`
              }
            }   
          );
            res.json(slokas);  
        }
    } catch (error) {
        console.error('Error fetching slokas:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/balKand/:id', verifyToken, async (req, res) => {
  try {
    const info = Number(req.params.id);
    const slokas = await balKand.find({ sarga: info }).limit(5);
      res.json(slokas); 
  } catch (error) {
      console.error('Error fetching slokas:', error);
      res.status(500).send('Internal Server Error');
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});