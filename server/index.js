const express = require ("express");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) =>{
    res.send("Interview Platform Server is Running");
});

app.get("/interviews", (req, res) => {
    res.json({
        message: "Interview fetched succesfully",
        interview: {
            id: 1,
            role: "Software Engineer",
            mode: "Coding Round"
        }
    });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
