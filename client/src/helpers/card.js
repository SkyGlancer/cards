export default class Card {
    constructor(imageUrl, backImageUrl){
      this.imageUrl = imageUrl;
      this.backImageUrl = backImageUrl;
    }

    render(scene,x,y) {
         let card = scene.add.sprite(x, y, this.imageUrl).setScale(0.3, 0.3).setInteractive();
         card.card = this;
         this.gameObject = card;
         scene.input.setDraggable(card);
         return card;   
    }

    hide(){
      this.gameObject.setTexture(this.backImageUrl);
    }
    show(){
      this.gameObject.setTexture(this.imageUrl);
    }
}