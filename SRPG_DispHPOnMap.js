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
 * @plugindesc v1.01 It enables to display HP on the map during SRPG combat (edited by Ohisama-Craft).
 * @author ヱビ
 * 
 * @param actorHPColor1
 * @type number
 * @min 0
 * @desc The color1 (color No. of img/system/Window.png) of HP gauges of actors.
 * @default 20
 * 
 * @param actorHPColor2
 * @type number
 * @min 0
 * @desc The color2 (color No. of img/system/Window.png) of HP gauges of actors.
 * @default 21
 * 
 * @param enemyHPColor1
 * @type number
 * @min 0
 * @desc The color1 (color No. of img/system/Window.png) of HP gauges of enemies.
 * @default 22
 * 
 * @param enemyHPColor2
 * @type number
 * @min 0
 * @desc The color2 (color No. of img/system/Window.png) of HP gauges of enemies.
 * @default 23
 * 
 * @help
 * copyright 2018 エビ. all rights reserved.
 * Released under the MIT license.
 * ============================================================================
 * Overview
 * ============================================================================
 * 
 * A plugin to display HP on a map during SRPG combat.
 * 
 * 
 * ============================================================================
 * Version History
 * ============================================================================
 * 
 * Version 1.01
 *   Users can now change the colors of HP gauges of actors and enemies.
 * 
 * Version 1.00
 *   Released
 * 
 * ============================================================================
 * EULA
 * ============================================================================
 * 
 * ・It is released under MIT Lincense. That is;
 * ・No credits required.
 * ・Can be used commercially.
 * ・Can be modified. (However, do not delete the license texts from the source code.)
 * ・Can be reposted.
 * ・Can be used for NSFW games.
 * 
 */

/*:ja
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
 * Copyright (c) 2018 エビ. All rights reserved.
 * Released under the MIT license.
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

	const _SRPG_Sprite_Character_updateCharacterFrame = Sprite_Character.prototype.updateCharacterFrame;
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
// Game_BattlerBase
//=============================================================================
    // UX_Windowsで再定義する
    Game_BattlerBase.prototype.srpgHideHpMp = function() {
		return false;
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
    this._dropSpeed = 0;
    this._visibleCounter = 0;
    Window_Base.prototype.initialize.call(this, -44, -48, 88, 48);
    this._battler = null;
    this._requestRefresh = false;
    this._currentHpValue = 0;
    this._displayedValue = 0;
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
    this.updateOpacity();
    this.updateHpPosition();
    this.updateRefresh();
};

Window_DispHPGauge.prototype.updateWindowSize = function() {
	var width = 48 + this.standardPadding() * 2;
	var height = this.lineHeight() + this.standardPadding() * 2;
	if (width === this. width && height === this.height) return;
	this.width = width;
	this.height = height;
    this.createContents();
    this._requestRefresh = true;
};

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
};

Window_DispHPGauge.prototype.updateHpPosition = function() {
    if (!this._battler) return;
    if (this._currentHpValue !== this._battler.hp) {
      this._visibleCounter = 10;
      this._currentHpValue = this._battler.hp;
      var difference = Math.abs(this._displayedValue - this._battler.hp);
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
    var wy = this.contents.height - this.lineHeight();
	var ww = this.contents.width;
    this.drawActorHp(this._battler, 0, wy, ww);
};

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
    if (actor.srpgHideHpMp()) {
        var rate = 1.0;
    } else {
        var rate = this._displayedValue / actor.mhp;
    }
	this.drawGauge(x, y, width, rate, color1, color2);
};

})();
