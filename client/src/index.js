import io from 'socket.io-client';
import {calculateCoords} from './helpers/cardsHelper';

//const server = 'http://10.0.2.2:3000';
const server = 'http://35.244.33.191:3000';
//let socket = io('http://35.244.33.191:3000');
let socket = io(server);

//preload images
function preloadimages(){
  var images = "10C.jpg 10H.jpg 2C.jpg 2H.jpg 3C.jpg 3H.jpg 4C.jpg 4H.jpg 5C.jpg 5H.jpg 6C.jpg 6H.jpg 7C.jpg 7H.jpg 8C.jpg 8H.jpg 9C.jpg 9H.jpg AC.jpg AH.jpg JC.jpg JH.jpg KC.jpg KH.jpg QC.jpg QH.jpg 10D.jpg 10S.jpg 2D.jpg 2S.jpg 3D.jpg 3S.jpg 4D.jpg 4S.jpg 5D.jpg 5S.jpg 6D.jpg 6S.jpg 7D.jpg 7S.jpg 8D.jpg 8S.jpg 9D.jpg 9S.jpg AD.jpg AS.jpg JD.jpg JS.jpg KD.jpg KS.jpg QD.jpg QS.jpg"
  var res = images.split(" ");
  var dir = "playingCards/";
  var image;
  res.forEach(file => {
    image = new Image();
    image.src = server + '/' +  dir + file;
  })
  image = new Image();
  image.src = server + '/' + 'standard_card_back_blue.png';

  images = "Blue_0.png Blue_6.png Blue_Skip.png Green_5.png Green_Reverse.png Red_4.png Red_Draw.png Yellow_1.png Yellow_7.png Blue_1.png Blue_7.png Green_0.png Green_6.png Green_Skip.png Red_5.png Red_Reverse.png Yellow_2.png Yellow_8.png Blue_2.png Blue_8.png Green_1.png Green_7.png Red_0.png Red_6.png Red_Skip.png Yellow_3.png Yellow_9.png Blue_3.png Blue_9.png Green_2.png Green_8.png Red_1.png Red_7.png Wild.png Yellow_4.png Yellow_Draw.png Blue_4.png Blue_Draw.png Green_3.png Green_9.png Red_2.png Red_8.png Wild_Draw.png Yellow_5.png Yellow_Reverse.png Blue_5.png Blue_Reverse.png Green_4.png Green_Draw.png Red_3.png Red_9.png Yellow_0.png Yellow_6.png Yellow_Skip.png"
  res = images.split(" ");
  dir = "uno/"
  res.forEach(file => {
    image = new Image();
    image.src = server + '/' +  dir + file;
  })
  image = new Image();
  image.src = server + '/' + 'uno/Deck.png';
}

//imageUrls.push('table.jpg');
//imageUrls.push('background.jpg')

preloadimages();

const config = {
    width: 1680,
    height: 858,
    mobilewidth: 700,
 
};




// Sign In Page Elements
////////////////////////////////////////////////////////////////////////////
// Divs
let joinDiv = document.getElementById('join-game')
let joinErrorMessage = document.getElementById('error-message')
let gameDiv = document.getElementById('game')
// Input Fields
let joinNickname = document.getElementById('join-nickname')
let joinRoom = document.getElementById('join-room')
let joinPassword = document.getElementById('join-password')
// Buttons
let joinEnter = document.getElementById('join-enter')
let joinCreate = document.getElementById('join-create')
let AddStandardDeck = document.getElementById('AddStandardDeck');
let DealCards = document.getElementById('DealCards');

//zone
let zone = document.getElementById('drop-zone');
let handZone = document.getElementById('hand-zone');
////console.log(myimages['table.jpg'].src)
//zone.style.backgroundImage = "url(" + myimages['table.jpg'].src + ")";

//var image = document.images[0];
var downloadingImage = new Image();
downloadingImage.onload = function(){
  console.log("image loaded");
    document.body.style.backgroundImage = "url(" + server + '/'+ "background.jpg" +")";   
};
downloadingImage.src = server + '/'+ "background.jpg" ;

// Game Page Elements
////////////////////////////////////////////////////////////////////////////
let backupHand = [];
let gameObjectsOnTable = [];
let gameTableHidden = false;
let gameObjectsOnHandandTable = new Set();
let players = null
let playerCardsNum = [];
let player = null;
let autoSubmit = false;
let showRandomCards = false;
let deckSize = 0;
let cardsOnTable = null;
let cardDealt = null;
let  lastPlayer = null;
let random = null;
let randomCard = null;
//let cardHelper = new CardsHelper();
//
newGame();


