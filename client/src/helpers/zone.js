export default class Zone {
    constructor(scene, x, y, width, height, data) {
        this.zone = scene.add.zone(x, y, width, height).setRectangleDropZone(width, height);
        //let dropZone = scene.add.zone(700, 375, 900, 250).setRectangleDropZone(900, 250);
        this.zone.setData({ cards: 0 });

        let dropZoneOutline = scene.add.graphics();
        dropZoneOutline.lineStyle(4, 0xff69b4);
        dropZoneOutline.strokeRect(this.zone.x - this.zone.input.hitArea.width / 2, this.zone.y - this.zone.input.hitArea.height / 2, this.zone.input.hitArea.width, this.zone.input.hitArea.height)
        
    }
}