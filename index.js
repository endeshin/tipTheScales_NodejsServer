const express = require('express');
const app = express();
const port = 8080;

var tempScore = 0;
let gamePoints = {
    score: 0,
    objectives: 0,
    objOne: {
        light: 45,
        dark: 80
    },
    objTwo: {
        light: 70,
        dark: 45
    }
}

// state middleman & listen on port
app.use(express.json())

app.listen(
    port,
    () => console.log("running.")
)

// Endpoints & functions
app.get('/', (res,req) => {
    res.statusCode(200).send(gamePoints)
})

app.post('/', (res,req) => {
    const {data} = req.body;

    //handle invalid formats + invalid values
    if (!data) {
        res.status(400).send('No data. No response.')
    } else if (data.score > 1 || data.score < -1) {
        res.status(410).send('Invalid score value. Only -1 to 1 is accessible.')
    }

    res.status(240).send(data);

})

app.get('/score', (res,req) => {
    var score = 0;
    res.statusCode(200).send(gamePoints);
})

// Functions
function countScore(struct) {
    var pointsLight = 0;
    var pointsDark = 0;
    var tempScore = struct.score;

    //per item, save the points
    for (var item in struct) {
        if (item.search('obj') != -1 && item != "objectives") {
            for (var key in struct[item]) {
                if (key === "light") {
                    pointsLight += struct[item][key];
                } else if (key === "dark") {
                    pointsDark += struct[item][key];
                }
            }
        }
    }

    // count the score
    console.log('Recounted score: ' + (pointsLight - pointsDark) / 100)
    return (pointsLight - pointsDark) / 100
}

countScore(gamePoints);