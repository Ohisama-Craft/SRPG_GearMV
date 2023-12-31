//=============================================================================
//SRPG_AoEAnimation.js
// v 1.06 Fix a bug of showing the wrong battler in battle result window.
// Use my bug fix patch! Especially the SRPG_DynamicAction, the map AoE battle will work amazingly good!
// Download here https://github.com/ShoukangHong/Shoukang_SRPG_plugin/tree/main/BugFixPatch
//=============================================================================
/*:
 * @plugindesc Allows AoE skills to show once when targetting multiple targets. Requires SRPG_AoE. This is a modified version by Shoukang
 * @author Boomy, Shoukang
 * 
 * @param standard X
 * @desc The center X position in battle scene, default Graphics.width / 2
 * @default Graphics.width / 2
 * 
 * @param standard Y
 * @desc The center Y position in battle scene, default Graphics.height / 2 + 48
 * @default Graphics.height / 2 + 48
 * 
 * @param x range
 * @desc x direction battler placement range in battle scene, default Graphics.width - 360
 * @default Graphics.width - 360
 *
 * @param y range
 * @desc y direction battler placement range in battle scene, default Graphics.height / 3.5
 * @default Graphics.height / 3.5
 * 
 * @param tilt
 * @desc parameter that tilt x direction placement to simulate a 3D view, default 0.2
 * @default 0.2
 *
 * @param allow surrounding
 * @desc if disabled skill user will never be surrounded by targets. See help for detail
 * @type boolean
 * @default false
 *
 * @param counterattack Mode
 * @desc what targets in the AoE can do counterattack
 * @type select
 * @option All targets
 * @value all
 * @option target in AoE center
 * @value center
 * @option first viable target
 * @value first
 * @option No AoE counter
 * @value false
 * @default all
 *
 * @help
 * ===================================================================================================
 * Compatibility:
 * Need SRPG_AoE, and place this plugin below it.
 * Strongly recommend to use my bug fix patch! Especially the SRPG_DynamicAction, the map AoE battle will work amazingly good!
 * Download here https://github.com/ShoukangHong/Shoukang_SRPG_plugin/tree/main/BugFixPatch
 * ===================================================================================================
 * When an AoE spell is cast and more than 1 target is selected ($gameTemp.areaTargets), each target is added to a queue and then the game will execute each battle individually 1 on 1
 * This script will collect all targets and add them into one battle for a 1 vs many scenario
 * Works best with animations set to SCREEN though animations that target individuals still work (they just happened sequentially on the same battle field)
 *
 * AoE rules in this plugin:
 * 1. If an enemy cast AoE to actors, the battle exp will be shared by all actors in battle equally.
 * 2. If you use AGI attack, AoE skill will hit every target first, then targets will do counter attacks.
 *
 * Important Tips:
 * With this plugin, it's necessary to set skill target to all enemies/friends to make AoEs work properly.
 * If you allow surrounding and you use dynamic motion, actor sprite priority may become weird while casting skills, to avoid this, set the plugin parameter
 * 'usePriority' in dynamic motion to false.
 * Once you find anything weird, try to turn of this plugin and see if it happens again. This will help us identify which plugin causes the error.
 * ==================================================================================================
 * Positions battlers in Battle scene:
 * All battlers will be placed based on their relative positions. For example in this map position:
 * [ . T .]    Battle scene will look like: [ . T .]                     [ . T .]
 * [ T C T]    ========================>    [ T . U] when user is actor, [ U . T] when user is enemy.
 * [ . U .]                                 [ . T .]                     [ . T .]
 *
 * U: skill user, T: target, C; AoE center
 *
 * The battle scene will look like:
 * [ C T .]    Battle scene will look like: [ T . .]                     [ . . T]
 * [ T U .]    ========================>    [ . . U] when user is actor, [ U . .] when user is enemy.
 * [ . . .]                                 [ T . .]                     [ . . T]
 *
 * The placement will automatically adjust battlers' distance to make them reasonable.(within the defined x and y range)
 * ===================================================================================================
 * Credits to: Dopan, Dr. Q, Traverse, SoulPour777
 * ===================================================================================================
 * v 1.06 Fix a bug of showing the wrong battler in battle result window.
 * v 1.05 add map battle log window. Need to update the SRPG_DynamicAction to work. Fix a bug where agi attack continue when enemy is already dead.
 * v 1.04 fixed some bugs and improve logic. Now the map battle should work completely the same as scene battle.  Also updates SRPG_DynamicAction
 * v 1.03 fixed some bugs
 * v 1.02 Change battle result window to fit for more reward items.
 *        Fix a bug that counter attack don't stop when active battler is dead.
 *        Map view AoE now behaves the same as Scene battle, which means: 1. AoE Animation cast simultaniusly no matter it's
 * dynamic animation or not. 2. All targets get hit at the beginning. 3. Damage for AoE pop up simultaniusly.
 * v 1.01 add counter attack mode! Fix a bug caused by max party member, fix the bug of sprite priority in battle.
 */
