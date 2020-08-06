import Card from './card'
import Deck from './deck'

export default class Dealer {
    deal(scene, deck) {
            for (let i = 0; i < 5; i++) {
                let playerCard = deck.cards[i];
                console.log(playerCard.imageUrl);
                                console.log(scene);

                playerCard.show(scene, 475 + (i * 100), 650, playerCard.imageUrl);

                //let opponentCard = new Card(scene);
                //scene.opponentCards.push(opponentCard.render(475 + (i * 100), 125, opponentSprite).disableInteractive());
            
        }
    }
    
    suffle(scene,decks) {
        decks.forEach(deck => deck.shuffle());
    }

    suffleOne(scene,deck) {
        deck.shuffle();
    }
}