//-----------------------------------------------------------------------------
// SRPG_BattleUI.js
// Copyright (c) 2020 SRPG Team. All rights reserved.
// Released under the MIT license.
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
* @plugindesc SRPG Battle UI adjustment, edited by Shoukang and OhisamaCraft
* @author SRPG Team
* 
* @param useTurnWindow
* @desc Change the display of the Turns window.(true / false)
* @type boolean
* @default true
*
* @param textTurn
* @desc A term for turn. It is displayed in the menu window.
* @default turn
* 
* @param menuActorDisplayCount
* @desc Number of actors displayed on the menu status window.
* @type select
* @option 4
* @value 1
* @option 6
* @value 2
* @option 8
* @value 3
* @option 12
* @value 4
* @option 16
* @value 5
* @default 1
* 
* @param menuActorGraphicType
* @desc actor graphics in menu status window. (1: Face / 2: Character / 3: Battler)
* @type select
* @option Face
* @value 1
* @option Character
* @value 2
* @option Battler
* @value 3
* @default 1
*
* @help
* Copyright (c) 2020 SRPG Team. All rights reserved.
* Released under the MIT license.
* ===================================================================
* My (RyanBram) simple plugin for adjusting RPG Maker MV UI (menu)
* to make it more unique for SRPG Battle
* edited by Shoukang to support battlePrepare plugin compatibility
* Please place it below the battlePrepare plugin.
* and modified by OhisamaCraft
*/

/*:ja
* @plugindesc SRPG戦闘でのメニュー画面の変更(Shoukang氏, おひさまクラフトによる改変あり)
* @author SRPG Team
*
* @param useTurnWindow
* @desc ターン数ウィンドウの表示を変更します。(true / false)
* @type boolean
* @default true
* 
* @param textTurn
* @desc ターン数を表す用語です。メニュー画面で使用されます。
* @default ターン
* 
* @param menuActorDisplayCount
* @desc メニュー画面で表示するアクターの人数
* @type select
* @option 4人
* @value 1
* @option 6人
* @value 2
* @option 8人
* @value 3
* @option 12人
* @value 4
* @option 16人
* @value 5
* @default 1
* 
* @param menuActorGraphicType
* @desc メニュー画面で表示するアクターのグラフィック。(1:フェイス / 2:キャラクター / 3:バトラー)
* @type select
* @option フェイス
* @value 1
* @option キャラクター
* @value 2
* @option バトラー
* @value 3
* @default 1
*
* @help
* Copyright (c) 2020 SRPG Team. All rights reserved.
* Released under the MIT license.
* ===================================================================
* RyanBram氏による、メニュー画面をSRPGバトル向けUIに変更するプラグイン
* Shoukang氏のbattlePrepare pluginとの競合対策あり
* battlePrepare pluginより下に配置してください。
* おひさまクラフトによる改変あり
*/


