const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server Running at http://localhost:3000/`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//GET API :1 Returns a list of all the players in the player table

app.get("/players", async (request, response) => {
  const getAllPlayers = `
          SELECT * FROM player_details;
      `;

  const playersArray = await db.all(getAllPlayers);
  //   response.send(moviesArray);

  const playersObjects = [];
  for (let player of playersArray) {
    const playerObj = {
      playerId: player.player_id,
      playerName: player.player_name,
    };
    playersObjects.push(playerObj);
  }
  response.send(playersObjects);
});

//GET API : 2 Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
    * 
    FROM 
        player_details
    WHERE 
        player_id = ${playerId};`;

  const player = await db.get(getPlayerQuery);

  const playerObj = {
    playerId: player.player_id,
    playerName: player.player_name,
  };
  response.send(playerObj);
});

// Update API : 3 Updates the details of a specific player based on the player ID

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playersDetails = request.body;

  const { playerName } = playersDetails;

  const updatePlayerQuery = `
        UPDATE 
            player_details
        SET 
            player_name = '${playerName}'
        WHERE 
            player_id = ${playerId};
    `;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//GET API : 4 Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
    * 
    FROM 
        match_details
    WHERE 
        match_id = ${matchId};`;

  const match = await db.get(getMatchQuery);

  const matchObj = {
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  };
  response.send(matchObj);
});

// GET API : 5 Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
    SELECT 
    * 
    FROM 
        match_details INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id
    WHERE 
        player_match_score.player_id = ${playerId};`;

  const matchArray = await db.all(getMatchQuery);

  matchArrayObj = [];

  for (let item of matchArray) {
    const matchObj = {
      matchId: item.match_id,
      match: item.match,
      year: item.year,
    };
    matchArrayObj.push(matchObj);
  }

  response.send(matchArrayObj);
});

// GET API : 6 Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
    SELECT 
    * 
    FROM 
        player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
    WHERE 
        player_match_score.match_id = ${matchId};`;

  const playerArray = await db.all(getPlayerQuery);

  playerArrayObj = [];

  for (let item of playerArray) {
    const playerObj = {
      playerId: item.player_id,
      playerName: item.player_name,
    };
    playerArrayObj.push(playerObj);
  }

  response.send(playerArrayObj);
});

// GET API : 7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM 
        player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
    WHERE 
        player_details.player_id = ${playerId};`;

  const playerScoresArray = await db.get(getPlayerScoresQuery);

  response.send(playerScoresArray);
});

module.exports = app;
