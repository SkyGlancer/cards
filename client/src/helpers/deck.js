import Card from '../helpers/card';
export default class Deck {
  
  constructor() {
    this.cards = [];
    this.drawnCards = [];
    var images = "10C.jpg 10H.jpg 2C.jpg 2H.jpg 3C.jpg 3H.jpg 4C.jpg 4H.jpg 5C.jpg 5H.jpg 6C.jpg 6H.jpg 7C.jpg 7H.jpg 8C.jpg 8H.jpg 9C.jpg 9H.jpg AC.jpg AH.jpg JC.jpg JH.jpg KC.jpg KH.jpg QC.jpg QH.jpg 10D.jpg 10S.jpg 2D.jpg 2S.jpg 3D.jpg 3S.jpg 4D.jpg 4S.jpg 5D.jpg 5S.jpg 6D.jpg 6S.jpg 7D.jpg 7S.jpg 8D.jpg 8S.jpg 9D.jpg 9S.jpg AD.jpg AS.jpg JD.jpg JS.jpg KD.jpg KS.jpg QD.jpg QS.jpg"
    var res = images.split(" ");
    var dir = "src/assets/playingCards/"
    res.forEach( file => {
       this.cards.push(new Card(dir+file));
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