(function () {
    'use strict'
    //=================================================================================================
    //Plugin Parameters
    //=================================================================================================
    var parameters = PluginManager.parameters('SRPG_AoEAnimation');
    var _standardY = parameters['standard Y'] || 'Graphics.height / 2 + 48';
    var _standardX = parameters['standard X'] || 'Graphics.width / 2';
    var _xRange = parameters['x range'] || 'Graphics.width - 360';
    var _yRange = parameters['y range'] || 'Graphics.height / 3.5';
    var _tilt = Number(parameters['tilt']);
    var _surround = !!eval(parameters['allow surrounding']);
    var _counterMode = parameters['counterattack Mode'];

    var coreParameters = PluginManager.parameters('SRPG_core');
    var _srpgTroopID = Number(coreParameters['srpgTroopID'] || 1);
    var _srpgUseAgiAttackPlus = coreParameters['useAgiAttackPlus'] || 'true';
    var _srpgAgilityAffectsRatio = Number(coreParameters['srpgAgilityAffectsRatio'] || 2);
    var _existActorVarID = Number(coreParameters['existActorVarID'] || 1);
    var _existEnemyVarID = Number(coreParameters['existEnemyVarID'] || 2);
    var _srpgBattleExpRate = Number(coreParameters['srpgBattleExpRate'] || 0.4);
    var _srpgBattleExpRateForActors = Number(coreParameters['srpgBattleExpRateForActors'] || 0.1);
    var _rewardSe = coreParameters['rewardSound'] || 'Item3';
    var _expSe = coreParameters['expSound'] || 'Up4';
    var _srpgDamageDirectionChange = coreParameters['srpgDamageDirectionChange'] || 'true';
//============================================================================================
//Battler position in AoE(when there are areaTargets) scene battle 
//============================================================================================
    // remove actor sprite limit
    var _Spriteset_Battle_createActors = Spriteset_Battle.prototype.createActors
    Spriteset_Battle.prototype.createActors = function() {
        if ($gameSystem.isSRPGMode() && $gameTemp.areaTargets().length > 0){
            this._actorSprites = [];
            for (var i = 0; i < $gameParty.SrpgBattleActors().length; i++) {
                this._actorSprites[i] = new Sprite_Actor();
                this._battleField.addChild(this._actorSprites[i]);
            }          
        } else{
            _Spriteset_Battle_createActors.call(this);
        }
    };

    //sort to get priority right
    var _Spriteset_Battle_createLowerLayer = Spriteset_Battle.prototype.createLowerLayer;
    Spriteset_Battle.prototype.createLowerLayer = function() {
        _Spriteset_Battle_createLowerLayer.call(this);
        if ($gameSystem.isSRPGMode() && $gameTemp.areaTargets().length > 0){
            this._battleField.removeChild(this._back1Sprite);
            this._battleField.removeChild(this._back2Sprite);
            this._battleField.children.sort(this.compareEnemySprite.bind(this));
            this._battleField.addChildAt(this._back2Sprite, 0);
            this._battleField.addChildAt(this._back1Sprite, 0);
        }
    };

    var _SRPG_Sprite_Actor_setActorHome = Sprite_Actor.prototype.setActorHome;
    Sprite_Actor.prototype.setActorHome = function (index) {
        if ($gameSystem.isSRPGMode() == true && !$gameSystem.useMapBattle() && $gameTemp.areaTargets().length > 0) {
            var param = $gameTemp._aoePositionParameters;
            var battler = this._battler;
            this.setHome(eval(_standardX) + (battler.aoeSceneX() - param.midX) * param.amplifyX,
                         eval(_standardY) + (battler.aoeSceneY() - param.midY) * param.amplifyY);
            this.moveToStartPosition();
        } else {
            _SRPG_Sprite_Actor_setActorHome.call(this, index);
        }
    };

    //Set enemy positions
    var _SRPG_Game_Troop_setup = Game_Troop.prototype.setup;
    Game_Troop.prototype.setup = function(troopId) {
        if ($gameSystem.isSRPGMode() == true && !$gameSystem.useMapBattle() && $gameTemp.areaTargets().length > 0) {
            this.clear();
            this._troopId = troopId;
            this._enemies = [];
            var param = $gameTemp._aoePositionParameters;
            for (var i = 0; i < this.SrpgBattleEnemys().length; i++) {
                var battler = this.SrpgBattleEnemys()[i];
                battler.setScreenXy(eval(_standardX) + (battler.aoeSceneX() - param.midX) * param.amplifyX,
                                    eval(_standardY) + (battler.aoeSceneY() - param.midY) * param.amplifyY);
                this._enemies.push(battler);
            }
            this.makeUniqueNames();
        } else {
            _SRPG_Game_Troop_setup.call(this, troopId);
        }
    };

// shoukang: complicated vector calculation to determine the battler placement parameters and relative position.
    Scene_Map.prototype.setBattlerPosition = function(){
        var activeEvent = $gameTemp.activeEvent();
        var allEvents = [activeEvent, $gameTemp.targetEvent()].concat($gameTemp.getAreaEvents());
        var vector =  this.createSrpgAoEVector();
        var vectorX = vector[0];
        var vectorY = vector[1];
        var vectorLen = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
        var minX = 0;
        var maxX = 0.5;
        var minY = -1.25;
        var maxY = 1.25;
        var targetMinX = 0.5;

        for (var i = 0; i < allEvents.length; i++){
            var battler = $gameSystem.EventToUnit(allEvents[i].eventId())[1];
            var posX = allEvents[i].posX() - activeEvent.posX();
            var posY = allEvents[i].posY() - activeEvent.posY();
            var projectionY = (vectorY * posX - vectorX * posY) / vectorLen;
            var projectionX = _tilt * projectionY + (vectorX * posX + vectorY * posY) / vectorLen; //0.2 * sin helps to make a better veiw.
            battler.setAoEScenePosition(projectionX, projectionY);
            if (i > 0) targetMinX = Math.min(projectionX, targetMinX);
            minX = Math.min(projectionX, minX);
            minY = Math.min(projectionY, minY);
            maxX = Math.max(projectionX, maxX);
            maxY = Math.max(projectionY, maxY);
        }

        if (!_surround && targetMinX < 0.5){
            minX -= Math.max((maxX - targetMinX) / 2, 0.5);
            $gameSystem.EventToUnit(activeEvent.eventId())[1].setAoEScenePosition(minX, 0);
        }
        var direction = $gameSystem.EventToUnit(activeEvent.eventId())[0] === 'actor' ? -1 : 1;
        var amplifyX = direction * eval(_xRange) / Math.max((maxX - minX), 2);
        var amplifyY = eval(_yRange) / (maxY - minY);
        $gameTemp.setAoEPositionParameters((minX + maxX) / 2, (minY + maxY) / 2, amplifyX, amplifyY);
    }

    Scene_Map.prototype.createSrpgAoEVector = function(){
        var activeEvent = $gameTemp.activeEvent();
        var vectorX = $gameTemp.areaX() - activeEvent.posX();
        var vectorY = $gameTemp.areaY() - activeEvent.posY();

        // if aoe center overlap with active event, use active event direction as vector.
        if (Math.abs(vectorX) + Math.abs(vectorY) === 0){
            var dir = activeEvent.direction();
            vectorX = $gameMap.roundXWithDirection(0, dir);
            vectorY = $gameMap.roundYWithDirection(0, dir);
        }
        return [vectorX, vectorY]
    }

    Game_Battler.prototype.setAoEScenePosition = function(x, y){
        this._aoeSceneX = x;
        this._aoeSceneY = y;
    }

    Game_Battler.prototype.aoeSceneX = function(){
        return this._aoeSceneX;
    }

    Game_Battler.prototype.aoeSceneY = function(){
        return this._aoeSceneY;
    }

    Game_Temp.prototype.setAoEPositionParameters = function(midX, midY, amplifyX, amplifyY){
        this._aoePositionParameters = {
            midX : midX,
            midY : midY,
            amplifyX : amplifyX,
            amplifyY : amplifyY,
        }
    }

//============================================================================================
//AoE animation Main logic
//============================================================================================

// shoukang rewrite to give a clearer logic
    Scene_Map.prototype.srpgBattleStart = function(userArray, targetArray){
        var action = userArray[1].action(0);
        if (action && action.item()) {
            var mapBattleTag = action.item().meta.mapBattle;
            if (mapBattleTag == 'true') $gameSystem.forceSRPGBattleMode('map');
            else if (mapBattleTag == 'false') $gameSystem.forceSRPGBattleMode('normal');
        }
        if (!$gameSystem.useMapBattle()) {
            this.processSceneBattle(userArray, targetArray);
        } else {
            this.processMapBattle(userArray, targetArray)
        }
    };

//Scene Battle that take area targets into consideration
    Scene_Map.prototype.processSceneBattle = function(userArray, targetArray){  
        var userType = userArray[0];
        var user = userArray[1];
        var targetType = targetArray[0]
        var targetEvents = [$gameTemp.targetEvent()].concat($gameTemp.getAreaEvents());
        $gameParty.clearSrpgBattleActors();
        $gameTroop.clearSrpgBattleEnemys();
        $gameTroop._enemies = [];
        this.pushSrpgBattler(userType, user);
        if (userType === 'enemy') {
            user.action(0).setSrpgEnemySubject($gameTroop.members().length - 1);
        }

        if($gameTemp.areaTargets().length > 0) {
            this.setBattlerPosition();
        }

        for (var i = 0; i < targetEvents.length; i++) {
            var target = $gameSystem.EventToUnit(targetEvents[i].eventId())[1];
            this.setTargetDirection(targetEvents[i]);
            if (user === target){
                user.action(0).setTarget(0);
            } else if (userType === targetType) {
                this.pushSrpgBattler(targetType, target);
                user.action(0).setTarget(1);
                target.removeCurrentAction();
            } else {
                this.pushSrpgBattler(targetType, target);
                target.removeCurrentAction();
                if (i === 0) user.action(0).setTarget(0);
            }
            if (!this.counterModeValid(targetEvents[i])) continue;
            if (userType !== targetType && target.canMove() && !user.currentAction().item().meta.srpgUncounterable) {
                target.srpgMakeNewActions();
                if (targetType === 'enemy') {
                    target.action(0).setSrpgEnemySubject($gameTroop.members().length - 1);
                }
                target.action(0).setAttack();
                var item = target.action(0).item();
                var distance = $gameSystem.unitDistance($gameTemp.activeEvent(), targetEvents[i]);
                //console.log(distance, target)
                target.setAoEDistance(distance);
                target.action(0).setTarget(0);
                target.setActionTiming(1);
                if (_counterMode === 'first' && target.canUse(item)) this._counterCount -= 1;
            }
        }

        user.setActionTiming(0);
        BattleManager.setup($dataTroops[_srpgTroopID] ? _srpgTroopID : 1, false, true);

        this.preBattleSetDirection();
        //行動回数追加スキルなら行動回数を追加する
        var addActionNum = Number(user.action(0).item().meta.addActionTimes);
        if (addActionNum && addActionNum > 0) {
            user.SRPGActionTimesAdd(addActionNum);
        }
        this._callSrpgBattle = true;
        this.eventBeforeBattle();
    };

//shoukang: slightly edited from _srpgBattleStart_MB for agi attack plus future improvement.
    Scene_Map.prototype.processMapBattle = function(userArray, targetArray){
        var user = userArray[1];
        var targetEvents = [$gameTemp.targetEvent()].concat($gameTemp.getAreaEvents());
        var action = user.action(0);
        // prepare action timing
        user.setActionTiming(0);

        // pre-skill setup
        $gameSystem.clearSrpgStatusWindowNeedRefresh();
        $gameSystem.clearSrpgBattleWindowNeedRefresh();
        this.preBattleSetDirection();

        // set up the troop and the battle party
        $gameParty.clearSrpgBattleActors();
        $gameTroop.clearSrpgBattleEnemys();
        $gameTroop.clear();
        BattleManager.setup(_srpgTroopID, false, true);
        this.pushSrpgBattler(userArray[0], userArray[1]);
        action.setSubject(user);
        var hiddenAction = action.createAoERepeatedAction();
        var addActionTimes = Number(action.item().meta.addActionTimes || 0);
        if (addActionTimes > 0) user.SRPGActionTimesAdd(addActionTimes);
        for (var i = 0; i < targetEvents.length; i++) {
            var target = $gameSystem.EventToUnit(targetEvents[i].eventId())[1];
            var targetType = $gameSystem.EventToUnit(targetEvents[i].eventId())[0];
            if (target !== user) {
                this.pushSrpgBattler(targetType, target);
            }
            var act = (i < 1 ? action : hiddenAction);
            this.srpgAddMapSkill(act, user, target);
            this.setTargetDirection(targetEvents[i])
        }

        if (userArray[0] !== targetArray[0]){        
            this._agiList = []; //make a list to store agi attacks
            this.srpgAgiAttackPlus(user, targetArray[1], targetEvents); //add agi attack for user
            this.addTargetCounterAttack(action, user, targetEvents); // add counterattack and agi attack for targets
            this.pushAgiSkilltoMapSkill(); // agi skill should happen after one round of counter attack.
        }
        this.eventBeforeBattle();
    }

    Scene_Map.prototype.addTargetCounterAttack = function(action, user, targetEvents){
        for (var i = 0; i < targetEvents.length; i++) {
            var targetArray = $gameSystem.EventToUnit(targetEvents[i].eventId());
            var target = targetArray[1];
            target.setActionTiming(1);
            if (!this.counterModeValid(targetEvents[i])) continue;
            if (target.canMove() && !action.item().meta.srpgUncounterable) {
                target.srpgMakeNewActions();
                var reaction = target.action(0);
                reaction.setSubject(target);
                reaction.setAttack();
                var distance = $gameSystem.unitDistance($gameTemp.activeEvent(), target.event());
                target.setAoEDistance(distance);
                if (!target.canUse(reaction.item())) continue;
                if (_counterMode === 'first') this._counterCount -= 1;
                var actFirst = (reaction.speed() > action.speed());
                if (_srpgUseAgiAttackPlus == 'true') actFirst = false;
                this.srpgAddMapSkill(reaction, target, user, actFirst);//action, user, target, addToFront
                this.srpgAgiAttackPlus(target, user, targetEvents);
            }
        }
    }

    Scene_Map.prototype.srpgAgiAttackPlus = function(agiUser, target, targetEvents){
        if (_srpgUseAgiAttackPlus != 'true') return;
        if (agiUser.agi <= target.agi) return;
        if (!agiUser.currentAction() || !agiUser.currentAction().item()) {
            return;
        }
        if (agiUser.currentAction().canAgiAttack()) {
            var dif = agiUser.agi - target.agi;
            var difMax = target.agi * _srpgAgilityAffectsRatio - target.agi;
            if (difMax == 0) {
                var agilityRate = 100;
            } else {
                var agilityRate = dif / difMax * 100;
            }
            if (agilityRate > Math.randomInt(100)) {
                var agiAction = agiUser.action(0);
                if (agiUser == $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1]){
                    this.addAoESkillToAgiList(agiAction, agiUser, targetEvents);
                } else {
                    this.addSkillToAgiList(agiAction, agiUser, target);
                }
            }
        }
    }

    Scene_Map.prototype.addAoESkillToAgiList = function(action, user, targetEvents, agiList){
        var hiddenAction = action.createAoERepeatedAction();
        //console.log(hiddenAction)
        for (var i = 0; i < targetEvents.length; i++) {
            var targetArray = $gameSystem.EventToUnit(targetEvents[i].eventId());
            var act = (i < 1 ? action : hiddenAction);
            //console.log(userArray[0], userArray[1], targetA[0], targetA[1])
            this.addSkillToAgiList(act, user, targetArray[1]);
        }
    };

    Scene_Map.prototype.addSkillToAgiList = function(action, user, target){
        this._agiList.push([action, user, target]);
    };

    Scene_Map.prototype.pushAgiSkilltoMapSkill = function(){
        for (var i = 0; i < this._agiList.length; i++){
            var agiInfo = this._agiList[i]
            this.srpgAddMapSkill(agiInfo[0], agiInfo[1], agiInfo[2]);
        }
        this._agiList = [];
    };

    //helper function
    Scene_Map.prototype.pushSrpgBattler = function(type, battler){
        if (type === 'actor' || battler.isActor()) $gameParty.pushSrpgBattleActors(battler);
        else if (type === 'enemy' || battler.isEnemy()) {
            $gameTroop.pushSrpgBattleEnemys(battler);
            $gameTroop.pushMembers(battler);
        }
    }

    Scene_Map.prototype.setTargetDirection = function(targetEvent) {
        if (_srpgDamageDirectionChange != 'true') return;
        if ($gameTemp.activeEvent() == targetEvent) return;  // 自分自身の時は向きを修正しない
        var differenceX = $gameTemp.activeEvent().posX() - targetEvent.posX();
        var differenceY = $gameTemp.activeEvent().posY() - targetEvent.posY();
        if ($gameMap.isLoopHorizontal() == true) {
            var event1X = $gameTemp.activeEvent().posX() > targetEvent.posX() ? targetEvent.posX() - $gameMap.width() : $gameTemp.activeEvent().posX() + $gameMap.width();
            var disX = event1X - targetEvent.posX();
            differenceX = Math.abs(differenceX) < Math.abs(disX) ? differenceX : disX;
        }
        if ($gameMap.isLoopVertical() == true) {
            var event1Y = $gameTemp.activeEvent().posY() > targetEvent.posY() ? $gameTemp.activeEvent().posY() - $gameMap.height() : $gameTemp.activeEvent().posY() + $gameMap.height();
            var disY = event1Y - targetEvent.posY();
            differenceY = Math.abs(differenceY) < Math.abs(disY) ? differenceY : disY;
        }
        if (Math.abs(differenceX) > Math.abs(differenceY)) {
            if (differenceX > 0) targetEvent.setDirection(6);
            else targetEvent.setDirection(4);
        } else {
            if (differenceY >= 0) targetEvent.setDirection(2);
            else targetEvent.setDirection(8);
        }
    };

    // counter mode for AoE
    Scene_Map.prototype.counterModeValid = function(target){
        if (!$gameTemp._activeAoE) return true;
        if (_counterMode === 'center' && target.distTo($gameTemp.areaX(), $gameTemp.areaY()) !== 0) return false;
        if (_counterMode === 'false') return false;
        if (_counterMode === 'first' && this._counterCount <= 0) return false;
        return true;
    }

    var _Scene_Map_srpgInvokeAutoUnitAction = Scene_Map.prototype.srpgInvokeAutoUnitAction;
    Scene_Map.prototype.srpgInvokeAutoUnitAction = function() {
        this._counterCount = 1;
        _Scene_Map_srpgInvokeAutoUnitAction.call(this);
    }

    var _Scene_Map_commandBattleStart = Scene_Map.prototype.commandBattleStart
    Scene_Map.prototype.commandBattleStart = function() {
        this._counterCount = 1;
        _Scene_Map_commandBattleStart.call(this);
    }

    var _Scene_Map_srpgBattlerDeadAfterBattle = Scene_Map.prototype.srpgBattlerDeadAfterBattle;
    Scene_Map.prototype.srpgBattlerDeadAfterBattle = function() {
        var activeEvent = $gameTemp.activeEvent();
        var targetEvent = $gameTemp.targetEvent();
        var allEvents = [activeEvent, targetEvent].concat($gameTemp.getAreaEvents());
        $gameTemp.clearAreaTargets();

        for (var i = 0; i < allEvents.length; i++){
            var event = allEvents[i];
            var battler = $gameSystem.EventToUnit(event.eventId())[1];
            battler.clearAoEDistance();
            if ( i > 0 && event === activeEvent) continue; //active event occurs again, ignore
            battler.setActionTiming(-1);
            battler.removeCurrentAction();
            if (battler && battler.isDead() && !event.isErased()) {
                event.erase();
                var valueId = battler.isActor() ? _existActorVarID : _existEnemyVarID;
                var oldValue = $gameVariables.value(valueId);
                $gameVariables.setValue(valueId, oldValue - 1);
            }
        }
    };

    //rewrite to give a clearer logic
    Scene_Battle.prototype.createSprgBattleStatusWindow = function() {
        this._srpgBattleStatusWindowLeft = new Window_SrpgBattleStatus(0);
        this._srpgBattleStatusWindowRight = new Window_SrpgBattleStatus(1);
        this._srpgBattleStatusWindowLeft.openness = 0;
        this._srpgBattleStatusWindowRight.openness = 0;
        if (!$gameSystem.isSRPGMode()) return;
        var userArray = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId());
        var targetArray = $gameSystem.EventToUnit($gameTemp.targetEvent().eventId());
        var areaEvents = $gameTemp.getAreaEvents();
        if (userArray[0] === 'actor') {
            this._srpgBattleStatusWindowRight.setBattler(userArray[1]);
            var targetWindow = this._srpgBattleStatusWindowLeft
        } else {
            this._srpgBattleStatusWindowLeft.setBattler(userArray[1]);
            var targetWindow = this._srpgBattleStatusWindowRight
        }
        if (userArray[1] !== targetArray[1]){
            targetWindow.setBattler(targetArray[1])
        } else if (areaEvents.length > 0){
            targetWindow.setBattler($gameSystem.EventToUnit(areaEvents[0].eventId())[1])
        }
        this.addWindow(this._srpgBattleStatusWindowLeft);
        this.addWindow(this._srpgBattleStatusWindowRight);
        BattleManager.setSrpgBattleStatusWindow(this._srpgBattleStatusWindowLeft, this._srpgBattleStatusWindowRight);
    };

    //helper function
    Game_Temp.prototype.getAreaEvents = function() {
        var events = []
        for (var i = 0; i < this._areaTargets.length; i ++ ) {
            if (this._areaTargets[i].event) events.push(this._areaTargets[i].event);
        }
        return events;
    };
    //fix bug for event before battle
    var _Scene_Map_waitingForSkill = Scene_Map.prototype.waitingForSkill
    Scene_Map.prototype.waitingForSkill = function() {
        if ($gameMap.isEventRunning()){
            return true;
        }
        return _Scene_Map_waitingForSkill.call(this);
    };

    // fix bug for not clearing area after searching targets.
    var _Scene_Map_prototype_srpgAICommand = Scene_Map.prototype.srpgAICommand
    Scene_Map.prototype.srpgAICommand = function() {
        var result = _Scene_Map_prototype_srpgAICommand.call(this);
        if (!result){
            $gameTemp.clearAreaTargets();
            $gameTemp.clearArea();
        }
        return result;
    };

    var _Game_Action_apply = Game_Action.prototype.apply
    Game_Action.prototype.apply = function(target) {
        if ($gameSystem.useMapBattle() && $gameSystem.isSubBattlePhase() == 'invoke_action'){
            var result = target.result();
            result.clear();
            result.used = this.testApply(target);
            result.missed = (result.used && Math.random() >= this.itemHit(target));
            result.evaded = (!result.missed && Math.random() < this.itemEva(target));
            result.physical = this.isPhysical();
            result.drain = this.isDrain();
            if (result.isHit()) {
                if (this.item().damage.type > 0) {
                    result.critical = (Math.random() < this.itemCri(target));
                    var value = this.makeDamageValue(target, result.critical);
                    this.executeDamage(target, value);
                }
                this.item().effects.forEach(function(effect) {
                    this.applyItemEffect(target, effect);
                }, this);
                this.applyItemUserEffect(target);
            }
        } else {
            _Game_Action_apply.call(this, target);
        }
    };

    // damage pop-up with less computation
    Sprite_Character.prototype.setupDamagePopup_MB = function() {
        var array = $gameSystem.EventToUnit(this._character.eventId());
        if ($gameSystem.isSRPGMode() && array && array[1]) {
            var battler = array[1];
            if (battler.isDamagePopupRequested()) {
                var sprite = new Sprite_Damage();
                sprite.x = this.x;
                sprite.y = this.y;
                sprite.z = 9;
                sprite.setup(battler);
                this._damages.push(sprite);
                this.parent.addChild(sprite);
                battler.clearDamagePopup();
                battler.clearResult();
            }
        }
    };
