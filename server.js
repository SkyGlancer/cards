const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http);
// Room class
// Live rooms will have a name and password and keep track of game options / players in room
class Room {
  constructor(name, pass){
    this.room = '' + name
    this.password = '' + pass
    this.players = {}
    this.playersArr = [];
    this.game = new Game()
    this.difficulty = 'normal'
    this.mode = 'casual'

    // Add room to room list
    ROOM_LIST[this.room] = this
  }
}

let SOCKET_LIST = {}
let ROOM_LIST = {}
let PLAYER_LIST = {}

class Player {
    constructor(nickname, room, socket){
        this.id = socket.id

        // If someone in the room has the same name, append (1) to their nickname
        let nameAvailable = false
        let nameExists = false;
        let tempName = nickname
        let counter = 0
        while (!nameAvailable){
          if (ROOM_LIST[room]){
            nameExists = false;
            for (let i in ROOM_LIST[room].players){
              if (ROOM_LIST[room].players[i].nickname === tempName) nameExists = true
            }
            if (nameExists) tempName = nickname + "(" + ++counter + ")"
            else nameAvailable = true
          }
        }
        this.nickname = tempName
        this.room = room
        this.timeout = 2100         // # of seconds until kicked for afk (35min)
        this.afktimer = this.timeout       
        this.hand = []; //cards in  his hands
        this.lastDealt = [];
        this.currentDealt = [];
        

        // Add player to player list and add their socket to the socket list
        PLAYER_LIST[this.id] = this
    }

    clear(){
      this.hand = []; //cards in  his hands
      this.lastDealt = [];
      this.currentDealt = [];
    }
}

class Game {
    constructor(){
        this.decks = [] ;
        this.decks.push(new Deck());
        this.decks.forEach(deck => deck.shuffle());
        this.cardsOnTable = [];
        this.cardDealt = false;
        this.gameTableHidden = false;
        //this.lastPlayer
    }
}

class Card {
    constructor(imageUrl, backImageUrl){
      this.imageUrl = imageUrl;
      this.backImageUrl = backImageUrl;
    }

    show(scene,x,y,sprite) {
         let card = scene.add.image(x, y, sprite).setScale(0.3, 0.3).setInteractive();
         scene.input.setDraggable(card);
         return card;   
    }
}

var sortCardFun = function compare_qty(a, b){
        if(a.imageUrl < b.imageUrl){
                return -1;
        // a should come after b in the sorted order
        }else if(a.imageUrl > b.imageUrl){
                return 1;
        // a and b are the same
        }else{
                return 0;
        }
      }

class Deck {
  
  constructor() {
    this.cards = [];
    this.drawnCards = [];
    var images = "10C.jpg 10H.jpg 2C.jpg 2H.jpg 3C.jpg 3H.jpg 4C.jpg 4H.jpg 5C.jpg 5H.jpg 6C.jpg 6H.jpg 7C.jpg 7H.jpg 8C.jpg 8H.jpg 9C.jpg 9H.jpg AC.jpg AH.jpg JC.jpg JH.jpg KC.jpg KH.jpg QC.jpg QH.jpg 10D.jpg 10S.jpg 2D.jpg 2S.jpg 3D.jpg 3S.jpg 4D.jpg 4S.jpg 5D.jpg 5S.jpg 6D.jpg 6S.jpg 7D.jpg 7S.jpg 8D.jpg 8S.jpg 9D.jpg 9S.jpg AD.jpg AS.jpg JD.jpg JS.jpg KD.jpg KS.jpg QD.jpg QS.jpg"
    var res = images.split(" ");
    var dir = "src/assets/playingCards/"
    this.size = 52;

    res.forEach( file => {
       this.cards.push(new Card(dir+file,'src/assets/standard_card_back_blue.png'));
    });
  }

  shuffle() {
    const { cards } = this;
    let m = cards.length, i;
    while (m) {
      i = Math.floor(Math.random() * m--);

      [cards[m], cards[i]] = [cards[i], cards[m]];
    }
    return this;
  }
  