/*
//screem size handling
var sheight = $(window).height();
var swidth = $(window).width();
if(swidth<config.width/3){
  $('#drop-zone').css("left","0px");
  $('#hand-zone').css("left","0px");
  $('#hand-zone-control').css("left", "100px");
  $('#deck').css("left","0px");
  $('#deck').css("top","858px");
  $('#players').css("top","200px");
  $('#playercircle').css("top","0px");

}
*/
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
    gameDiv.style.display = 'block'
    players = data.players;
    players.forEach(player => playerCardsNum.push(0));
     showPlayers();
    //const game = new CardsGame(config,socket, data.players);
  } else joinErrorMessage.innerText = data.msg
})

socket.on('createResponse', (data) =>{      // Response to creating room
  if(data.success){
    joinDiv.style.display = 'none'
    joinErrorMessage.innerText = ''
    gameDiv.style.display = 'block'
    players = data.players;
    players.forEach(player => playerCardsNum.push(0));
    showPlayers();
   //const game = new CardsGame(config, socket, data.players);
  } else joinErrorMessage.innerText = data.msg
})

$( "#slider" ).slider({
   orientation:"horizontal",
   value:13,
   slide: function( event, ui ) {
      $("#hand-zone").each(function () {fan($(this)); });
   }  
});

$( "#slider" ).hide();
//game buttons
AddStandardDeck.onclick = () => {
  $('#AddUnoDeck').hide();
  //console.log("AddStandardDeck")
  socket.emit('AddStandardDeck');
}
DealCards.onclick = () => {
  //console.log("DealCards")
  socket.emit("dealCards");
}
AddUnoDeck.onclick = () => {
  $('#AddStandardDeck').hide();
  //console.log("AddUnoDeck")
  socket.emit('AddUnoDeck');
}
ShuffleCards.onclick = () => {
  //console.log("suffle")
  socket.emit('suffle');
}

SubmitHand.onclick = () => {
  //console.log("submit")
  submit();
}
Sort.onclick = () => {
   socket.emit('sortHand');
}
MoveToDeck.onclick = () => {
   socket.emit('MoveToDeck');
}
ShowLast.onclick = () => {
   socket.emit('showLast');
}
AutoSubmit.onclick = () => {
   socket.emit('autoSubmit');
}
HideTable.onclick = () => {
   socket.emit('hideTable');
}
ShowTable.onclick = () => {
   socket.emit('showTable');
}
ShowRandom.onclick = () => {
   socket.emit('RandomFromDeck');
}
HideRandom.onclick = () => {
   socket.emit('HideRandomFromDeck');
}
DrawFromDeck.onclick = () => {
   socket.emit('DrawFromDeck');
}
Revert.onclick = () => {
   socket.emit('revert');
}
NewGame.onclick = () => {
  socket.emit('newGame');
   newGame();
}

PickAll.onclick = () => {
  socket.emit('pick',-1);
}

function newGame() {
  
  $('#AddStandardDeck').show();
  $('#AddUnoDeck').show();
  hideDeckControls();
}

function hideDeckControls(){
  $('#DealCards').hide()
  $('#ShuffleCards').hide();
  $('#ShowRandom').hide();
  $('#HideRandom').hide();
  $('#DrawFromDeck').hide();
}

function showDeckControls(){
  $('#DealCards').show()
  $('#ShuffleCards').show();
  $('#ShowRandom').show();
  $('#HideRandom').show();
  $('#DrawFromDeck').show();
}
socket.on('showCards', (num) =>{    
    showCards(num);
});

function showCards(num) {
    var gameObjectsOnTable = $('#drop-zone-unstacked').children();
    //console.log($('#drop-zone-unstacked').children())
    for(let i = 0; i<num; i++){
        //console.log("gameObjectsOnTable");
        //console.log(gameObjectsOnTable);
        gameObjectsOnTable[gameObjectsOnTable.length - i -1].src = server + "/" + gameObjectsOnTable[gameObjectsOnTable.length - i -1].card.imageUrl;
    }
}