(function () {
  'use strict';


  const switchId = 1;

  var parameters = PluginManager.parameters('SRPG_BattleUI');
  var _useTurnWindow = parameters['useTurnWindow'] || 'true';
  var _textTurn = parameters['textTurn'] || 'ターン';
  var _menuActorDisplayCount = Number(parameters['menuActorDisplayCount'] || 1);
  var _menuActorGraphicType = Number(parameters['menuActorGraphicType'] || 1);

  var coreParameters = PluginManager.parameters('SRPG_core');
	var _turnVarID = Number(coreParameters['turnVarID'] || 3);

  var battlePrepareParameters = PluginManager.parameters('SRPG_BattlePrepare');
	var _lockIconIndex = Number(battlePrepareParameters['lockIconIndex']|| 195);

// ==============================================================================
//GHANGE MENU COMMAND && MAKE TRUN WINDOW ---------------------------------------
// ==============================================================================
  const SRPG_UI_Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
  Scene_Menu.prototype.createCommandWindow = function() {
    SRPG_UI_Scene_Menu_createCommandWindow.call(this);
    if ($gameSystem.isSRPGMode() && $gameSystem.isBattlePhase() !== 'battle_prepare') {
      this._commandWindow.x = (Graphics.boxWidth - this._commandWindow.width)/2;
      this._commandWindow.y = (Graphics.boxHeight - this._commandWindow.height)/2; // 150
      // ターンウィンドウも一緒に作る
      this._turnWindow = new Window_Turn(0, 0);
      this._turnWindow.y = Graphics.boxHeight - this._turnWindow.height;
      if (_useTurnWindow !== 'true') this._turnWindow.hide();
      this.addWindow(this._turnWindow);
    }
  };

  const SRPG_UI_Scene_Menu_createStatusWindow = Scene_Menu.prototype.createStatusWindow;
  Scene_Menu.prototype.createStatusWindow = function() {
    SRPG_UI_Scene_Menu_createStatusWindow.call(this);
    if ($gameSystem.isSRPGMode() && $gameSystem.isBattlePhase() !== 'battle_prepare') {
      this._statusWindow.x = (Graphics.boxWidth - this._statusWindow.width)/2;
      this._statusWindow.hide();
      this._goldWindow.hide();
    }
  };

  const SRPG_UI_Scene_Menu_commandPersonal = Scene_Menu.prototype.commandPersonal;
  Scene_Menu.prototype.commandPersonal = function () {
    SRPG_UI_Scene_Menu_commandPersonal.call(this);
    this.showStatusAndHideCommand();
  };

  const SRPG_UI_Scene_Menu_commandFormation = Scene_Menu.prototype.commandFormation;
  Scene_Menu.prototype.commandFormation = function () {
    SRPG_UI_Scene_Menu_commandFormation.call(this);
    this.showStatusAndHideCommand();
  };

  const SRPG_UI_Scene_Menu_onPersonalCancel = Scene_Menu.prototype.onPersonalCancel;
  Scene_Menu.prototype.onPersonalCancel = function () {
    SRPG_UI_Scene_Menu_onPersonalCancel.call(this);
    this.showCommandAndHideStatus();
  };

  const SRPG_UI_Scene_Menu_onFormationCancel = Scene_Menu.prototype.onFormationCancel;
  Scene_Menu.prototype.onFormationCancel = function () {
    SRPG_UI_Scene_Menu_onFormationCancel.call(this);
    this.showCommandAndHideStatus();
  };

  Scene_Menu.prototype.showStatusAndHideCommand = function () {
    if ($gameSystem.isSRPGMode() && $gameSystem.isBattlePhase() !== 'battle_prepare') {
      this._commandWindow.hide();
      this._turnWindow.hide();
      this._statusWindow.show();
    }
  };

  Scene_Menu.prototype.showCommandAndHideStatus = function () {
    if ($gameSystem.isSRPGMode() && $gameSystem.isBattlePhase() !== 'battle_prepare') {
      this._commandWindow.show();
      if (_useTurnWindow === 'true') this._turnWindow.show();
      this._statusWindow.hide();
    }
  };

//-----------------------------------------------------------------------------
// Window_Turn
//
// The window for displaying the SRPG turn.

function Window_Turn() {
  this.initialize.apply(this, arguments);
}

Window_Turn.prototype = Object.create(Window_Base.prototype);
Window_Turn.prototype.constructor = Window_Turn;

  Window_Turn.prototype.initialize = function(x, y) {
    var width = this.windowWidth();
    var height = this.windowHeight();
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
  };

  Window_Turn.prototype.windowWidth = function() {
    return 180;
  };

  Window_Turn.prototype.windowHeight = function() {
    return this.fittingHeight(1);
  };

  Window_Turn.prototype.refresh = function() {
    var x = this.textPadding();
    var width = this.contents.width - this.textPadding() * 2;
    this.contents.clear();
    this.drawCurrencyValue(this.value(), this.currencyUnit(), x, 0, width);
  };

  Window_Turn.prototype.value = function() {
    return $gameVariables.value(_turnVarID);
  };

  Window_Turn.prototype.currencyUnit = function() {
    return _textTurn;
  };

  Window_Turn.prototype.show = function() {
    this.refresh();
    Window_Base.prototype.show.call(this);
  };

// ==============================================================================
// REMOVE MENU COMMAND ----------------------------------------------------------
// ==============================================================================

  const SRPG_UI_Window_MenuCommand_addMainCommands = Window_MenuCommand.prototype.addMainCommands;
  Window_MenuCommand.prototype.addMainCommands = function() {
    if ($gameSystem.isSRPGMode()) {
      this.addCommand(TextManager.status, 'status', this.areMainCommandsEnabled());
    } else {
      SRPG_UI_Window_MenuCommand_addMainCommands.call(this);
    }
  };

  const SRPG_UI_Window_MenuCommand_addFormationCommand = Window_MenuCommand.prototype.addFormationCommand;
  Window_MenuCommand.prototype.addFormationCommand = function() {
    if (!$gameSystem.isSRPGMode()) {
      SRPG_UI_Window_MenuCommand_addFormationCommand.call(this);
    }
  };

// ==============================================================================
// CHANGE SRPG Movement Indicator -----------------------------------------------
// ==============================================================================
    Sprite_SrpgMoveTile.prototype.createBitmap = function() {
        var tileWidth = $gameMap.tileWidth();
        var tileHeight = $gameMap.tileHeight();
        this.bitmap = new Bitmap(tileWidth - 4, tileHeight - 4);
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.blendMode = Graphics.BLEND_ADD;
    };

    Sprite_SrpgMoveTile.prototype.updateAnimation = function() {
        this._frameCount++;
        this._frameCount %= 20;
        this.opacity = (60 - this._frameCount) * 3;
    };

// ==============================================================================
// CHANGE SRPG Battle Prediciton Width ------------------------------------------
// ==============================================================================

    Window_SrpgPrediction.prototype.windowWidth = function() {
        return 816;
    };

    Window_SrpgStatus.prototype.windowWidth = function() {
        return 408;
    };

    Scene_Map.prototype.createSrpgStatusWindow = function() {
        this._mapSrpgStatusWindow = new Window_SrpgStatus(0, 0);
        this._mapSrpgStatusWindow.x = Graphics.boxWidth - ((Graphics.boxWidth - 816) / 2) - this._mapSrpgStatusWindow.windowWidth();
        this._mapSrpgStatusWindow.openness = 0;
        this.addWindow(this._mapSrpgStatusWindow);
    };

    Scene_Map.prototype.createSrpgTargetWindow = function() {
        this._mapSrpgTargetWindow = new Window_SrpgStatus((Graphics.boxWidth-816)/2, 0);
        this._mapSrpgTargetWindow.openness = 0;
        this.addWindow(this._mapSrpgTargetWindow);
    };

    Scene_Map.prototype.createSrpgPredictionWindow = function() {
        this._mapSrpgPredictionWindow = new Window_SrpgPrediction((Graphics.boxWidth-816)/2, 0);
        this._mapSrpgPredictionWindow.y = this._mapSrpgStatusWindow.windowHeight();
        this._mapSrpgPredictionWindow.openness = 0;
        this.addWindow(this._mapSrpgPredictionWindow);
    };

// ==============================================================================
//GHANGE MENU STATUS WINDOW -----------------------------------------------------
// ==============================================================================
  Window_Base.prototype.reserveFaceImages = function() {
    $gameParty.members().forEach(function(actor) {
        ImageManager.reserveFace(actor.faceName());
        if (_menuActorGraphicType === 2) ImageManager.reserveCharacter(actor.characterName());
        if (_menuActorGraphicType === 3) ImageManager.reserveSvActor(actor.battlerName());
    }, this);
  };

  // prettier-ignore
  Window_Base.prototype.drawBattler = function(
    battlerName, x, y
  ) {
    const bitmap = ImageManager.loadSvActor(battlerName);
    const pw = bitmap.width / 9;
    const ph = bitmap.height / 6;
    const sx = 1 * pw;
    const sy = 0;
    this.contents.blt(bitmap, sx, sy, pw, ph, x - pw / 2, y - ph);
  };

  Window_Base.prototype.drawActorBattler = function(actor, x, y) {
    this.drawBattler(actor.battlerName(), x, y);
  };

  Window_Base.prototype.drawActorSimpleStatus6 = function(actor, x, y, width) {
    const lineHeight = this.lineHeight() - 6;
    const x2 = x + 180;
    const width2 = Math.min(200, width - 180 - this.textPadding());
    this.drawActorName(actor, x, y);
    this.drawActorLevel(actor, x, y + lineHeight * 1);
    this.drawActorIcons(actor, x, y + lineHeight * 2 + 2);
    this.drawActorClass(actor, x2, y);
    this.drawActorHp(actor, x2, y + lineHeight * 1, width2);
    this.drawActorMp(actor, x2, y + lineHeight * 2, width2);
  };

  Window_Base.prototype.drawActorSimpleStatus8 = function(actor, x, y, width) {
    const lineHeight = this.lineHeight();
    const x2 = x + 148;
    const width2 = Math.min(200, width - 148);
    const heightPadding = 32;
    this.drawActorName(actor, x, y, 160);
    this.drawActorIcons(actor, x + 2, y + lineHeight * 2 + heightPadding + 2);
    this.drawActorLevel(actor, x2 + 24, y, 84);
    this.drawActorHp(actor, x2, y + lineHeight * 1 + heightPadding, width2);
    this.drawActorMp(actor, x2, y + lineHeight * 2 + heightPadding, width2);
  };

  Window_Base.prototype.drawActorSimpleStatus12 = function(actor, x, y, width) {
    const lineHeight = this.lineHeight() - 6;
    const x2 = x + 148;
    const width2 = Math.min(200, width - 148);
    this.drawActorName(actor, x, y);
    this.drawActorIcons(actor, x, y + lineHeight * 2 + 2);
    this.drawActorLevel(actor, x2 + 24, y, 84);
    this.drawActorHp(actor, x2, y + lineHeight * 1, width2);
    this.drawActorMp(actor, x2, y + lineHeight * 2, width2);
  };

  Window_Base.prototype.drawActorSimpleStatus16 = function(actor, x, y, width) {
    const lineHeight = this.lineHeight();
    const heightPadding = 32;
    this.drawActorName(actor, x, y, width);
    this.drawActorLevel(actor, x + 36, y + lineHeight * 2 + heightPadding, 84);
  };

  //-----------------------------------------------------------------------------
  // Window_MenuStatus
  //
  Window_MenuStatus.prototype.maxCols = function() {
    if (_menuActorDisplayCount === 5) {
      return 4;
    } else if (_menuActorDisplayCount > 2) {
      return 2;
    } else {
      return 1;
    }
  };

  Window_MenuStatus.prototype.numVisibleRows = function() {
    if (_menuActorDisplayCount === 1 || _menuActorDisplayCount === 3 || _menuActorDisplayCount === 5) {
      return 4;
    } else {
      return 6;
    }
  };

  Window_MenuStatus.prototype.drawItemImage = function(index) {
    if ($gameSystem.isSRPGMode() == true && $gameSystem.isBattlePhase() === 'battle_prepare') {
      const actor = $gameParty.members()[index];
      const rect = this.itemRect(index);
      const width = (_menuActorDisplayCount === 5) ? 124 : Window_Base._faceWidth;
      const height = rect.height - 2;
      const heightPadding = (this.numVisibleRows() === 4) ? 0 : 8;
      if ($gameParty.inRemainingActorList(actor.actorId())) {
          this.changePaintOpacity(false);
      } else {
          this.changePaintOpacity(true);
      }
      if (_menuActorGraphicType === 1) {
        this.drawActorFace(actor, rect.x + 1, rect.y + 1, width, height);
      } else if (_menuActorGraphicType === 2) {
        this.drawActorCharacter(actor, rect.x + width / 2, rect.y + height * 0.7 + heightPadding);
      } else if (_menuActorGraphicType === 3) {
        this.drawActorBattler(actor, rect.x + width / 2, rect.y + height * 0.75 + heightPadding);
      }
      if ($gameParty.inLockedActorList(actor.actorId())){
          this.drawLockedIcon(index, width, height);
      }
    } else {
      const actor = $gameParty.members()[index];
      const rect = this.itemRect(index);
      const width = (_menuActorDisplayCount === 5) ? 124 : Window_Base._faceWidth;
      const height = rect.height - 2;
      const heightPadding = (this.numVisibleRows() === 4) ? 0 : 8;
      //this.changePaintOpacity(actor.isBattleMember());
      if ($gameSystem.isSRPGMode() && (actor.srpgTurnEnd() === true || actor.isRestricted() === true)) {
        this.changePaintOpacity(false);
      } else {
        this.changePaintOpacity(true);
      }
      if (_menuActorGraphicType === 1) {
        this.drawActorFace(actor, rect.x + 1, rect.y + 1, width, height);
      } else if (_menuActorGraphicType === 2) {
        this.drawActorCharacter(actor, rect.x + width / 2, rect.y + height * 0.7 + heightPadding);
      } else if (_menuActorGraphicType === 3) {
        this.drawActorBattler(actor, rect.x + width / 2, rect.y + height * 0.75 + heightPadding);
      }
    }
  };

  Window_MenuStatus.prototype.drawItemStatus = function(index) {
    const actor = $gameParty.members()[index];
    const rect = this.itemRect(index);
    switch (_menuActorDisplayCount) {
      case 1:
        var x = rect.x + 162;
        var y = rect.y + rect.height / 2 - this.lineHeight() * 1.5;
        var width = rect.width - 162 - this.textPadding();
        this.drawActorSimpleStatus(actor, x, y, width);
        break;
      case 2:
        var x = rect.x + 162;
        var y = rect.y + 2;
        var width = rect.width - 162 - this.textPadding();
        this.drawActorSimpleStatus6(actor, x, y, width);
        break;
      case 3:
        var x = rect.x;
        var y = rect.y + 2;
        var width = rect.width - this.textPadding();
        this.drawActorSimpleStatus8(actor, x, y, width);
        break;
      case 4:
        var x = rect.x;
        var y = rect.y + 2;
        var width = rect.width - this.textPadding();
        this.drawActorSimpleStatus12(actor, x, y, width);
        break;
      case 5:
        var x = rect.x;
        var y = rect.y + 2;
        var width = rect.width - this.textPadding();
        this.drawActorSimpleStatus16(actor, x, y, width);
        break;
    }
  };

  Window_MenuStatus.prototype.drawLockedIcon = function(index, width, height) {
    const rect = this.itemRect(index);
    const iconHeight = Window_Base._iconHeight;
    switch (_menuActorDisplayCount) {
      case 1:
        this.drawIcon(_lockIconIndex, rect.x + width - iconHeight, rect.y + height - iconHeight);
        break;
      case 2:
        this.drawIcon(_lockIconIndex, rect.x + width - iconHeight, rect.y + height - iconHeight);
        break;
      case 3:
        this.drawIcon(_lockIconIndex, rect.x + width - iconHeight, rect.y + height - iconHeight * 2 - 6);
        break;
      case 4:
        this.drawIcon(_lockIconIndex, rect.x + width - iconHeight, rect.y + height - iconHeight * 2);
        break;
      case 5:
        this.drawIcon(_lockIconIndex, rect.x, rect.y + height - iconHeight - 4);
        break;
    }
  };

})();
