const express = require('express');
const app = express();
const port = 8080;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

let client_ids = {
    // ID: 'time of sending /reset request';
};

let simulation = false;

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

// Endpoints
app.post('/:id', (request, response) => {
    const { id } = request.params;
    const points = request.body;

    // Add client ID
    if (!clients_ids[id]) {
        // If id is not saved, alert the client.
        response.status(400).send("Unknown ID, please run /reset first!");
    } else {
        // If it's present, update time of triggering /reset
        clients_ids[id] = new Date();
    }

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

app.post('/reset/:id', (request, response) => {
    const { id } = request.params;
    const points = request.body;

    // Add client ID
    if (!client_ids[id]) {
        // Track the time of triggering /reset
        client_ids[id] = new Date();
    } else {
        // If it's present, update time of triggering /reset
        client_ids[id] = new Date();
    }

    //Throw error when objectives are not specified
    if (!points["objectives"]) {
        response.status(440).send({
            message: "No specified objectives."
        })
    }

    console.log('Resetting game points.\nCreating new Objective structs\n')

    // reset game points when requirements are met -> at least two clients and struckt having it filled.
    if (checkForObjectivesStructs(gamePoints) && Object.keys(removeInactiveClients).length >= 2) {
            gamePoints = {
                score: 0,
                objectives: points["objectives"]
            }
            createObjectiveStructs(gamePoints);
            console.log('Reset made by ID ' + id);
            simulation = false;

    } else if (Object.keys(removeInactiveClients).length < 2) {
        // If there is only one client, or other client no longerthrow simulation
            gamePoints = {
                score: 0,
                objectives: points["objectives"]
            }
            createObjectiveStructs(gamePoints);
            console.log('Reset made by ID ' + id + '\nBegining simulation.')
            simulation = true;
            //serverSimulate();

    }

    // call function to create structs for objectives
    response.send(gamePoints);
})

app.get('/sim', (request, response) => {
    response.send(simulation)
})

// Functions
function countScore(struct) {
    var pointsLight = 0;
    var pointsDark = 0;

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
    //save number of objectives needed
    var numObjs = struct['objectives'];
    let i = 1;

    // while loop to create the structs
    while (i <= numObjs) {
       let tempObj = new Object();
       tempObj.light = 0;
       tempObj.dark = 0;
       struct['obj' + i] = tempObj;
       i++;
    }

    //return the new struct
    console.log(struct)
    return struct
}

// Minor functions
function checkForObjectivesStructs(struct) {
    for (var item in struct) {
        if (item.search('obj') != -1 && item != "objectives") {
            if (struct[item]["light"] || struct[item]["dark"]
            ) {
                return true
            }
        }
    }
    return false
}

// check for clients' last time.
function removeInactiveClients(struct){
    var currentTime = new Date();
    
    // If the last request from client was 5 minutes ago, remove the client from client_ids.
    for (client in struct){
        if (((struct[client] - currentTime) / 60) >= -5001) {
            delete struct[client];
        }
    }
    return struct
}