// ==========================================================================
// repeated AoE action that doesn't show animation and doesn't cost tp, mp
// ==========================================================================
    Game_Action.prototype.setHideAnimation = function(val){
        this._hideAnimation = val;
    }
    //only work with my bugfixed srpg_DynamicAction
    Game_Action.prototype.isHideAnimation = function(){
        return this._hideAnimation;
    }

    Game_Action.prototype.setEditedItem = function(item){
        this._editedItem = item;
    }    

    // set up Action that and item that has no animation and no cost for repetation
    Game_Action.prototype.createAoERepeatedAction = function(){
        var hiddenAction = new Game_Action(this.subject());
        var noCostItem = {
            ...this.item()
        }
        noCostItem.mpCost = 0;
        noCostItem.tpCost = 0;
        noCostItem.srpgDataClass = this._item._dataClass;
        hiddenAction.setItemObject(this.item());
        hiddenAction.setEditedItem(noCostItem);
        hiddenAction.setHideAnimation(true);
        return hiddenAction;
    }    

    var _Game_Action_item = Game_Action.prototype.item;
    Game_Action.prototype.item = function() {
        if (this._editedItem) return this._editedItem;
        return _Game_Action_item.call(this);
    };

    Game_Action.prototype.canAgiAttack = function(action){
        return this.isForOpponent() && !this.item().meta.doubleAction;
    }

