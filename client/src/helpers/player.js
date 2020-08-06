import io from 'socket.io-client';
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
}