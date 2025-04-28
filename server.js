require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('js'));
app.use(express.json());
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// MySQL Connection (Use the environment variables)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Connect to the MySQL database and log success or throw an error if connection fails
db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL Database!');
});

app.post('/submit-mbti', (req, res) => {
    const { mbti } = req.body;

    const descriptions = {
        'ENFP': 'ENFPs are enthusiastic, creative, and sociable...',
        'INTJ': 'INTJs are strategic, logical, and determined...',
    };

    const description = descriptions[mbti] || 'Description not available';

    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'User not logged in.' });
    }
    
    const updateQuery = 'UPDATE users SET mbti_result = ? WHERE id = ?';
    db.query(updateQuery, [mbti, req.session.userId], (err, result) => {
        if (err) {
            console.error('MySQL error: ', err);
            return res.status(500).json({ message: 'Database error. MBTI result not saved.' });
        }
        
        res.json({ mbti, description, message: 'MBTI result saved successfully!' });
    });
});

// Redirect from '/' to '/home'
app.get('/', (req, res) => {
    if (req.session.userId) {
        // User is logged in — check for MBTI result in DB
        const userId = req.session.userId;

        const query = 'SELECT mbti_result FROM users WHERE id = ?';
        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Internal server error');
            }

            if (results.length > 0 && results[0].mbti_result) {
                // User has an MBTI result, redirect to results page
                const mbti = results[0].mbti_result;
                return res.redirect(`/results?mbti=${mbti}`);
            } else {
                // No result yet, redirect to question 1
                return res.redirect('/test');
            }
        });
    } else {
        res.redirect('/home');
    }
});

// 'http://localhost:3000/home' = /home.html
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'home.html'));
});

// 'http://localhost:3000/intro' = /intro.html
app.get('/intro', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'intro.html'));
});

// 'http://localhost:3000/login' = /login.html
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'login.html'));
});

// 'http://localhost:3000/signup' = /signup.html
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'signup.html'));
});

// 'http://localhost:3000/test' = /test.html
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'test.html'));
});