//============================================================================================
//A hack way to get AoE counter attack distance correct.
//============================================================================================
    Game_Battler.prototype.setAoEDistance = function(val){
        this._AoEDistance = val;
    }

    Game_Battler.prototype.AoEDistance = function(){
        return this._AoEDistance;
    }

    Game_Battler.prototype.clearAoEDistance = function(){
        this._AoEDistance = undefined;
    }

    //let our faked skill item considered as skill
    var _DataManager_isSkill = DataManager.isSkill;
    DataManager.isSkill = function(item) {
        return _DataManager_isSkill.call(this, item) || (item && item.srpgDataClass === 'skill');
    };

    //A hack way to get skill correct.
    var _Game_Actor_srpgSkillMinRange = Game_Actor.prototype.srpgSkillMinRange
    Game_Actor.prototype.srpgSkillMinRange = function(skill) {
        var range = _Game_Actor_srpgSkillMinRange.call(this, skill);
        if (this.AoEDistance() !== undefined) return this.AoEDistance() >= range ? -1 : 99;
        else return range;
    };

    var _Game_Enemy_srpgSkillMinRange = Game_Enemy.prototype.srpgSkillMinRange
    Game_Enemy.prototype.srpgSkillMinRange = function(skill) {
        var range = _Game_Enemy_srpgSkillMinRange.call(this, skill);
        if (this.AoEDistance() !== undefined) return this.AoEDistance() >= range ? -1 : 99;
        else return range;
    };

    var _Game_Actor_srpgSkillRange = Game_Actor.prototype.srpgSkillRange
    Game_Actor.prototype.srpgSkillRange = function(skill) {
        var range = _Game_Actor_srpgSkillRange.call(this, skill);
        if (this.AoEDistance() !== undefined) return this.AoEDistance() > range ? -1 : 99;
        else return range;
    };

    var _Game_Enemy_srpgSkillRange = Game_Enemy.prototype.srpgSkillRange
    Game_Enemy.prototype.srpgSkillRange = function(skill) {
        var range = _Game_Enemy_srpgSkillRange.call(this, skill);
        //console.log(this, range)
        if (this.AoEDistance() !== undefined) return this.AoEDistance() > range ? -1 : 99;
        else return range;
    };

