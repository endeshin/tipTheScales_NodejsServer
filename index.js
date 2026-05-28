const express = require('express');
const app = express();
const port = 8080;

var tempScore = 0;
let gamePoints = {
    score: 0,
    objectives: 2
}

// state middleman & listen on port
app.use(express.json())

app.listen(
    port,
    () => console.log("running.")
)

// Endpoints & functions
app.post('/', (request, response) => {
    const {data} = request.body;

    //handle invalid formats + invalid values
    if (!data) {
        response.status(400).send('No data. No response.')
    } else if (data.score > 1 || data.score < -1) {
        response.status(410).send('Invalid score value. Only -1 to 1 is accessible.')
    }

    response.status(240).send(data);

})

app.get('/score', (request, response) => {
    console.log('GET request on /score \nSending game points with updated score.')
    response.status(200).send(countScore(gamePoints));
})

app.post('/reset', (request, response) => {
    response.statusCode(240).send('Resetting game points.')
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
    var newScore = clamp((pointsLight - pointsDark) / 100, -1, 1)
    console.log('Recounted score: ' + newScore);
    struct['score'] = newScore;
    return struct
}

function createObjectiveStructs(struct) {
    var numObjs = struct['objectives'];
    let i = 1;
    while (i <= numObjs) {
       let tempObj = new Object();
       tempObj.light = 0;
       tempObj.dark = 0;
       struct['obj' + i] = tempObj;
       i++;
    }
    console.log(struct)
    return struct
}

createObjectiveStructs(gamePoints);