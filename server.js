const bcrypt = require("bcrypt");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "Public")));

const SECRET = "novastack_secret";

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Public", "index.html"));
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

db.connect(err => {
  if (err) {
    console.error("❌ DB Connection Failed:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

function verifyToken(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ message: "No token" });

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name,email,password) VALUES (?,?,?)",
    [name, email, hashedPassword],
    (err) => {
      if (err) return res.json({ message: "Error", error: err });
      res.json({ message: "Signup success" });
    }
  );
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {
      if (err) return res.json({ message: "Error" });

      if (result.length > 0) {
        const valid = await bcrypt.compare(password, result[0].password);

        if (valid) {
          const token = jwt.sign({ id: result[0].id }, SECRET);
          res.json({ token, name: result[0].name });
        } else {
          res.json({ message: "Invalid" });
        }
      } else {
        res.json({ message: "Invalid" });
      }
    }
  );
});

app.post("/book", verifyToken, (req, res) => {
  const { service, type } = req.body;

  db.query(
    "INSERT INTO bookings (user_id,service,type) VALUES (?,?,?)",
    [req.user.id, service, type],
    (err) => {
      if (err) return res.json({ message: "Error booking" });
      res.json({ message: "Booked" });
    }
  );
});

app.get("/bookings", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM bookings WHERE user_id=?",
    [req.user.id],
    (err, result) => {
      if (err) return res.json({ message: "Error" });
      res.json(result);
    }
  );
});

app.get("/admin/bookings", (req, res) => {
  db.query(`
    SELECT bookings.*, users.name
    FROM bookings
    JOIN users ON bookings.user_id = users.id
  `, (err, result) => {
    if (err) return res.json({ message: "Error" });
    res.json(result);
  });
});

app.delete("/admin/delete/:id", (req, res) => {
  db.query(
    "DELETE FROM bookings WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.json({ message: "Error" });
      res.json({ message: "Deleted" });
    }
  );
});

app.put("/admin/update/:id", (req, res) => {
  const { service, type } = req.body;

  db.query(
    "UPDATE bookings SET service=?, type=? WHERE id=?",
    [service, type, req.params.id],
    (err) => {
      if (err) return res.json({ message: "Error" });
      res.json({ message: "Updated" });
    }
  );
});

db.query(`
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  password VARCHAR(255)
)
`);

db.query(`
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userEmail VARCHAR(100),
  service VARCHAR(100)
)
`);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