//==========================================================================================================
// Exp distribution,  turn end condition fix.
//==========================================================================================================
    //End turn immediately when active battler is dead.
    var _BattleManager_updateTurn = BattleManager.updateTurn
    BattleManager.updateTurn = function() {
        if ($gameSystem.isSRPGMode()){
            if ($gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1].isDead()){
                this.endTurn();
            }
        }
        _BattleManager_updateTurn.call(this)
    };

    var _SRPG_BattleManager_endTurn = BattleManager.endTurn;
    BattleManager.endTurn = function() {
        if ($gameSystem.isSRPGMode() == true) {
            this._phase = 'battleEnd';
            this._preemptive = false;
            this._surprise = false;
            this.refreshStatus();
            if (this._phase) {
                if ($gameParty.battleMembers().length > 0 && !$gameParty.isAllDead()) { // edit so gain exp when there are live members
                    this.processSrpgVictory();
                } else {
                    this.endBattle(3);
                }
            }
        } else {
            _SRPG_BattleManager_endTurn.call(this);
        }
    };

    BattleManager.battlerDeadEndBattle = function() {
        var userType = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[0]
        var targetType = $gameSystem.EventToUnit($gameTemp.targetEvent().eventId())[0]
        if ($gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1].isDead()){
            return true;
        }
        if (userType == targetType) return false;
        return $gameParty.isAllDead() || $gameTroop.isAllDead();
    }

    Scene_Map.prototype.battlerDeadEndBattle = BattleManager.battlerDeadEndBattle;

    //share exp when enemy cast AoE to multiple actors
    var _SRPG_BattleManager_gainExp = BattleManager.gainExp;
    BattleManager.gainExp = function() {
        if (BattleManager.shareExp()) {
            var exp = Math.round(this._rewards.exp / $gameParty.battleMembers().length)
            //console.log( $gameParty.battleMembers());
            $gameParty.battleMembers().forEach(function(actor) {
                actor.gainExp(exp);
            });
        } else {
            _SRPG_BattleManager_gainExp.call(this);
        }
    };

   //add aoe target exp
    var _SRPG_Game_Troop_expTotal = Game_Troop.prototype.expTotal;
    Game_Troop.prototype.expTotal = function() {
        if ($gameSystem.isSRPGMode() == true) {
            var activeArray = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId());
            var exp = 0;
            if (activeArray[0] == 'enemy'){
                exp += (activeArray[1].isDead() ? activeArray[1].exp() : activeArray[1].exp() * _srpgBattleExpRate);
            } else if (this.SrpgBattleEnemys() && this.SrpgBattleEnemys().length > 0) {
                for (var i = 0; i < this.members().length; i++) {
                    var enemy = this.members()[i];
                    exp += (enemy.isDead() ? enemy.exp() : enemy.exp() * _srpgBattleExpRate);
                }
            } else {
                var actor = $gameParty.battleMembers()[0];
                exp += (actor.nextLevelExp() - actor.currentLevelExp()) * _srpgBattleExpRateForActors;
            }
            return Math.round(exp);
        } else return _SRPG_Game_Troop_expTotal.call(this);
    };

    //condition to share exp
    BattleManager.shareExp = function(){
        return $gameSystem.isSRPGMode() == true && $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[0] != 'actor';
    }

    Scene_Map.prototype.gainExp = BattleManager.gainExp;

    //add check for whether AoE map battle is finished.
    Scene_Map.prototype.processSrpgVictory = function() {
        var members = $gameParty.aliveMembers();
        if (members.length > 0) {
            this.makeRewards();
            if (this.hasRewards()) {
                this._srpgBattleResultWindow.setBattler(members[0]);
                this._srpgBattleResultWindow.setRewards(this._rewards);
                var se = {};
                se.name = _rewardSe;
                se.pan = 0;
                se.pitch = 100;
                se.volume = 90;
                AudioManager.playSe(se);
                this._srpgBattleResultWindow.open();
                this.gainRewards();
                //this.initRewards();
                return true;
            }
        }
        return false;
    };

    Scene_Map.prototype.hasRewards = function() {
        return this._rewards.exp > 0 || this._rewards.gold > 0 || this._rewards.items.length > 0;
    }