app.get('/results', (req, res) => {
    const mbti = req.query.mbti;

    const descriptions = {
        // Introverted Personality Types
        'ISTJ': 'ISTJs are dependable and detail-oriented, with a strong focus on tradition and order. They excel at organizing and following through on tasks. However, they can be seen as rigid or inflexible, sometimes resisting change or new ideas in favor of established routines.',
        'ISFJ': 'ISFJs are caring and practical, with a deep sense of duty to others. They are often reliable and supportive, finding fulfillment in helping others and preserving tradition. However, they may struggle with assertiveness, leading them to suppress their own needs in favor of others.',
        'INFJ': 'INFJs are insightful and compassionate, driven by a desire to understand others and make a positive impact. They are highly intuitive and idealistic, often seeking meaning in everything they do. However, their tendency to internalize their feelings and idealize others can leave them feeling misunderstood or disillusioned.',
        'INTJ': 'INTJs are strategic and analytical, excelling at solving complex problems. Their strengths include independence, future planning, and logical decision-making. However, they can be seen as distant or overly critical due to their perfectionism and blunt communication.',
        'ISTP': 'ISTPs are analytical and adaptable, thriving in environments that require problem-solving and hands-on experience. They are independent and prefer to work autonomously, but can also be resourceful in dynamic situations. However, their tendency to focus on the present may cause them to neglect long-term planning or emotional expression.',
        'ISFP': 'ISFPs are gentle and artistic, driven by a deep appreciation for beauty and the present moment. They are often independent and enjoy exploring creative outlets. However, their desire for personal freedom and their aversion to conflict can lead to difficulty in making decisions or committing to long-term plans.',
        'INFP': 'INFPs are idealistic and empathetic, driven by a strong sense of personal values. They are creative and often seek deep, meaningful connections with others. However, their emotional sensitivity and tendency to idealize situations can sometimes lead to disappointment or frustration.',
        'INTP': 'INTPs are logical and curious, constantly seeking to understand how things work. They excel at abstract thinking and enjoy exploring complex theories. However, their focus on intellectual pursuits can sometimes cause them to neglect practical details or social interactions, leading to feelings of isolation.',

        // Extraverted Personality Types
        'ESTJ': 'ESTJs are organized and efficient, with a strong sense of responsibility and a natural ability to lead. They value structure and are often seen as pragmatic and logical. However, they can be perceived as overly rigid or controlling, struggling with flexibility or unconventional ideas.',
        'ESFJ': 'ESFJs are warm and sociable, with a strong desire to create harmony and build strong social connections. They are empathetic and enjoy helping others, often taking on a caretaking role. However, their focus on external approval and fear of conflict can lead to stress or difficulty with criticism.',
        'ENTJ': 'ENTJs are natural-born leaders, decisive and assertive. They excel at organizing people and resources to achieve their goals. Their strengths include logical decision-making and strategic planning. However, their focus on efficiency and results can sometimes make them seem blunt or overly demanding.',
        'ENFJ': 'ENFJs are charismatic and empathetic, with a natural ability to inspire and lead others. They focus on creating harmony and helping others reach their full potential. However, their strong desire to please others can sometimes cause them to neglect their own needs.',
        'ESTP': 'ESTPs are energetic and action-oriented, with a love for adventure and a talent for thinking on their feet. They thrive in fast-paced environments and enjoy solving problems as they arise. However, their focus on immediate results can sometimes make them reckless or impulsive, neglecting long-term consequences.',
        'ESFP': 'ESFPs are lively and spontaneous, with a strong desire to enjoy life to the fullest. They are fun-loving and social, often bringing energy and excitement to any group. However, they can sometimes be impulsive or easily distracted, preferring immediate enjoyment over careful planning or deeper reflection.',
        'ENFP': 'ENFPs are imaginative and enthusiastic, with a natural ability to inspire others and explore new possibilities. They are driven by curiosity and a desire for personal growth. However, their tendency to become easily distracted or overwhelmed by their many ideas can make it difficult for them to follow through on projects.',
        'ENTP': 'ENTPs are innovative and quick-thinking, thriving in environments that require creativity and problem-solving. They enjoy challenging ideas and are often seen as energetic conversationalists. However, their tendency to debate and challenge others can be perceived as argumentative or inconsiderate.'
    };

    const description = descriptions[mbti] || 'Description not available';
    res.render('results', {
        mbti: mbti,
        description: description,
        userId: req.session.userId
    });
});

app.get('/take-test-again', (req, res) => {
    const userId = req.session.userId;

    if (userId) {
        // Delete the user's MBTI result from the database
        const query = 'UPDATE users SET mbti_result = NULL WHERE id = ?';

        db.query(query, [userId], (err, result) => {
            if (err) {
                console.error('Error deleting MBTI result:', err);
                return res.status(500).send('Error deleting MBTI result');
            }

            console.log('MBTI result deleted successfully.');
            console.log('Personality test restarted.');
            
            req.session.mbti = null;

            // Redirect the user to the intro page to retake the test
            res.redirect('/intro');
        });
    } else {
        // If the user is not logged in, redirect to login page
        res.redirect('/login');
    }
});

// Sign Up Endpoint
app.post('/signup', async (req, res) => {
    const { username, pwd } = req.body;

    if (!username || !pwd) {
        return res.status(400).send('All fields are required');
    }

    try {
        const hashedPassword = await bcrypt.hash(pwd, 10);
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error creating account');
            }
            // After successful signup
            res.redirect('/login')
            console.log('Signup completed successfully.');
        });
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Log In Endpoint
app.post('/login', (req, res) => {
    const { username, pwd } = req.body;

    if (!username || !pwd) {
        return res.status(400).send('All fields are required');
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(pwd, user.password);
        if (!isMatch) {
            return res.status(401).send('Invalid credentials');
        }

        // After successful login
        req.session.userId = user.id;

        // If user already has results saved
        if (user.mbti_result) {
            console.log('Login completed successfully.');
            console.log('User already has test results saved.');
            return res.redirect(`/results?mbti=${user.mbti_result}`);
        } else {
            console.log('Login completed successfully.');
            return res.redirect('/intro');
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Logout failed');
        }
        res.redirect('/');
        console.log('Logout completed successfully.');
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
