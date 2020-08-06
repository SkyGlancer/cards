import io from 'socket.io-client';
import Card from '../helpers/card';
import Dealer from "../helpers/dealer";
import Zone from '../helpers/zone';
import Deck from '../helpers/deck'
import Player from '../helpers/player'
export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: 'Game'
        });
    }

    preload() {

        let deck = new Deck();
        deck.cards.forEach(card => {
            this.load.image(card.imageUrl, card.imageUrl);
        });
        //this.load.image('cyanCardFront', 'src/assets/CyanCardFront.png');
        //this.load.image('cyanCardBack', 'src/assets/CyanCardBack.png');
        //this.load.image('magentaCardFront', 'src/assets/MagentaCardFront.png');
        //this.load.image('magentaCardBack', 'src/assets/MagentaCardBack.png');  
        this.standardCardBack = 'src/assets/standard_card_back_blue.png';
        this.load.image('src/assets/standard_card_back_blue.png', 'src/assets/standard_card_back_blue.png');
        this.canvas = this.sys.game.canvas;

    }

    create() {

        console.log("check");
        this.isPlayerA = false;
        this.opponentCards = [];
        this.zone = new Zone(this, this.canvas.width/2, this.canvas.height/3, this.canvas.width/2, this.canvas.height/3, { cards: 0 });
        this.dropZone = this.zone.zone;
        this.dealer = new Dealer();
        this.cardDealt = false;

        let self = this;

        this.socket = this.game.socket;
        let socket = this.socket;

        this.players = this.game.players;
        let players = this.players;
        this.showPlayers();


        this.socket.on('connect', function () {
            console.log('Connected!');
        });
        this.decks = [];
        
        let deck = new Deck();
        this.decks.push(deck);
                

        this.socket.on('isPlayerA', function () {
            self.isPlayerA = true;
        })

        this.socket.on('dealCards', function () {
            console.log('dealed')
            self.dealer.deal(self,deck);
            self.dealText.disableInteractive();
        })

        this.socket.on('cardPlayed', function (gameObject, isPlayerA) {
                /*let sprite = gameObject.textureKey;
                self.opponentCards.shift().destroy();
                self.dropZone.data.values.cards++;
                let card = new Card(self);
                card.show(self, ((self.dropZone.x - 350) + (self.dropZone.data.values.cards * 50)), (self.dropZone.y), sprite).disableInteractive();
             */
        })

        this.backupHand = [];
        this.gameObjectsOnTable = [];
        this.gameTableHidden = false;
        this.gameObjectsOnHandandTable = new Set();
        
        this.configureDealText(self);
        this.configureSuffleText(self);
        this.configureRevert(self);
        this.configureSubmitText(self);
        this.configurePickOneFromTableText(self);
        this.configurePickTwoFromTableText(self);
        this.configurePickFourFromTableText(self);
        this.configurePickAllFromTableText(self);
        this.configureShowLastText(self);
        this.configureNewGameText(self);
        this.configureHideTableText(self);
        this.configureShowTableText(self);
        this.configureSortText(self);

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX;
            gameObject.y = dragY;
        })

        this.input.on('dragstart', function (pointer, gameObject) {
            gameObject.setTint(0xff69b4);
            //self.children.bringToTop(gameObject);
        })

        this.input.on('dragend', function (pointer, gameObject, dropped) {
            gameObject.setTint();
            if (!dropped) {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }

        })

        this.input.on('drop', function (pointer, gameObject, dropZone) {
            dropZone.data.values.cards++;
            gameObject.x = (dropZone.x - 350) + (dropZone.data.values.cards * 25);
            gameObject.y = dropZone.y;
            gameObject.dragStartX = gameObject.input.dragStartX;
            gameObject.dragStartY = gameObject.input.dragStartY;
            gameObject.disableInteractive();
            //this.player.lastDealt = [];
            console.log("drop for player:" + self.player);
            self.player.currentDealt.push(gameObject);
            //remove this card from playerHand
            if(self.backupHand.length == 0) {
                self.backupHand = self.player.hand;
            }
            for( var i = 0; i < self.player.hand.length; i++){ 
                if ( self.player.hand[i].imageUrl == gameObject.card.imageUrl) { 
                    console.log("removing:" + self.player.hand[i].imageUrl);
                    self.player.hand.splice(i, 1); 
                }
            }
            console.log("hand: " + self.player.hand)
            console.log("currentDealt: " + self.player.currentDealt);
            console.log("lastDealt: " + self.player.lastDealt);

            //self.socket.emit('cardPlayed', gameObject, self.isPlayerA);
        })


        this.socket.on('gameState', (data) =>{           // Response to gamestate update
          console.log("gamestate : " + data);
          self.gameTableHidden = data.gameTableHidden;
          self.players = data.players;
          console.log("player data from server: " + data.player);
          self.player = JSON.parse(data.player);
          console.log("after update, player:" + self.player);
          self.cardsOnTable = JSON.parse(data.cardsOnTable);
          self.cardDealt = data.cardDealt;
          self.updateGame();
        });

        this.socket.on('showCards', (num) =>{    
            for(let i = 0; i<num; i++){
                self.gameObjectsOnTable[self.gameObjectsOnTable.length - i -1].card.show();
            }
        });
    }

    updateGame(){
        let self = this;
        this.gameObjectsOnHandandTable.forEach(gameObject => gameObject.destroy());
        this.gameObjectsOnHandandTable = [];
        console.log("updategame: cardsonTableandHand: " + this.gameObjectsOnHandandTable.length )
        this.gameObjectsOnTable= [];
        this.showPlayers();
        var i = 0
        this.player.hand.forEach(card => {
                console.log(card.imageUrl);
                var cardCopy = new Card(card.imageUrl, self.standardCardBack);
                self.gameObjectsOnHandandTable.push(cardCopy.render(self, 475 + (i * 25), 650));
                i++;
            });
        let dropZone = self.dropZone;
        dropZone.data.values.cards = 0;
        this.cardsOnTable.forEach(card => {      
            dropZone.data.values.cards++;
            var cardCopy = new Card(card.imageUrl, self.standardCardBack);
            let x = (dropZone.x - 350) + (dropZone.data.values.cards * 20);
            let y = dropZone.y;
            let gObject = cardCopy.render(self, x, y, card.imageUrl);
            self.gameObjectsOnHandandTable.push(gObject);
            self.gameObjectsOnTable.push(gObject);
            if(self.gameTableHidden) cardCopy.hide();

        });
    }

    showPlayers(){
        var players = " ";
        this.players.forEach(player => players = players + " Player Name: "  + player);
        this.add.text(0, 0, [players]).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
    }

    configureRevert(self) {
        this.revertText = this.add.text(20, 150, ['Revert last Move']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.revertText.on('pointerdown', function () {
            console.log("reverted");
            //add back to hand
            self.player.hand = self.backupHand;
            self.player.currentDealt.forEach(gameObject => {
                self.dropZone.data.values.cards--;
                gameObject.x = gameObject.dragStartX;
                gameObject.y = gameObject.dragStartY;
                gameObject.setInteractive();
            })
            self.player.currentDealt = [];
            console.log("hand: " + self.player.hand)
            console.log("currentDealt: " + self.player.currentDealt);
            console.log("lastDealt: " + self.player.lastDealt);
        });
        this.revertText.on('pointerover', function () {
            self.revertText.setColor('#ff69b4');
        })

        this.revertText.on('pointerout', function () {
            self.revertText.setColor('#00ffff');
        })
    }

    configureDealText(self){

        this.dealText = this.add.text(75, 750, ['DEAL CARDS']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();

        this.dealText.on('pointerdown', function () {
            console.log("clicked")
            self.socket.emit("dealCards");
        });

        this.dealText.on('pointerover', function () {
            self.dealText.setColor('#ff69b4');
        })

        this.dealText.on('pointerout', function () {
            self.dealText.setColor('#00ffff');
        })
        
    }

    configureSuffleText(self){
        this.suffleText = this.add.text(90, 50, ['SHUFFLE CARDS']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();

        this.suffleText.on('pointerdown', function () {
            console.log("suffletext")
            self.socket.emit("suffle");
        })

        this.suffleText.on('pointerover', function () {
            self.suffleText.setColor('#ff69b4');
        })

        this.suffleText.on('pointerout', function () {
            self.suffleText.setColor('#00ffff');
        })

        this.socket.on('suffle', function () {
            console.log('suffling')
            self.dealer.suffleOne(self,deck);
            self.dealText.setInteractive();

        })
    }

    configureSubmitText(self) {
        this.submitText = this.add.text(10, 100, ['Submit Hand']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.submitText.on('pointerdown', function () {
            console.log("submitted");

            var cardObjs = self.player.currentDealt;
            self.player.currentDealt = [];
            //change game object to cards
           
            cardObjs.forEach(gameObject => {
                self.player.currentDealt.push(gameObject.card);
            })
            
            console.log("hand: " + self.player.hand)
            console.log("currentDealt: " + self.player.currentDealt);
            console.log("lastDealt: " + self.player.lastDealt);
            self.socket.emit('cardPlayed', JSON.stringify(self.player));
        });
        this.submitText.on('pointerover', function () {
            self.submitText.setColor('#ff69b4');
        })

        this.submitText.on('pointerout', function () {
            self.submitText.setColor('#00ffff');
        })
    }

    configurePickAllFromTableText(self) {
        this.PickAllFromTable = this.add.text(30, 200, ['PickAllFromTable']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.PickAllFromTable.on('pointerdown', function () {
            console.log("picking all");
            self.socket.emit('pick', -1);
        });
        this.PickAllFromTable.on('pointerover', function () {
            self.submitText.setColor('#ff69b4');
        })

        this.PickAllFromTable.on('pointerout', function () {
            self.submitText.setColor('#00ffff');
        })
    }

    configureShowLastText(self){
        this.ShowLastText = this.add.text(30, 250, ['ShowLast']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.ShowLastText.on('pointerdown', function () {
            console.log("show last");
            self.socket.emit('showLast');
        });
        this.ShowLastText.on('pointerover', function () {
            self.submitText.setColor('#ff69b4');
        })

        this.ShowLastText.on('pointerout', function () {
            self.submitText.setColor('#00ffff');
        })
    }
    configurePickOneFromTableText(self) {
        this.PickOneFromTable = this.add.text(30, 300, ['PickOneFromTable']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.PickOneFromTable.on('pointerdown', function () {
            console.log("picking all");
            self.socket.emit('pick', 1);
        });
        this.PickOneFromTable.on('pointerover', function () {
            self.submitText.setColor('#ff69b4');
        })

        this.PickOneFromTable.on('pointerout', function () {
            self.submitText.setColor('#00ffff');
        })
    }

    configurePickTwoFromTableText(self) {
        this.PickTwoFromTable = this.add.text(30, 350, ['PickTwoFromTable']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.PickTwoFromTable.on('pointerdown', function () {
            console.log("picking all");
            self.socket.emit('pick', 2);
        });
        this.PickTwoFromTable.on('pointerover', function () {
            self.submitText.setColor('#ff69b4');
        })

        this.PickTwoFromTable.on('pointerout', function () {
            self.submitText.setColor('#00ffff');
        })
    }

    configurePickFourFromTableText(self) {
        this.PickFourFromTable = this.add.text(30, 400, ['PickFourFromTable']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.PickFourFromTable.on('pointerdown', function () {
            console.log("picking all");
            self.socket.emit('pick', 4);
        });
        this.PickFourFromTable.on('pointerover', function () {
            self.submitText.setColor('#ff69b4');
        })

        this.PickFourFromTable.on('pointerout', function () {
            self.submitText.setColor('#00ffff');
        })
    }

    configureNewGameText(self){
        this.NewGameText = this.add.text(30, 450, ['NewGame']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.NewGameText.on('pointerdown', function () {
            console.log("New Game");
            self.socket.emit('newGame');
        });
        this.NewGameText.on('pointerover', function () {
            self.submitText.setColor('#ff69b4');
        })

        this.NewGameText.on('pointerout', function () {
            self.submitText.setColor('#00ffff');
        })
    }
    
    configureHideTableText(self){
        this.HideTableText = this.add.text(30, 500, ['HideTable']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.HideTableText.on('pointerdown', function () {
            console.log("picking all");
            self.socket.emit('hideTable');
        });
        this.HideTableText.on('pointerover', function () {
            self.submitText.setColor('#ff69b4');
        })

        this.HideTableText.on('pointerout', function () {
            self.submitText.setColor('#00ffff');
        })
    }

    configureShowTableText(self){
        this.HideTableText = this.add.text(30, 550, ['ShowTable']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.HideTableText.on('pointerdown', function () {
            console.log("picking all");
            self.socket.emit('showTable');
        });
        this.HideTableText.on('pointerover', function () {
            self.submitText.setColor('#ff69b4');
        })

        this.HideTableText.on('pointerout', function () {
            self.submitText.setColor('#00ffff');
        })
    }

    configureSortText(self){
        this.SortText = this.add.text(30, 600, ['Sort']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.SortText.on('pointerdown', function () {
            console.log("sorting");
            self.socket.emit('sortHand');
        });
        this.SortText.on('pointerover', function () {
            self.submitText.setColor('#ff69b4');
        })

        this.SortText.on('pointerout', function () {
            self.submitText.setColor('#00ffff');
        })
    }
    
}