var playersOld = [];
//server responses
socket.on('gameState', (data) =>{           // Response to gamestate update
  ////console.log("gamestate : " + data);
  gameTableHidden = data.gameTableHidden;
  players = data.players;
  ////console.log("player data from server: " + data.player);
  player = JSON.parse(data.player);
  ////console.log("after update, player:" + player);
  cardsOnTable = JSON.parse(data.cardsOnTable);
  cardDealt = data.cardDealt;
  deckSize = data.deckSize;
  lastPlayer = data.lastPlayer;
  ////console.log("random card" +data.randomCard);
  if(data.randomCard){
    randomCard = JSON.parse(data.randomCard);
  } else {
    randomCard = null;
  }

  showRandomCards = data.showRandomCards;
  autoSubmit = data.autoSubmit;
  playerCardsNum = data.playerCardsNum;
  updateGame();
});


//document.body.style.transform = 'scale(' + window.screen.availHeight/2 + ')';
$(window).on("deviceorientation", function( event ) {
    if (window.matchMedia("(orientation: portrait)").matches) {

      $("#hand-zone").each(function () {fan($(this)); });
    }
    if (window.matchMedia("(orientation: landscape)").matches) {
      $("#hand-zone").each(function () {fan($(this)); });
    }
  });


$('#send-message-form').on('submit', function (event) {
    event.preventDefault();
    var sendObj = {};
    sendObj.msg = "<strong>" + joinNickname.value +"</strong>" + ": " + $('#msginput').val();
    console.log(sendObj.msg);
    var date = new Date();
    var time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    sendObj.dt = time;
    var msg = document.createElement("div");
    msg.setAttribute("class", "message");
    
    var dt = document.createElement("div");
    dt.setAttribute("class", "datetime");
    dt.innerHTML = sendObj.dt;

    message.appendChild(dt);
    msg.innerHTML = sendObj.msg;
    msg.appendChild(dt);    
    $('#chat-container').append(msg);
    var objDiv = document.getElementById('chat-container');
    objDiv.scrollTop = objDiv.scrollHeight;
    $('#msginput').val('');
    socket.emit("sendMessage", sendObj);
  });


socket.on("recieveMessage", (data) => {

    var msg = document.createElement("div");
    msg.setAttribute("class", "message");
    
    var dt = document.createElement("div");
    dt.setAttribute("class", "datetime");
    dt.innerHTML = data.dt;

    message.appendChild(dt);
    msg.innerHTML = data.msg;
    msg.appendChild(dt);    
    $('#chat-container').append(msg);
    var objDiv = document.getElementById('chat-container');
    objDiv.scrollTop = objDiv.scrollHeight;
    //$('#msginput').val('');
});


function updateGame() {
    $('#drop-zone-current').empty();
    $("#drop-zone-stacked").empty();
    $("#drop-zone-unstacked").empty();
    $('#random-card').empty();
    if(player.updateHand){
      $('#hand-zone').empty();
      player.hand.forEach(card => {
          ////console.log(card.imageUrl);
          var elem = document.createElement("img");
          //console.log(card.imageUrl);
          elem.setAttribute("class", "card");
          elem.src = server + "/" + card.imageUrl;
          $('#hand-zone').append(elem);
          elem.card = card;
          
      });
      $("#hand-zone").each(function () {fan($(this)); });
      setupHand();
      player.updateHand = false;
    }
    for(var stacked =0 ; stacked < cardsOnTable.length ; stacked++){
        ////console.log("unstacked")
        var card = cardsOnTable[stacked];
        var elem = document.createElement("img");
        //console.log(card.imageUrl);
        elem.setAttribute("class", "card");
        var image = (!gameTableHidden) ? card.imageUrl : card.backImageUrl;
        elem.src = server + "/" + image;
        elem.card = card;
        $('#drop-zone-unstacked').append(elem);
    }
    $("#drop-zone-unstacked").each(function () { hand($(this)); });
    if(randomCard){
        var elem = document.createElement("img");
        //console.log(randomCard.imageUrl);
        elem.setAttribute("class", "card");
        var image = showRandomCards ? randomCard.imageUrl : randomCard.backImageUrl;
        elem.src =  server + "/" + image;
        elem.card = randomCard;
        $('#random-card').append(elem);
        hand($('#random-card'));
        showDeckControls();
    } else {
      hideDeckControls();
    }
    console.log("new players")
    if(players != playersOld){
      console.log("new players")
      showPlayers();
    }
    
    //$("#random-card").each(function () { hand($(this)); });
    
}

