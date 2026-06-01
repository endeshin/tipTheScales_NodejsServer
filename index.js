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
    if (!client_ids[id]) {
        // If id is not saved, alert the client.
        response.status(400).send({message: "Unknown ID, please run /reset/{yourID} first!"});
    } else {
        // If it's present, update time of triggering /reset
        client_ids[id] = new Date();
    }

    if (!points["score"]) {
        gamePoints["score"] = 0;
    }
    
    // Replace objectives values & kills
    for (var item in points) {
        if (item.search('obj') != -1 && item != "objectives") { //|| item == "kills"
            for (var key in points[item]) {
                if (points[item][key] != 0) {
                    gamePoints[item][key] = points[item][key]
                } 
            }
        }
    }

    // Replace kills

    // debug the points & send updated score back.
    console.log(points);
    console.log(client_ids);
    response.send(countScore(gamePoints));

})

app.post('/reset/:id', (request, response) => {
    const { id } = request.params;
    const points = request.body;

    response.setHeader('Content-Type', 'application/json');

    // Add client ID / update timestamp
    client_ids[id] = new Date();

    //Throw error when objectives are not specified
    if (!points["objectives"]) {
        response.status(400).send({
            message: "No specified objectives."
        })
    // If a client is not tracked when there are too many clients
    } else if (Object.keys(removeInactiveClients(client_ids)).length > 2 || !client_ids[id]) {
        response.status(400).send({message: "Too many clients. Allowed only 2 clients."});
        delete client_ids[id];
    }

    console.log('Resetting game points.\nCreating new Objective structs\n');

    // if there are two clients
    if (Object.keys(removeInactiveClients(client_ids)).length == 2) {
            if (checkForObjectivesStructs(gamePoints, points['objectives'])) {
                // If they match, reset the game points
                gamePoints = {
                    score: 0,
                    objectives: points["objectives"]
                }
                createObjectiveStructs(gamePoints);
                console.log('Reset made by ID ' + id);
                simulation = false;
                response.send(gamePoints);
            } else {
                // if they don't match, send an error.
                response.send({message: "Incorrect amount of objectives.", objectives: gamePoints['objectives']});
                delete client_ids[id];
            }

    // if there is only one client
    } else if (Object.keys(removeInactiveClients(client_ids)).length < 2) {
        // If there is only one client, or other client no longer, throw simulation
            gamePoints = {
                score: 0,
                objectives: points["objectives"]
            }
            createObjectiveStructs(gamePoints);
            console.log('Reset made by ID ' + id + '\nBegining simulation.')
            simulation = true;
            //serverSimulate();
            response.send(gamePoints);
    }

    //response.send(gamePoints);
    console.log(id);
    console.log(client_ids);
})

app.get('/status', (request, response) => {
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
function checkForObjectivesStructs(struct, objs) {
    i = 0;
    for (var item in struct) {
        if (item.search('obj') != -1 && item != "objectives") {
            i++;
        }
    }
    console.log(i, objs)
    return i == objs;
}

// check for clients' last time.
function removeInactiveClients(struct){
    var currentTime = new Date();
    
    // If the last request from client was 2 minutes ago, remove the client from client_ids.
    for (client in struct){
        if (((struct[client] - currentTime) / 60) <= -2001) {
            delete struct[client];
        }
    }

    //if there are no clients, reset the gamePoints
    if (!client_ids) {
        gamePoints = {
            score = 0,
            objectives = 0
        }
    }

    return struct
}


// Testing
app.get("/", (request, response) => {
    response.send('Hello.')
})