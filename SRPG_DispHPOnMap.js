// =============================================================================
// SRPG_DispHPOnMap.js
// Version: 1.01
// -----------------------------------------------------------------------------
// Copyright (c) 2018 ヱビ
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
// -----------------------------------------------------------------------------
// [Homepage]: ヱビのノート
//             http://www.zf.em-net.ne.jp/~ebi-games/
// =============================================================================


/*:
 * @plugindesc v1.01 SRPG戦闘中、マップでもHPが確認できるようになるプラグイン。
 * @author ヱビ
 * 
 * @param actorHPColor1
 * @type number
 * @min 0
 * @desc アクターのHPゲージの色１（img/system/Window.pngの色の番号）です。
 * @default 20
 * 
 * @param actorHPColor2
 * @type number
 * @min 0
 * @desc アクターのHPゲージの色２（img/system/Window.pngの色の番号）です。
 * @default 21
 * 
 * @param enemyHPColor1
 * @type number
 * @min 0
 * @desc 敵キャラのHPゲージの色１（img/system/Window.pngの色の番号）です。
 * @default 22
 * 
 * @param enemyHPColor2
 * @type number
 * @min 0
 * @desc 敵キャラのHPゲージの色２（img/system/Window.pngの色の番号）です。
 * @default 23
 * 
 * @help
 * ============================================================================
 * 概要
 * ============================================================================
 * 
 * SRPG戦闘中、マップでもHPが確認できるようになるプラグイン。
 * 
 * 
 * ============================================================================
 * 更新履歴
 * ============================================================================
 * 
 * Version 1.01
 *   アクターのHPゲージ、敵キャラのHPゲージの色を変えられるようにしました。
 * 
 * Version 1.00
 *   公開
 * 
 * ============================================================================
 * 利用規約
 * ============================================================================
 * 
 * ・MITライセンスです。つまり↓↓
 * ・クレジット表記は不要
 * ・営利目的で使用可
 * ・改変可
 *     ただし、ソースコードのヘッダのライセンス表示は削除しないでください。
 * ・素材だけの再配布も可
 * ・アダルトゲーム、残酷なゲームでの使用も可
 * 
 */

