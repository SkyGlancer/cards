import Phaser from "phaser";
import Game from "./scenes/game"
import io from 'socket.io-client';

let socket = io('http://35.244.33.191:3000');
//let socket = io('http://localhost:3000');

const config = {
    type: Phaser.CANVAS,
    parent: "phaser-example",
    width: 1680,
    height: 858,
    scene: [
        Game
    ]
};





// Sign In Page Elements
////////////////////////////////////////////////////////////////////////////
// Divs
let joinDiv = document.getElementById('join-game')
let joinErrorMessage = document.getElementById('error-message')
// Input Fields
let joinNickname = document.getElementById('join-nickname')
let joinRoom = document.getElementById('join-room')
let joinPassword = document.getElementById('join-password')
// Buttons
let joinEnter = document.getElementById('join-enter')
let joinCreate = document.getElementById('join-create')


// Game Page Elements
////////////////////////////////////////////////////////////////////////////
//
export class CardsGame extends Phaser.Game {
    constructor(config, socket, players) {
        super(config)
        this.socket = socket;
        this.players = players;
    }
  }



// UI Interaction with server
////////////////////////////////////////////////////////////////////////////
// User Joins Room
joinEnter.onclick = () => {       
  socket.emit('joinRoom', {
    nickname:joinNickname.value,
    room:joinRoom.value,
    password:joinPassword.value
  })
}
// User Creates Room
joinCreate.onclick = () => {      
  socket.emit('createRoom', {
    nickname:joinNickname.value,
    room:joinRoom.value,
    password:joinPassword.value
  })
}

socket.on('joinResponse', (data) =>{        // Response to joining room
  if(data.success){
    joinDiv.style.display = 'none'
    joinErrorMessage.innerText = ''

    const game = new CardsGame(config,socket, data.players);
  } else joinErrorMessage.innerText = data.msg
})

socket.on('createResponse', (data) =>{      // Response to creating room
  if(data.success){
    joinDiv.style.display = 'none'
    joinErrorMessage.innerText = ''

   const game = new CardsGame(config, socket, data.players);
  } else joinErrorMessage.innerText = data.msg
})




//game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;    game.scale.setScreenSize(true);