function showPlayers(){
  if(gameTableHidden){
    $('#HideTable').hide();
    $('#ShowTable').show();
  } else {
    $('#HideTable').show();
    $('#ShowTable').hide();
  }
  if(randomCard){
    if(showRandomCards){
      $('#ShowRandom').hide();
      $('#HideRandom').show();
    } else {
      $('#ShowRandom').show();
      $('#HideRandom').hide();
    }
  }
  var btn = document.getElementById("AutoSubmit");
  if(autoSubmit){
    console.log("autoSubmit")
    btn.innerHTML  = "AutoSubmit: ON";
  } else {
    btn.innerHTML  = "AutoSubmit: OFF";
  }

  $('#players').empty();
  var playersText = " ";
  for(let i=0; i<players.length; i++){
      var tplayer = players[i];
      var num = 0;
      var elem;
      if(playerCardsNum[i])
          num = playerCardsNum[i];
      if(lastPlayer && lastPlayer == tplayer) {
          elem = document.createElement("li");
          elem.setAttribute("id", "lastPlayer");
          
      } else {
          if(joinNickname.value == tplayer){
            elem = document.createElement("li");
            elem.setAttribute("id", "currentPlayer");
          }
          else {
            elem = document.createElement("li");
            elem.setAttribute("id", "normalPlayer");
          }
      }
      if(num) {
          tplayer = tplayer +  "(" + num + ")" ;
      } else {
        tplayer = tplayer;
      }
      if(joinNickname.value == tplayer){
            tplayer = "(" + tplayer + ")";
      }
      elem.innerHTML = tplayer ;
      $('#players').append(elem); 
  }

  
  //$('#players').text(playersText);  

  var type = 1, //circle type - 1 whole, 0.5 half, 0.25 quarter
  radius = '5em', //distance from center
  start = -90, //shift start from 0
  //$elements = $('li:not(:first-child)'),
  $elements = $('#players').children('li'),
  numberOfElements = (type === 1) ?  $elements.length : $elements.length - 1, //adj for even distro of elements when not full circle
  slice = 360 * type / numberOfElements ; 

  $elements.each(function(i) {
      var $self = $(this),
          rotate = slice * i + start,
          rotateReverse = rotate * -1;
      
      $self.css({
          'transform': 'rotate(' + rotate + 'deg) translate(' + radius + ') rotate(' + rotateReverse + 'deg)'
      });
    });
  playersOld = players;
}


function setupHand(){
    
    var cards = $("#hand-zone").children("img.card");
    if(cards.length > 0){
      $( "#slider" ).show();
    } else {
      $( "#slider" ).hide();
    }
    //console.log(cards);
    cards.each(function() {
        $(this).dblclick(function() {
              drop(this);
            });
        $(this).on('doubletap',function(event){
          drop(this);
        });
    });
}

function drop(card){
    $(card).draggable('disable');
    $(card).attr('draggable',"false");
    card.left = card.style.left;
    card.top = card.style.top;
    $(card).detach().appendTo('#drop-zone-current');
    hand($('#drop-zone-current'));
    player.currentDealt.push(card.card);
    for( var i = 0; i < player.hand.length; i++){ 
        if ( player.hand[i].imageUrl == card.card.imageUrl) { 
            ////console.log("removing:" + self.player.hand[i].imageUrl);
            player.hand.splice(i, 1); 
            card.index = i;
        }
    }
    if(autoSubmit){
        submit();
    }
}

Discard.onclick = () => {
   $('#drop-zone-current').children().each( function() { 
    player.hand.splice(this.index, 0, this.card);
   });
   player.currentDealt = [];
   //updateGame();
   $('#drop-zone-current').empty();
   $('#hand-zone').empty();
    player.hand.forEach(card => {
      ////console.log(card.imageUrl);
      var elem = document.createElement("img");
      //console.log(card.imageUrl);
      elem.setAttribute("class", "card");
      elem.src = server + "/" + card.imageUrl;
      $('#hand-zone').append(elem);
      elem.card = card;
      
  });
  $("#hand-zone").each(function () {fan($(this)); });
  setupHand();

}
 
function submit() {
    $("#hand-zone").each(function () {fan($(this)); });
    socket.emit('cardPlayed', JSON.stringify(player));
}
 
var Options = {
            //spacing: 0.13,  // How much to show between cards, expressed as percentage of textureWidth
            //radius: 821,
            width: 200,    // This is the radius of the circle under the fan of cards and thus controls the overall curvature of the fan. Small values means higher curvature
            flow: 'horizontal', // The layout direction (horizontal or vertical)
            fanDirection: "N",
            flow: 'horizontal',
        }; 
        
function fan(hand) {
    var fanOptions = {};
    $.extend(fanOptions, Options, readOptions(hand, 'fan'));

    var cards;
    hand.data("fan", 'radius: ' + fanOptions.radius + '; spacing: ' + fanOptions.spacing);
    //console.log(fanOptions);
    cards = hand.find("img.card");
    if (cards.length === 0) {
        return;
    }
    fanCards(cards, this, fanOptions);
}