  drawCard(){
      var tmp = this.cards.pop();
      this.drawnCards.push(tmp);
      return tmp;
  }

}


io.on('connection', function (socket) {
    SOCKET_LIST[socket.id] = socket;
    console.log('A user connected: ' + socket.id + "socket:" + socket);

    io.emit('serverStats', 
    {
        players: Object.keys(PLAYER_LIST).length,
        rooms: Object.keys(ROOM_LIST).length }
    ); 

    socket.on('createRoom', (data) => {createRoom(socket, data)})

    // Room Joining. Called when client attempts to join a room
   // Data: player nickname, room name, room password
    socket.on('joinRoom', (data) => {joinRoom(socket, data)})

    // Room Leaving. Called when client leaves a room
    socket.on('leaveRoom', () =>{leaveRoom(socket)})

    // Client Disconnect
    socket.on('disconnect', () => {socketDisconnect(socket)})
    
    // New Game. Called when client starts a new game
    socket.on('newGame', function(){
      let player = PLAYER_LIST[socket.id];    
        newGame(ROOM_LIST[player.room])
    })


    socket.on('dealCards', function () {
        let player = PLAYER_LIST[socket.id];    
        dealCards(ROOM_LIST[player.room])
        //socket.emit('dealCards');
    });

    socket.on('suffle', function () {
        let player = PLAYER_LIST[socket.id]; 
        ROOM_LIST[player.room].game.decks.forEach(deck => deck.shuffle());
    });

    socket.on('cardPlayed', function (playerJSON) {
        let player = JSON.parse(playerJSON);
        PLAYER_LIST[player.id].hand = player.hand;
        PLAYER_LIST[player.id].lastDealt = player.lastDealt;
        PLAYER_LIST[player.id].currentDealt = player.currentDealt;
        player.lastDealt.forEach(card => ROOM_LIST[player.room].game.cardsOnTable.push(card));
        ROOM_LIST[player.room].game.lastPlayer = player.id;
        gameUpdate(player.room);
    });

    socket.on('pick', function(number) {
        let player = PLAYER_LIST[socket.id]; 
        if(number == -1){
            console.log("pushing all from table" + ROOM_LIST[player.room].game.cardsOnTable + "to "+ player.hand)
            ROOM_LIST[player.room].game.cardsOnTable.forEach(card => player.hand.push(card));
            console.log(player.hand);
            ROOM_LIST[player.room].game.cardsOnTable = [];
        } else {
            for(let i=0; i<number; i++){
                player.hand.push(ROOM_LIST[player.room].game.cardsOnTable.pop());
            }
        }
        gameUpdate(player.room);

    });

    socket.on('showLast', function() {
        let player = PLAYER_LIST[socket.id]; 
        if(socket.id == ROOM_LIST[player.room].game.lastPlayer){
            showCards(player.room, player.lastDealt.length)
        }

    });

    socket.on('disconnect', function () {
        console.log('A user disconnected: ' + socket.id);
        //players = players.filter(player => player !== socket.id);
    });

    socket.on('sortHand', function(){
       let player = PLAYER_LIST[socket.id];
       player.hand.sort(sortCardFun);
       console.log("player id for sort" + player.id);
       gameUpdate(player.room, {'players' : [player.id]});
    });

    socket.on('hideTable', function() {
      let player = PLAYER_LIST[socket.id];
      ROOM_LIST[player.room].game.gameTableHidden = true;
      gameUpdate(player.room);
    });

    socket.on('showTable', function() {
      let player = PLAYER_LIST[socket.id];
      ROOM_LIST[player.room].game.gameTableHidden = false;
      gameUpdate(player.room);
    });

});


http.listen(3000,'0.0.0.0', function () {
    console.log('Server started!');
});



