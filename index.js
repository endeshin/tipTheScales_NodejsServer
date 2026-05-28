const express = require('express');
const app = express();
const port = 8080;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

//var client_ids = [] -> for simulation
var tempScore = 0;
let gamePoints = {
    score: 0,
    objectives: 0
}

// listen on port
app.listen(
    port,
    () => console.log("running.")
)

// state middleman
app.use( express.json() )

// Endpoints & functions
app.post('/', (request, response) => {
    const { points } = request.body;

    if (!points["score"]) {
        gamePoints["score"] = 0;
    }
    
    // Replace objectives values
    for (var item in points) {
        if (item.search('obj') != -1 && item != "objectives") {
            for (var key in points[item]) {
                if (points[item][key] != 0) {
                    gamePoints[item][key] = points[item][key]
                } 
            }
        }
    }

    // debug the points & send updated score back.
    console.log(points);
    response.send(countScore(gamePoints));

})

app.post('/reset', (request, response) => {
    // const { id } = request.params;
    const { points } = request.body;

    // if (id not in clients_ids) {clients_ids.push(id);}

    if (!points["objectives"]) {
        response.status(440).send({
            message: "No specified objectives."
        })
    }

    // reset game points
    gamePoints = {
        score: 0,
        objectives: points["objectives"]
    }

    // call function to create structs for objectives
    createObjectiveStructs(gamePoints);
    console.log('Resetting game points.\nCreating new Objective structs\n')
    response.send(gamePoints)
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
    var newScore = parseFloat(clamp((pointsLight - pointsDark) / 100, -1, 1).toFixed(2));
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

// Minor functions
function checkForObjectivesStructs(struct) {
    for (var item in struct) {
        if (item.search('obj') != -1 && item != "objectives") {
            if (struct[item][light] || struct[item][dark]
            ) {
                return true
            }
        }
    }
    return false
}

function checkClients(ids) {
    
}