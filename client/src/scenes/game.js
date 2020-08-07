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
        var images = "Blue_0.png Blue_6.png Blue_Skip.png Green_5.png Green_Reverse.png Red_4.png Red_Draw.png Yellow_1.png Yellow_7.png Blue_1.png Blue_7.png Green_0.png Green_6.png Green_Skip.png Red_5.png Red_Reverse.png Yellow_2.png Yellow_8.png Blue_2.png Blue_8.png Green_1.png Green_7.png Red_0.png Red_6.png Red_Skip.png Yellow_3.png Yellow_9.png Blue_3.png Blue_9.png Green_2.png Green_8.png Red_1.png Red_7.png Wild.png Yellow_4.png Yellow_Draw.png Blue_4.png Blue_Draw.png Green_3.png Green_9.png Red_2.png Red_8.png Wild_Draw.png Yellow_5.png Yellow_Reverse.png Blue_5.png Blue_Reverse.png Green_4.png Green_Draw.png Red_3.png Red_9.png Yellow_0.png Yellow_6.png Yellow_Skip.png"
        var res = images.split(" ");
        var dir = "src/assets/uno/"
        res.forEach( file => {
           this.load.image(dir+file,dir+file);
        });
        this.load.image('src/assets/uno/Deck.png', 'src/assets/uno/Deck.png');
        this.load.image('background','src/assets/Table_0.jpg');
        //this.load.image('cyanCardFront', 'src/assets/CyanCardFront.png');
        //this.load.image('cyanCardBack', 'src/assets/CyanCardBack.png');
        //this.load.image('magentaCardFront', 'src/assets/MagentaCardFront.png');
        //this.load.image('magentaCardBack', 'src/assets/MagentaCardBack.png');  
        this.standardCardBack = 'src/assets/standard_card_back_blue.png';
        this.load.image('src/assets/standard_card_back_blue.png', 'src/assets/standard_card_back_blue.png');
        this.canvas = this.sys.game.canvas;

    }

   update() {
        //console.log(this.cameras.main);
        var camera = this.cameras.main;
        if (this.game.input.activePointer.isDown) { 
            console.log("pointer down")
              if (this.game.origDragPoint) {    
                // move the camera by the amount the mouse has moved since last update
                var x = camera.x;
                var y = camera.y;
                //console.log(x + "" + y)
                x += -this.game.origDragPoint.x + this.game.input.activePointer.position.x;
                y += -this.game.origDragPoint.y + this.game.input.activePointer.position.y;
                camera.setPosition(x,y);
              }
              // set new drag origin to current position
              this.game.origDragPoint = this.game.input.activePointer.position.clone();
            }
            else {
              this.game.origDragPoint = null;
        }
    }

    create() {
        
        let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background')
        let scaleX = this.cameras.main.width / image.width
        let scaleY = this.cameras.main.height / image.height
        let scale = Math.max(scaleX, scaleY)
        image.setScale(scale).setScrollFactor(0)
        console.log("check");
        this.isPlayerA = false;
        this.opponentCards = [];
        this.zone = new Zone(this, this.canvas.width/2, this.canvas.height/3, this.canvas.width/2, this.canvas.height/3, { cards: 0 });
        this.dropZone = this.zone.zone;
        this.dealer = new Dealer();
        this.cardDealt = false;
        this.deckSize = 1;
        this.deck = []; //deck contains random card if available else null

        this.randomCard = null;
        this.showRandomCards = false;
        this.playerText = null;
        this.lastPlayer = null;

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
        
        this.configureAddStandardDeck(self);
        this.configureAddUnoDeck(self);
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
        this.configureMoveToDeck(self);
        this.ConfigureShowRandomFromDeck(self);
        this.ConfigureHideRandomFromDeck(self);
        this.ConfigureDrawFromDeck(self);
        this.configureAutoSubmitText(self);

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
            if(self.autoSubmit){
                self.submit();
            }

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
          self.deckSize = data.deckSize;
          self.lastPlayer = data.lastPlayer;
          console.log("random card" +data.randomCard);
          if(data.randomCard){
            self.randomCard = JSON.parse(data.randomCard);
          } else {
            self.randomCard = null;
          }

          self.showRandomCards = data.showRandomCards;
          self.autoSubmit = data.autoSubmit;
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
                self.gameObjectsOnHandandTable.push(cardCopy.render(self, 275 + (i * 30), 650));
                i++;
            });
        let dropZone = self.dropZone;
        dropZone.data.values.cards = 0;
        this.cardsOnTable.forEach(card => {      
            dropZone.data.values.cards++;
            var cardCopy = new Card(card.imageUrl, self.standardCardBack);
            let x = (dropZone.x - 350) + (dropZone.data.values.cards * 30);
            let y = dropZone.y;
            let gObject = cardCopy.render(self, x, y, card.imageUrl);
            self.gameObjectsOnHandandTable.push(gObject);
            self.gameObjectsOnTable.push(gObject);
            if(self.gameTableHidden) cardCopy.hide();

        });
        this.deck.forEach(card => card.gameObject.destroy());
        this.deck = [];
        if(this.randomCard){
            var cardCopy = new Card(this.randomCard.imageUrl, self.standardCardBack);
            cardCopy.render(self, 1300, 100, this.randomCard.imageUrl).disableInteractive();
            if(!this.showRandomCards) cardCopy.hide();
            this.deck.push(cardCopy);
        } 
    }

    showPlayers(){
        var players = " ";
        let self = this;
        this.players.forEach(player => {
            if(self.lastPlayer && self.lastPlayer == player) {
                players = players + " <<Player Name: "  + player +">> ";
            } else {
                players = players + " Player Name: "  + player;
            }
        });
        if(this.gameTableHidden) {
            players = players + " tablehidden"
        }
        if(this.autoSubmit){
            players = players + " autoSubmit : on"
        }
        if(this.playerText){
            this.playerText.setText(players);
        } else {
            this.playerText = this.add.text(0, 0, [players]).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff');
        }

        
    }

    
    

    configureAddStandardDeck(self){
        this.AddStandardDeck = this.add.text(30, 50, ['AddStandardDeck']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.AddStandardDeck.on('pointerdown', function () {
            console.log("AddStandardDeck");
            self.socket.emit('AddStandardDeck');
        });
        this.AddStandardDeck.on('pointerover', function () {
            self.AddStandardDeck.setColor('#ff69b4');
        })

        this.AddStandardDeck.on('pointerout', function () {
            self.AddStandardDeck.setColor('#00ffff');
        })
    }

    configureAddUnoDeck(self){
        this.AddUnoDeck = this.add.text(230, 50, ['AddUnoDeck']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.AddUnoDeck.on('pointerdown', function () {
            console.log("AddUnoDeck");
            self.socket.emit('AddUnoDeck');
        });
        this.AddUnoDeck.on('pointerover', function () {
            self.AddUnoDeck.setColor('#ff69b4');
        })

        this.AddUnoDeck.on('pointerout', function () {
            self.AddUnoDeck.setColor('#00ffff');
        })
    }

    configureSuffleText(self){
        this.suffleText = this.add.text(430, 50, ['SHUFFLE CARDS']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();

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

    }

    configureDealText(self){

        this.dealText = this.add.text(630, 50, ['DEAL CARDS']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();

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

    configureNewGameText(self){
        this.NewGameText = this.add.text(830, 50, ['NewGame']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.NewGameText.on('pointerdown', function () {
            console.log("New Game");
            self.socket.emit('newGame');
        });
        this.NewGameText.on('pointerover', function () {
            self.NewGameText.setColor('#ff69b4');
        })

        this.NewGameText.on('pointerout', function () {
            self.NewGameText.setColor('#00ffff');
        })
    }

    configureSubmitText(self) {
        this.submitText = this.add.text(30, 75, ['Submit Hand']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.submitText.on('pointerdown', function () {
            console.log("submitted");
            self.submit(this)
        });
        this.submitText.on('pointerover', function () {
            self.submitText.setColor('#ff69b4');
        })

        this.submitText.on('pointerout', function () {
            self.submitText.setColor('#00ffff');
        })
    }

    submit(){
            var self = this;
            var cardObjs = self.player.currentDealt;
            self.player.currentDealt = [];
            self.backupHand = [];
            //change game object to cards
           
            cardObjs.forEach(gameObject => {
                self.player.currentDealt.push(gameObject.card);
            })
            
            console.log("hand: " + self.player.hand)
            console.log("currentDealt: " + self.player.currentDealt);
            console.log("lastDealt: " + self.player.lastDealt);
            self.socket.emit('cardPlayed', JSON.stringify(self.player));
    }

    configureRevert(self) {
        this.revertText = this.add.text(230, 75, ['Revert last Move']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.revertText.on('pointerdown', function () {
            console.log("reverted");
            //add back to hand
            if(self.self.player.currentDealt.length>0){
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
           }
        });
        this.revertText.on('pointerover', function () {
            self.revertText.setColor('#ff69b4');
        })

        this.revertText.on('pointerout', function () {
            self.revertText.setColor('#00ffff');
        })
    }

    configureSortText(self){
        this.SortText = this.add.text(430, 75, ['Sort']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.SortText.on('pointerdown', function () {
            console.log("sorting");
            self.socket.emit('sortHand');
        });
        this.SortText.on('pointerover', function () {
            self.SortText.setColor('#ff69b4');
        })

        this.SortText.on('pointerout', function () {
            self.SortText.setColor('#00ffff');
        })
    }

    configureMoveToDeck(self){
        this.MoveToDeck = this.add.text(630, 75, ['MoveToDeck']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.MoveToDeck.on('pointerdown', function () {
            console.log("MoveToDeck");
            self.socket.emit('MoveToDeck');
        });
        this.MoveToDeck.on('pointerover', function () {
            self.MoveToDeck.setColor('#ff69b4');
        })

        this.MoveToDeck.on('pointerout', function () {
            self.MoveToDeck.setColor('#00ffff');
        })
    }

    configureShowLastText(self){
        this.ShowLastText = this.add.text(830, 75, ['ShowLast']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.ShowLastText.on('pointerdown', function () {
            console.log("show last");
            self.socket.emit('showLast');
        });
        this.ShowLastText.on('pointerover', function () {
            self.ShowLastText.setColor('#ff69b4');
        })

        this.ShowLastText.on('pointerout', function () {
            self.ShowLastText.setColor('#00ffff');
        })
    }

    configurePickAllFromTableText(self) {
        this.PickAllFromTable = this.add.text(30, 100, ['PickAllFromTable']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.PickAllFromTable.on('pointerdown', function () {
            console.log("picking all");
            self.socket.emit('pick', -1);
        });
        this.PickAllFromTable.on('pointerover', function () {
            self.PickAllFromTable.setColor('#ff69b4');
        })

        this.PickAllFromTable.on('pointerout', function () {
            self.PickAllFromTable.setColor('#00ffff');
        })
    }

    
    configurePickOneFromTableText(self) {
        this.PickOneFromTable = this.add.text(230, 100, ['PickOneFromTable']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.PickOneFromTable.on('pointerdown', function () {
            console.log("picking all");
            self.socket.emit('pick', 1);
        });
        this.PickOneFromTable.on('pointerover', function () {
            self.PickOneFromTable.setColor('#ff69b4');
        })

        this.PickOneFromTable.on('pointerout', function () {
            self.PickOneFromTable.setColor('#00ffff');
        })
    }

    configurePickTwoFromTableText(self) {
        this.PickTwoFromTable = this.add.text(430, 100, ['PickTwoFromTable']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.PickTwoFromTable.on('pointerdown', function () {
            console.log("picking all");
            self.socket.emit('pick', 2);
        });
        this.PickTwoFromTable.on('pointerover', function () {
            self.PickTwoFromTable.setColor('#ff69b4');
        })

        this.PickTwoFromTable.on('pointerout', function () {
            self.PickTwoFromTable.setColor('#00ffff');
        })
    }

    configurePickFourFromTableText(self) {
        this.PickFourFromTable = this.add.text(630, 100, ['PickFourFromTable']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.PickFourFromTable.on('pointerdown', function () {
            console.log("picking all");
            self.socket.emit('pick', 4);
        });
        this.PickFourFromTable.on('pointerover', function () {
            self.PickFourFromTable.setColor('#ff69b4');
        })

        this.PickFourFromTable.on('pointerout', function () {
            self.PickFourFromTable.setColor('#00ffff');
        })
    }

    configureAutoSubmitText(self) {
        this.AutoSubmitText = this.add.text(830, 100, ['AutoSubmit']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.AutoSubmitText.on('pointerdown', function () {
            console.log("autoSubmit all");
            self.socket.emit('autoSubmit');
        });
        this.AutoSubmitText.on('pointerover', function () {
            self.AutoSubmitText.setColor('#ff69b4');
        })

        this.AutoSubmitText.on('pointerout', function () {
            self.AutoSubmitText.setColor('#00ffff');
        })
    }

    
    
    configureHideTableText(self){
        this.HideTableText = this.add.text(30, 125, ['HideTable']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.HideTableText.on('pointerdown', function () {
            console.log("picking all");
            self.socket.emit('hideTable');
        });
        this.HideTableText.on('pointerover', function () {
            self.HideTableText.setColor('#ff69b4');
        })

        this.HideTableText.on('pointerout', function () {
            self.HideTableText.setColor('#00ffff');
        })
    }

    configureShowTableText(self){
        this.ShowTableText = this.add.text(230, 125, ['ShowTable']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.ShowTableText.on('pointerdown', function () {
            console.log("picking all");
            self.socket.emit('showTable');
        });
        this.ShowTableText.on('pointerover', function () {
            self.ShowTableText.setColor('#ff69b4');
        })

        this.ShowTableText.on('pointerout', function () {
            self.ShowTableText.setColor('#00ffff');
        })
    }

    

    ConfigureShowRandomFromDeck(self){
        this.RandomFromDeck = this.add.text(430, 125, ['ShowRandomFromDeck']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.RandomFromDeck.on('pointerdown', function () {
            console.log("RandomFromDeck");
            self.socket.emit('RandomFromDeck');
        });
        this.RandomFromDeck.on('pointerover', function () {
            self.RandomFromDeck.setColor('#ff69b4');
        })

        this.RandomFromDeck.on('pointerout', function () {
            self.RandomFromDeck.setColor('#00ffff');
        })
    }

    ConfigureHideRandomFromDeck(self){
        this.HideRandomFromDeck = this.add.text(630, 125, ['HideRandomFromDeck']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.HideRandomFromDeck.on('pointerdown', function () {
            console.log("HideRandomFromDeck");
            self.socket.emit('HideRandomFromDeck');
        });
        this.HideRandomFromDeck.on('pointerover', function () {
            self.HideRandomFromDeck.setColor('#ff69b4');
        })

        this.HideRandomFromDeck.on('pointerout', function () {
            self.HideRandomFromDeck.setColor('#00ffff');
        })
    }

    ConfigureDrawFromDeck(self){
        this.DrawFromDeck = this.add.text(830, 125, ['DrawFromDeck']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.DrawFromDeck.on('pointerdown', function () {
            console.log("DrawFromDeck");
            self.socket.emit('DrawFromDeck');
        });
        this.DrawFromDeck.on('pointerover', function () {
            self.DrawFromDeck.setColor('#ff69b4');
        })

        this.DrawFromDeck.on('pointerout', function () {
            self.DrawFromDeck.setColor('#00ffff');
        })
    }

    
}