(function() {

    var parameters = PluginManager.parameters('SRPG_DispHPOnMap');
	var actorHPColor1 = Number(parameters['actorHPColor1']);
	var actorHPColor2 = Number(parameters['actorHPColor2']);
	var enemyHPColor1 = Number(parameters['enemyHPColor1']);
	var enemyHPColor2 = Number(parameters['enemyHPColor2']);

//=============================================================================
// Sprite_Character
//=============================================================================

	var _SRPG_Sprite_Character_updateCharacterFrame = Sprite_Character.prototype.updateCharacterFrame;
	Sprite_Character.prototype.updateCharacterFrame = function() {
		_SRPG_Sprite_Character_updateCharacterFrame.call(this);
		
		if ($gameSystem.isSRPGMode() == true && this._character.isEvent() == true) {
			var battlerArray = $gameSystem.EventToUnit(this._character.eventId());
			if (battlerArray) {
				this.createHpGauge();
			}
		}
	};

	Sprite_Character.prototype.createHpGauge = function() {
		if (!this._HpGauge) {
			this._HpGauge = new Window_DispHPGauge();
			var battler = $gameSystem.EventToUnit(this._character.eventId())[1];
			this._HpGauge.setBattler(battler);
			this.addChild(this._HpGauge);
		}
	};
//=============================================================================
// Window_DispHPGauge
//=============================================================================
// 参考：YEP_X_VisualHpGauge.js

function Window_DispHPGauge() {
    this.initialize.apply(this, arguments);
}

Window_DispHPGauge.prototype = Object.create(Window_Base.prototype);
Window_DispHPGauge.prototype.constructor = Window_DispHPGauge;

Window_DispHPGauge.prototype.initialize = function() {
    //this._opacitySpeed = 255 / Yanfly.Param.VHGGaugeDuration;
    this._dropSpeed = 0;
    this._visibleCounter = 0;
	// 
    Window_Base.prototype.initialize.call(this, -44, -48, 88, 48);
    this._battler = null;
    this._requestRefresh = false;
    this._currentHpValue = 0;
    this._displayedValue = 0;
    //this.contentsOpacity = 0;
    this.opacity = 0;
};

Window_DispHPGauge.prototype.setBattler = function(battler) {
    if (this._battler === battler) return;
    this._battler = battler;
    this._currentHpValue = this._battler ? this._battler.hp : 0;
    this._displayedValue = this._battler ? this._battler.hp : 0;
};

Window_DispHPGauge.prototype.update = function() {
    Window_Base.prototype.update.call(this);
    if (!this._battler) return;
    this.updateWindowAspects();
};

Window_DispHPGauge.prototype.updateWindowAspects = function() {
    this.updateWindowSize();
    //this.updateWindowPosition();
    this.updateOpacity();
    this.updateHpPosition();
    this.updateRefresh();
};

Window_DispHPGauge.prototype.updateWindowSize = function() {
    //var spriteWidth = this._battler.hpGaugeWidth();
/*
    var spriteWidth = 48;
	var width = spriteWidth + this.standardPadding() * 2;
    width = Math.min(width, Graphics.boxWidth + this.standardPadding() * 2);
    var height = Math.max(this.lineHeight(), this.gaugeHeight() + 4);
    height += this.standardPadding() * 2;
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
*/
	var width = 48 + this.standardPadding() * 2;
	var height = this.lineHeight() + this.standardPadding() * 2;
	if (width === this. width && height === this.height) return;
	this.width = width;
	this.height = height;
    this.createContents();
    this._requestRefresh = true;
    //this.makeWindowBoundaries();
};
/*
Window_DispHPGauge.prototype.makeWindowBoundaries = function() {
    if (!this._requestRefresh) return;
    this._minX = -1 * this.standardPadding();
    this._maxX = Graphics.boxWidth - this.width + this.standardPadding();
    this._minY = -1 * this.standardPadding();
    this._maxY = Graphics.boxHeight - this.height + this.standardPadding();
    this._maxY -= SceneManager._scene._statusWindow.height;
};
*/
/*
Window_DispHPGauge.prototype.updateWindowPosition = function() {
    if (!this._battler) return;
    var battler = this._battler;
    this.x = battler.spritePosX();
    this.x -= Math.ceil(this.width / 2); 
    this.x = this.x.clamp(this._minX, this._maxX);
    this.y = battler.spritePosY();
    if (Yanfly.Param.VHGGaugePos) {
      this.y -= battler.spriteHeight();
    } else {
      this.y -= this.standardPadding();
    }
    this.y = this.y.clamp(this._minY, this._maxY);
    this.y += Yanfly.Param.VHGBufferY;
};
*/
Window_DispHPGauge.prototype.updateOpacity = function() {
    if (this.isShowWindow()) {
      this.contentsOpacity += 32;
    } else {
      this.contentsOpacity -= 32;
    }
};

Window_DispHPGauge.prototype.isShowWindow = function() {
	if (!this._battler) return false;
	if (this._battler.isDead()) return false;
	return true;
    //if (!this._battler.isAppeared()) return false;
    //if (!this._battler.hpGaugeVisible()) return false;
/*
    if (Yanfly.Param.VHGAlwaysShow && !this._battler.isDead()) return true;
    if (this._currentHpValue !== this._displayedValue) return true;
    if (this._battler.isSelected()) return true;
    --this._visibleCounter;
    return this._visibleCounter > 0;
*/
};

Window_DispHPGauge.prototype.updateHpPosition = function() {
    if (!this._battler) return;
    if (this._currentHpValue !== this._battler.hp) {
      //this._visibleCounter = Yanfly.Param.VHGGaugeDuration;
      this._visibleCounter = 10;
      this._currentHpValue = this._battler.hp;
      var difference = Math.abs(this._displayedValue - this._battler.hp);
      // this._dropSpeed = Math.ceil(difference / Yanfly.Param.VHGGaugeDuration);
      this._dropSpeed = Math.ceil(difference / 10);
    }
    this.updateDisplayCounter();
};

Window_DispHPGauge.prototype.updateDisplayCounter = function() {
    if (this._battler._barrierAltered) {
      this._battler._barrierAltered = false;
    } else if (this._currentHpValue === this._displayedValue) {
      return;
    }
    var d = this._dropSpeed;
    var c = this._currentHpValue;
    if (this._displayedValue > this._currentHpValue) {
      this._displayedValue = Math.max(this._displayedValue - d, c);
    } else if (this._displayedValue < this._currentHpValue) {
      this._displayedValue = Math.min(this._displayedValue + d, c);
    }
    this._requestRefresh = true;
};

Window_DispHPGauge.prototype.updateRefresh = function() {
    if (this._requestRefresh) this.refresh();
};

Window_DispHPGauge.prototype.refresh = function() {
    this.contents.clear();
    if (!this._battler) return;
    if (this._battler.isDead()) return;
    this._requestRefresh = false;
    //var wy = this.contents.height - this.lineHeight();
    var wy = this.contents.height - this.lineHeight();
	var ww = this.contents.width;
    this.drawActorHp(this._battler, 0, wy, ww);
};
/*
Window_DispHPGauge.prototype.gaugeBackColor = function() {
	return this.textColor(7);
    return this.textColor(this._battler.hpGaugeBackColor());
};

Window_DispHPGauge.prototype.hpGaugeColor1 = function() {
	return this.textColor(11);
    return this.textColor(this._battler.hpGaugeColor1());
};

Window_DispHPGauge.prototype.hpGaugeColor2 = function() {
	return this.textColor(12);
    return this.textColor(this._battler.hpGaugeColor2());
};
*/

Window_DispHPGauge.prototype.hpGaugeColor1 = function() {
	if (!this._battler || this._battler.isActor()) {
		return this.textColor(actorHPColor1);
	} else {
		return this.textColor(enemyHPColor1);
	}
};

Window_DispHPGauge.prototype.hpGaugeColor2 = function() {
	if (!this._battler || this._battler.isActor()) {
		return this.textColor(actorHPColor2);
	} else {
		return this.textColor(enemyHPColor2);
	}
};

Window_DispHPGauge.prototype.drawActorHp = function(actor, x, y, width) {
    width = width || 186;
    var color1 = this.hpGaugeColor1();
    var color2 = this.hpGaugeColor2();
    var rate = this._displayedValue / actor.mhp;
/*
    if (Imported.YEP_AbsorptionBarrier && actor.barrierPoints() > 0) {
      ww = this.drawBarrierGauge(actor, x, y, width);
    } else {
      this.drawGauge(x, y, width, rate, color1, color2);
	console.log("x:"+x+", y:"+y+", w:"+width+", rate:"+rate);
    }
*/	
	this.drawGauge(x, y, width, rate, color1, color2);
/*
    if (Yanfly.Param.VHGShowHP) {
      this.changeTextColor(this.systemColor());
      this.drawText(TextManager.hpA, x, y, 44);
    }
*/
/*
    if (Yanfly.Param.VHGShowValue) {
      var val = this._displayedValue
      var max = actor.mhp;
      var w = width;
      var color = this.hpColor(actor);
      this.drawCurrentAndMax(val, max, x, y, w, color, this.normalColor());
    }
*/
};
/*
Window_DispHPGauge.prototype.drawCurrentAndMax = function(current, max, x, y,
                                                   width, color1, color2) {
    if (Yanfly.Param.VHGShowMax) {
      Window_Base.prototype.drawCurrentAndMax.call(this, current, max,
        x, y, width, color1, color2);
    } else {
      var align = Yanfly.Param.VHGShowHP ? 'right' : 'center';
      var text = Yanfly.Util.toGroup(current);
      this.changeTextColor(color1);
      this.drawText(text, x, y, width, align);
    }
};
*/
/*
Window_DispHPGauge.prototype.gaugeHeight = function() {
    if (!this._battler) return Window_Base.prototype.gaugeHeight.call(this);
    return this._battler.hpGaugeHeight();
};
*/

})();