// Create room function
// Gets a room name and password and attempts to make a new room if one doesn't exist
// On creation, the client that created the room is created and added to the room
function createRoom(socket, data){
  let roomName = data.room.trim()     // Trim whitespace from room name
  let passName = data.password.trim() // Trim whitespace from password
  let userName = data.nickname.trim() // Trim whitespace from nickname

  if (ROOM_LIST[roomName]) {   // If the requested room name is taken
    // Tell the client the room arleady exists
    socket.emit('createResponse', {success:false, msg:'Room Already Exists'})
  } else {
    if (roomName === "") {    
      // Tell the client they need a valid room name
      socket.emit('createResponse', {success:false, msg:'Enter A Valid Room Name'})
    } else {
      if (userName === ''){
        // Tell the client they need a valid nickname
        socket.emit('createResponse', {success:false, msg:'Enter A Valid Nickname'})
      } else {    // If the room name and nickname are both valid, proceed
        new Room(roomName, passName)                          // Create a new room
        let player = new Player(userName, roomName, socket)   // Create a new player
        ROOM_LIST[roomName].players[socket.id] = player   
        ROOM_LIST[roomName].playersArr.push(socket.id);
            // Add player to room
        //player.joinTeam()                                     // Distribute player to team
        socket.emit('createResponse', {success:true, msg: "", players: [userName]})// Tell client creation was successful
        //gameUpdate(roomName)                                  // Update the game for everyone in this room
        logStats(socket.id + "(" + player.nickname + ") CREATED '" + ROOM_LIST[player.room].room + "'(" + Object.keys(ROOM_LIST[player.room].players).length + ")")
      }
    }
  }
}


// Join room function
// Gets a room name and poassword and attempts to join said room
// On joining, the client that joined the room is created and added to the room
function joinRoom(socket, data){
  let roomName = data.room.trim()     // Trim whitespace from room name
  let pass = data.password.trim()     // Trim whitespace from password
  let userName = data.nickname.trim() // Trim whitespace from nickname

  if (!ROOM_LIST[roomName]){
    // Tell client the room doesnt exist
    socket.emit('joinResponse', {success:false, msg:"Room Not Found"})
  } else {
    if (ROOM_LIST[roomName].password !== pass){ 
      // Tell client the password is incorrect
      socket.emit('joinResponse', {success:false, msg:"Incorrect Password"})
    } else {
      if (userName === ''){
        // Tell client they need a valid nickname
        socket.emit('joinResponse', {success:false, msg:'Enter A Valid Nickname'})
      } else {
        //room exist card already dealt  
          if(ROOM_LIST[roomName].game.cardDealt == true){
            socket.emit('joinResponse', {success:false, msg:'Game already in progress, ask members to start new Game'})
          } else {
          // If the room exists and the password / nickname are valid, proceed
          let player = new Player(userName, roomName, socket)   // Create a new player
          ROOM_LIST[roomName].players[socket.id] = player  
          ROOM_LIST[roomName].playersArr.push(socket.id);     // Add player to room
          //player.joinTeam()                                     // Distribute player to team
          let players = [];
          for(var key in ROOM_LIST[roomName].players) {players.push(ROOM_LIST[roomName].players[key].nickname)};

          socket.emit('joinResponse', {success:true, msg:"", players: players})   // Tell client join was successful
          gameUpdate(roomName)                                  // Update the game for everyone in this room
          // Server Log
          logStats(socket.id + "(" + player.nickname + ") JOINED '" + ROOM_LIST[player.room].room + "'(" + Object.keys(ROOM_LIST[player.room].players).length + ")")
        }
      }
    }
  }
}

// Leave room function
// Gets the client that left the room and removes them from the room's player list
function leaveRoom(socket){
  if (!PLAYER_LIST[socket.id]) return // Prevent Crash
  let player = PLAYER_LIST[socket.id]              // Get the player that made the request
  delete PLAYER_LIST[player.id]                    // Delete the player from the player list
  delete ROOM_LIST[player.room].players[player.id] // Remove the player from their room
  gameUpdate(player.room)                          // Update everyone in the room
  // Server Log
  logStats(socket.id + "(" + player.nickname + ") LEFT '" + ROOM_LIST[player.room].room + "'(" + Object.keys(ROOM_LIST[player.room].players).length + ")")
  
  // If the number of players in the room is 0 at this point, delete the room entirely
  if (Object.keys(ROOM_LIST[player.room].players).length === 0) {
    delete ROOM_LIST[player.room]
    logStats("DELETE ROOM: '" + player.room + "'")
  }
  socket.emit('leaveResponse', {success:true})     // Tell the client the action was successful
}