//==========================================================================================================
// Map battle log window
//==========================================================================================================
    var _SRPG_SceneMap_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        this.createLogWindow();
        _SRPG_SceneMap_createAllWindows.call(this);
    };

    Scene_Map.prototype.createLogWindow = function() {
        this._logWindow = new Window_BattleLog();
        this.addWindow(this._logWindow);
        this._logWindow.hide();
    };

    var _Scene_Map_srpgAfterAction = Scene_Map.prototype.srpgAfterAction;
    Scene_Map.prototype.srpgAfterAction = function() {
        this._logWindow.clear();
        this._logWindow.hide();
        _Scene_Map_srpgAfterAction.call(this);
    };

//==========================================================================================================
// Srpg Battle Result window that can display more items and show exp according to the new distribution rule
//==========================================================================================================

    // if active event is not actor, distribute exp to all battle members.
    Window_SrpgBattleResult.prototype.setRewards = function(rewards) {
        this._rewards = {}
        this._rewards.gold = rewards.gold;
        this._rewards.items = rewards.items;
        if (BattleManager.shareExp()){
            this._rewards.exp = Math.round(rewards.exp / $gameParty.battleMembers().length);
        } else {
            this._rewards.exp = rewards.exp
        }
        this._changeExp = 30;
    };

    //change the way to draw items to support multiple items.
    Window_SrpgBattleResult.prototype.drawGainItem = function(x, y) {
        // I really wants to use hash map here but seems like not everyone has ES6 JS.
        var counts = [];
        var searched = [];
        for (var i = 0; i < this._rewards.items.length; i ++){
            var item = this._rewards.items[i];
            var idx = searched.indexOf(item);
            if (idx < 0){
                searched.push(item);
                counts.push(1);
            } else {
                counts[idx] += 1;
            }
        }
        var width = (this.windowWidth() - this.padding * 2) / 2 - this.textWidth('XXXX');
        for (var i = 0; i < searched.length; i++) {
            var posX = x + width * Math.floor(0.5 + i * 0.5);
            var posY = y - this.lineHeight() * (i % 2);
            var iconWidth = Window_Base._iconWidth + 4;
            var nameWidth = this.textWidth(searched[i].name);
            var numberX = Math.min(iconWidth + nameWidth, width) + this.textWidth('X') + this.textPadding();
            this.drawItemName(searched[i], posX, posY, width);
            this.drawItemNumber(counts[i], posX + numberX, posY, this.textWidth('XXX') + this.textPadding());
        }
    }

    Window_SrpgBattleResult.prototype.drawItemNumber = function(counts, x, y, width) {
        if (counts < 2) return;
        this.changeTextColor(this.systemColor());
        this.drawText('X', x, y, width, 'left');
        this.drawText(counts, x + this.textWidth('X') + this.textPadding(), y, width - this.textWidth('X'), 'left');
    };

    // var _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    // Game_Interpreter.prototype.updateWaitMode = function() {
    //     if (this._waitMode == "animation") {
    //         if (!this._character) return false
    //     }
    //     return _Game_Interpreter_updateWaitMode.apply(this, arguments);;
    // };

    // var _SRPG_MB_SceneMap_update = Scene_Map.prototype.update;
    // Scene_Map.prototype.update = function() {
    //     if ($gameSystem.isSubBattlePhase() == 'invoke_action' && $gameMap.isEventRunning()){
    //         return;
    //     }
    //     _SRPG_MB_SceneMap_update.call(this);
    // }


    // BattleManager.makeRewards = function() {
    //     this._rewards.gold = $gameTroop.goldTotal();
    //     this._rewards.exp = $gameTroop.expTotal();
    //     this._rewards.items = $gameTroop.makeDropItems();
    // };
    // this is a single target version, it can be generalized to AoE targets so this is just for backup.
    // Scene_Map.prototype.processSceneBattle = function(userArray, targetArray){
    //     var userType = userArray[0];
    //     var user = userArray[1];
    //     var targetType = targetArray[0];
    //     var target = targetArray[1];
    //     $gameParty.clearSrpgBattleActors();
    //     $gameTroop.clearSrpgBattleEnemys();

    //     this.pushSrpgBattler(userType, user);
    //     if (userType === 'enemy') user.action(0).setSrpgEnemySubject(0);
    //     //console.log(user === target);
    //     if (user === target){
    //         user.action(0).setTarget(0);
    //     } else if (userType === targetType) {
    //         this.pushSrpgBattler(targetType, target);
    //         user.action(0).setTarget(1);
    //     } else {
    //         this.pushSrpgBattler(targetType, target);
    //         user.action(0).setTarget(0);            
    //     }

    //     user.setActionTiming(0);
    //     BattleManager.setup($dataTroops[_srpgTroopID] ? _srpgTroopID : 1, false, true);

    //     //対象の行動を設定
    //     if (userType !== targetType && target.canMove() && !user.currentAction().item().meta.srpgUncounterable) {
    //         target.srpgMakeNewActions();
    //         if (targetType === 'enemy') target.action(0).setSrpgEnemySubject(0);
    //         target.action(0).setAttack();
    //         target.action(0).setTarget(0);
    //         target.setActionTiming(1);
    //     }

    //     this.preBattleSetDirection();
    //     //行動回数追加スキルなら行動回数を追加する
    //     var addActionNum = Number(user.action(0).item().meta.addActionTimes);
    //     if (addActionNum && addActionNum > 0) {
    //         user.SRPGActionTimesAdd(addActionNum);
    //     }
    //     this._callSrpgBattle = true;
    //     this.eventBeforeBattle();
    // }

})();
