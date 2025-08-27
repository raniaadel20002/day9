const express = require('express');
const app = express();
const fs = require('fs');   
const usersData = require('./data/users.json');
const students = require('./data/students.json');
const bcrypt = require('bcrypt');
const path = require('path');

app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static(path.join(__dirname, 'public')));


app.get("/register", (req, res) => {
    res.render( "register.ejs" );
});

app.post("/register", async(req, res) => {
    const {firstName, lastName, username, age, email, password} = req.body;
    if (!firstName || !lastName || !username || !age ||!email || !password) {
        return res.json({message : "All inputs are required"});
    }

    const CheckUser = await usersData.find(u => u.username === username);
    console.log(CheckUser);

    if (CheckUser) {
        return res.json({message : "This email is already used"})
    }

//     const checkToken = await tokenData.findOne({username : username})
//     if (checkToken) {
//         return res.json({message : "This username is already used"})
//     }

    const hashPassword = await bcrypt.hash(password, 10);
    
    usersData.push({firstName,lastName,username,age,email,password : hashPassword})
    await usersData.save()
    return res.json({message : "User registered successfully"})
});


app.post("/login", (req, res) => {
    const { username, email, password } = req.body;
    if ((!username && !email) || !password) {
        return res.json({ error: "All fields are required" });
    }
    const user = users.find(user => user.username === username || user.email === email);
    if (!user) {
        return res.json({ error: "User not found" });
    }
    if (user.password !== password) {
        return res.json({ error: "Invalid password" });
    }
    res.json({ message: "User logged in successfully", user });
});

app.get('/logout'), async(req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.json({ error: "Username is required" });
    }

    // const checkToken = await tokenData.find(token => token.username === username);
    // if (!checkToken) {
    //     return res.json({ error: "Invalid username or expired token" });
    // }
    const user = users.find(user => user.username === username);
    if (!user) {
        return res.json({ error: "User not found" });
    }
    
    if (user){
        const username = username.deleteOne({username : username});
    }
    res.json({ message: "User logged out successfully" });
}

app.get('/add-student'), (req, res) => {
    res.render( "add-student.ejs" ,{page : "add-student", message : null});
}

app.post('/add-student'), (req, res) => {
    const { firstName, lastName, email, age, course, status } = req.body;
    if ( !firstName || !lastName || !email ||  !age || !course || !status) {
        return res.json({ error: "All fields are required" });
    }

    students.push(student);
    res.render("add-student.ejs" , {page : "add-student", message : addedSuccessfully});

    if (!student) {
        return res.json( "add-student.ejs" , {page : "add-student", message : "Student not found"} );
    }
}

app.get('/students'),(req, res) => {

    students = fs.readFile('students.json');
    students.filter = {firstName,lastName,email};
    res.render(students);
}

app.get('/users'), (req, res) => {

    users = fs.readFile('users.json');
    users.filter = {userName,fullName,email};
    res.render("manage-users.ejs" , {users :[{userName,fullName,email}]});
}

app.post('/users'), (req, res) => {
    
    const id = req.params.id;
    if (!id) {
        return res.json({ error: "ID is required" });
    }
    const user = users.find(user => user.id === id);
    if (!user) {
        return res.json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully", user });

}

app.put('edit-student/:id'), async(req, res) => {
    const id = req.params.id;
    const { name, age, status } = req.body;
    if (!name || !age || !status) {
        return res.json({ error: "All fields are required" });
    }
    const student = await students.find(student => student.id === id);
    if (!student) {
        return res.json({ error: "Student not found" });
    }
    student.name = name;
    student.age = age;
    student.status = status;
    res.json({ message: "Student updated successfully", student });
}



app.delete('/users/:id', async(req, res) => {
    const username = req.body.username;
    if (!username) {
        return res.json({ error: 'Username is required' });
    }
    // const checkToken = await tokenData.findOne({username : username})
    // if (!checkToken) {
    //     return res.json({ error: 'Invalid username or expired token' });
    // }

    const checkUser = await usersData.findOne({username})
    if (!checkUser) {
        return res.json({ error: 'User not found' });
    }
    await usersData.deleteOne({username :username})
    return res.json({message : "user deleted..."})
});


module.exports = app;