// Disconnect function
// Called when a client closes the browser tab
function socketDisconnect(socket){
  let player = PLAYER_LIST[socket.id] // Get the player that made the request
  delete SOCKET_LIST[socket.id]       // Delete the client from the socket list
  delete PLAYER_LIST[socket.id]       // Delete the player from the player list

  if(player){   // If the player was in a room
    delete ROOM_LIST[player.room].players[socket.id] // Remove the player from their room
    gameUpdate(player.room)                          // Update everyone in the room
    // Server Log
    logStats(socket.id + "(" + player.nickname + ") LEFT '" + ROOM_LIST[player.room].room + "'(" + Object.keys(ROOM_LIST[player.room].players).length + ")")
    
    // If the number of players in the room is 0 at this point, delete the room entirely
    if (Object.keys(ROOM_LIST[player.room].players).length === 0) {
      delete ROOM_LIST[player.room]
      logStats("DELETE ROOM: '" + player.room + "'")
    }
  }
  // Server Log
  logStats('DISCONNECT: ' + socket.id)
}


// Update the gamestate for every client in the room that is passed to this function
function gameUpdate(roomName, opts){
  let players = [];
  ROOM_LIST[roomName].playersArr.forEach(playerId => {
    console.log("playerId : " +playerId)
    players.push(PLAYER_LIST[playerId].nickname)
  });
  // Create data package to send to the client
  let gameState = {
    room: roomName,
    players: players,
    cardsOnTable: JSON.stringify(ROOM_LIST[roomName].game.cardsOnTable),
    cardDealt: ROOM_LIST[roomName].game.cardDealt,
    gameTableHidden: ROOM_LIST[roomName].game.gameTableHidden,
  }
  var playerObjs = ROOM_LIST[roomName].playersArr;
  if(opts != undefined && opts['players']) playerObjs = opts['players'];
  playerObjs.forEach(player => { // For everyone in the passed room// Add specific clients team info
    gameState.player = JSON.stringify(ROOM_LIST[roomName].players[player]);
    console.log("emmiting game state for player:" + player +" socket:" + SOCKET_LIST[player] + "gamestate player: " + gameState.player);
    console.log("gamestate cardsontable: " + gameState.cardsOnTable)
    SOCKET_LIST[player].emit('gameState', gameState)  // Pass data to the client
  });
}

function dealCards(room){
    var playerCount = 0;
    for(var key in room.players){ playerCount++; };
    console.log(playerCount +":playerCount");
    for(var key in room.players){
        room.game.decks.forEach(deck => {
            var handSize = parseInt(deck.size/playerCount);
            console.log("handsize: " + handSize + "deck size: " + deck.size);
            for (let i = 0; i < handSize; i++) {
               room.players[key].hand.push(deck.drawCard());
            }
        });
    }
    gameUpdate(room.room);
    room.game.cardDealt = true;
}

function showCards(roomName, cardSize){
    for (let player in ROOM_LIST[roomName].players){ // For everyone in the passed room// Add specific clients team info
        SOCKET_LIST[player].emit('showCards', cardSize)  // Pass data to the client
    }
}

function newGame(room){
  console.log("rooms" + room);
  for (let player in room.players){
    PLAYER_LIST[player].clear()
  }
  room.game = new Game();
  gameUpdate(room.room);
}


function logStats(addition){
  let inLobby = Object.keys(SOCKET_LIST).length - Object.keys(PLAYER_LIST).length
  let stats = '[R:' + Object.keys(ROOM_LIST).length + " P:" + Object.keys(PLAYER_LIST).length + " L:" + inLobby + "] "
  console.log(stats + addition)
}