function hand($hand, cfg) {
            var fanOptions = {}, cards,
                width,
                height;
            $.extend(fanOptions, Options, readOptions($hand, 'hand'));
            //console.log(Options)
            cards = $hand.find('img.card');
            if (cards.length === 0) {
                return;
            }
            width = fanOptions.width; // hack: for a hidden hand
            height = Math.floor(width * 1.4);
            if (width) {
                cards.width(fanOptions.width);
                cards.height(height);
            }
            var stacked = cards.length - 10;
            if (fanOptions.flow === 'horizontal' && fanOptions.spacing < 1.0) {
                cards.slice(1).css('margin-left', -width * (1.0 - fanOptions.spacing));
                if(stacked>0)
                    cards.slice(1,stacked).css('margin-left', -width * (1.0 - fanOptions.spacing/4));
                cards.css('margin-top', 0);
            }
        };

function fanCards(cards, self, fanOptions) {
        var n = cards.length;
        if (n === 0) {
            return;
        }

        var width =  fanOptions.width; // hack: for a hidden hand
        fanOptions.spacing = $( "#slider" ).slider( "value" )/100 || fanOptions.spacing;
        //console.log('width');
        //console.log(width);
        var radius = fanOptions.radius;
        if(n>26) radius = 6*radius;
        var height =  Math.floor(width * 1.4); // hack: for a hidden hand
        var box = {};
        var coords = calculateCoords(n, radius, width, height, fanOptions.fanDirection, fanOptions.spacing, box);
        if(coords.length == 0) {
            return;
        }
        var hand = $(cards[0]).parent();
        hand.width(box.width);
        hand.height(box.height);

        var i = 0;
        //console.log(coords[coords.length -1].x);
        var screenWidth = config.width;
        var tmpw = $(document).width();
        if (window.matchMedia("(orientation: portrait)").matches) {
          screenWidth = tmpw;
   // you're in PORTRAIT mode
        }
        var gap = screenWidth - coords[coords.length -1].x - width;
        //console.log(gap);
        coords.forEach(function (coord) {
            var card = cards[i++];
            var x = coord.x + gap/2 ;
            card.style.left = x + "px";
            card.style.top = coord.y + "px";
            card.style.width = width +"px";
            card.style.height = height +"px";
            $(card).draggable({
                scroll: false,
                containment: "#bg-container",
                stop: function( event, ui ) {
                    drop(this);
                }
            });


           /* card.onmouseover = function () {
                cardSetTop(card, coord.y - 10);
            };
            card.onmouseout = function () {
                cardSetTop(card, coord.y);
            };
            */
            var rotationAngle = Math.round(coord.angle);
            var prefixes = ["Webkit", "Moz", "O", "ms"];
            prefixes.forEach(function (prefix) {
                card.style[prefix + "Transform"] = "rotate(" + rotationAngle + "deg)" + " translateZ(0)";
            });
        });

    }

function cardSetTop(card, top) {
            card.style.top = top + "px";
};

function readOptions($elem, name) {
    var v, i, len, s, options, o = {};

    options = $elem.data(name);
    //console.log("nitish")
    //console.log(options)
    options = (options || '').replace(/\s/g, '').split(';');
    for (i = 0, len = options.length; i < len; i++) {
        s = options[i].split(':');
        v = s[1];
        if (v && v.indexOf(',') >= 0) {
            o[s[0]] = v.split(',');
        } else {
            o[s[0]] = Number(v) || v;
        }
    }
    return o;
}

(function($){

  $.event.special.doubletap = {
    bindType: 'touchend',
    delegateType: 'touchend',

    handle: function(event) {
      var handleObj   = event.handleObj,
          targetData  = jQuery.data(event.target),
          now         = new Date().getTime(),
          delta       = targetData.lastTouch ? now - targetData.lastTouch : 0,
          delay       = delay == null ? 300 : delay;

      if (delta < delay && delta > 30) {
        targetData.lastTouch = null;
        event.type = handleObj.origType;
        ['clientX', 'clientY', 'pageX', 'pageY'].forEach(function(property) {
          event[property] = event.originalEvent.changedTouches[0][property];
        })

        // let jQuery handle the triggering of "doubletap" event handlers
        handleObj.handler.apply(this, arguments);
      } else {
        targetData.lastTouch = now;
      }
    }
  };

})(jQuery);
