//-----------------------------------------------------------------------------
// SRPG_DynamicAction.js
// Copyright (c) 2020 SRPG Team. All rights reserved. This is a Shoukang Fixed version
// Released under the MIT license.
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @target MV
 * @plugindesc v1.00 Call DynamicAnimationMap and MotionMap during SRPG map battle
 * @author  SRPG Team
 * @base SRPG_core
 * @orderAfter SRPG_core
 * @orderAfter SRPG_AoE
 * @orderAfter NRP_DynamicAnimation
 * @orderAfter NRP_DynamicAnimationMap
 *
 * @help Call DynamicAnimationMap and DynamicMotionMap
 * when SRPG_core.js map battle is executed.
 *
 * Shoukang's fix: when casting and on map AoE, counter attacks now show up correctly. Add battle log compatibility with AoE animation plugin
 * 
 * [Based on works by Takeshi Sunagawa (http://newrpg.seesaa.net/)]
 *
 * You need the following plugins to use it.
 * - SRPG_core.js
 * - SRPG_AoE.js
 * - MRP_DynamicAnimation.js
 * - MRP_DynamicAnimationMap.js
 * 
 * Also, this plugin should be placed below the following plugins.
 * - SRPG_core.js
 * - SRPG_AoE.js
 * - NRP_DynamicAnimation.js
 * - NRP_DynamicAnimationMap.js
 * 
 * ==========Plugin parameter details==========
 * ◆Batch execution of actions
 * If you turn it on, it will do all actions first
 * and show damage later in batches.
 * This allows for a high degree of flexibility in staging.
 * Note, however, that the production will no longer be affected
 * by the magic reflection process.
 * 
 * For each skill, you can switch by filling in the note below.
 * <D-Setting:BatchActionOn>
 * <D-Setting:BatchActionOff>
 * 
 * ==========Cooperation with area effects==========
 * SRPG_AoE.js area effects are also supported.
 * If you set a skill to an animation with a position of 'screen',
 * the action will be performed towards the center of the selected area.
 * 
 * You can also specify a "whole" template to force a position to "screen".
 * For example, set the skill to a single animation and do the following
 * 
 * ---------------------------------
 * <srpgRange:3>
 * <srpgAreaRange:3>
 *
 * <D-Motion:crash&jump&whole/>
 * <D-Animation:whole&wait>
 * id = 88
 * </D-Animation>
 * <D-Animation>
 * id = 86
 * </D-Animation>
 * <D-Motion:return/>
 * ---------------------------------
 * 
 * The actor moves to the center of the area and performs 88 animation.
 * A further 86 animation should be executed for each target.
 * 
 * ==========Damage indication==========
 * DynamicAnimation and Motion damage display features are available.
 * For example, the following will show damage in the middle of an action.
 * 
 * <D-Animation:damage/>
 * 
 * However, due to specification restrictions,
 * if there are multiple targets in an area effect,
 * only the first one will work. Please note.
 * 
 * ==========<directionalAnimation>==========
 * You can also use the <directionalAnimation> feature in SRPG_core.js,
 * but the usage is a little different.
 * 
 * <directionalAnimation:20> changes the animation
 * for ID=20 used in <D-Animation>.
 * 
 * <directionalAnimation:10,20> Multiple specifications are possible.
 * <directionalAnimation> If no ID is specified, all animations are targeted.
 * 
 * [Terms]
 * Released under the MIT license.
 * http://opensource.org/licenses/mit-license.php
 * 
 * @param BatchAction
 * @type boolean
 * @default true
 * @desc Execute actions in batches and postpone the damage display.
 * If it's off, the behavior is in line with SRPG_core standards.
 * 
 * @param DamageInterval
 * @type number
 * @default 30
 * @desc The damage display interval for skills that are set to repeat.
 * This only applies when "BatchAction" is on.
 */

/*:ja
 * @target MV
 * @plugindesc v1.00 SRPGマップ戦闘時、DynamicAnimationMap&MotionMapを呼び出します。
 * @author 砂川赳（http://newrpg.seesaa.net/）
 * @base SRPG_core
 * @orderAfter SRPG_core
 * @orderAfter SRPG_AoE
 * @orderAfter NRP_DynamicAnimation
 * @orderAfter NRP_DynamicAnimationMap
 *
 * @help SRPG_core.jsのマップ戦闘実行時に
 * DynamicAnimationMapおよびDynamicMotionMapを呼び出します。
 * 
 * 使用には以下のプラグインが必要です。
 * - SRPG_core.js
 * - MRP_DynamicAnimation.js
 * - MRP_DynamicAnimationMap.js
 * 
 * また、このプラグインは以下のプラグインよりも下に配置してください。
 * - SRPG_core.js
 * - SRPG_AoE.js
 * - NRP_DynamicAnimation.js
 * - NRP_DynamicAnimationMap.js
 * 
 * ==========プラグインパラメータの詳細==========
 * ◆アクションを一括実行
 * オンにすると先に全てのアクションを行い、後でまとめてダメージ表示をするようになります。
 * これにより自由度の高い演出が可能となります。
 * ただし、演出が魔法反射処理の影響を受けなくなるので注意してください。
 * 
 * スキル毎に、以下をメモ欄に記入すれば切替も可能です。
 * <D-Setting:BatchActionOn>
 * <D-Setting:BatchActionOff>
 * 
 * ==========エリア効果との連携==========
 * SRPG_AoE.jsによるエリア効果にも対応しています。
 * 位置が『画面』のアニメーションをスキルに設定すると、
 * 選択エリアの中央に向かってアクションが実行されるようになります。
 * 
 * また『whole』テンプレートを指定すれば、強制的に位置を『画面』に変更できます。
 * 例えば、スキルに単体向けのアニメーションを設定して以下を実行してください。
 * 
 * ---------------------------------
 * <srpgRange:3>
 * <srpgAreaRange:3>
 *
 * <D-Motion:crash&jump&whole/>
 * <D-Animation:whole&wait>
 * id = 88
 * </D-Animation>
 * <D-Animation>
 * id = 86
 * </D-Animation>
 * <D-Motion:return/>
 * ---------------------------------
 * 
 * アクターがエリアの中央に移動して、88のアニメーションを実行。
 * さらに86のアニメーションを各対象に向けて実行するという流れになるはずです。
 * 
 * ==========ダメージ表示==========
 * DynamicAnimationおよびMotionのダメージ表示機能が使用できます。
 * 例えば、下記のように指定すれば、アクションの途中でもダメージが表示されます。
 * 
 * <D-Animation:damage/>
 * 
 * ただし、仕様上の制約によりエリア効果で複数の対象がある場合は、
 * 最初の１体しか機能しません。ご注意ください。
 * 
 * ==========<directionalAnimation>==========
 * SRPG_core.jsの<directionalAnimation>機能も使用可能ですが、
 * 使い方が少し異なります。
 * 
 * <directionalAnimation:20> と設定した場合、
 * <D-Animation>内で使用されているID=20のアニメーションが変化します。
 * 
 * <directionalAnimation:10,20> というように複数指定も可能です。
 * <directionalAnimation> IDの指定がない場合、全アニメーションを対象とします。
 * 
 * ■利用規約
 * 当プラグインはMITライセンスに基づき公開されています。
 * http://opensource.org/licenses/mit-license.php
 * 
 * @param BatchAction
 * @text アクションを一括実行
 * @type boolean
 * @default true
 * @desc アクションを一括で実行し、ダメージ表示を後回しにします。
 * オフならSRPG_coreの標準に沿った動作になります。
 * 
 * @param DamageInterval
 * @text ダメージ表示間隔
 * @type number
 * @default 30
 * @desc 連続回数が設定されているスキルのダメージ表示間隔です。
 * 『アクションを一括実行』がオンの場合のみ適用されます。
 */
(function() {
"use strict";

function toBoolean(val, def) {
    if (val === "" || val === undefined) {
        return def;
        
    } else if (typeof val === "boolean") {
        return val;
    }
    return val.toLowerCase() == "true";
}
function toNumber(str, def) {
    return isNaN(str) ? def : +(str || def);
}

const parameters = PluginManager.parameters("SRPG_DynamicAction");
const _batchAction = toBoolean(parameters["BatchAction"], true);
const _damageInterval = toNumber(parameters["DamageInterval"], 30);

const srpgCoreParameters = PluginManager.parameters('SRPG_core');
const _animDelay = Number(srpgCoreParameters['Animation Delay'] || -1);

/**
 * ●invoke skill effects
 * ※Function of SRPG_Core.
 */
const _Scene_Map_srpgInvokeMapSkill = Scene_Map.prototype.srpgInvokeMapSkill;
Scene_Map.prototype.srpgInvokeMapSkill = function(data) {
    const action = data.action;
    const item = action.item();
    const interpreter = $gameMap._interpreter;
    interpreter.dynamicNoWaitControl = undefined;
    const user = data.user;
    const target = data.target;
    var animation = item.animationId;
    //shoukang get animation id right
    if (animation < 0) animation = (user.isActor() ? user.attackAnimationId1() : user.attackAnimationId());
    if (!action.isDynamicAnimation(animation) && action.area() <= 0) {

        //shoukang edit to show battle log
        if (data.phase == 'start') {
            if (!user.canMove() || !user.canUse(action.item()) || this.battlerDeadEndBattle()) {
                data.phase = 'cancel';
                this._srpgSkillList.unshift(data);
                // Show the results
                return srpgInvokeMapSkillResult(user, target);
            }
            if (!action._editedItem){
                this._logWindow.show();
                this._logWindow.displayAction(user, action.item());
            }
        }

        return _Scene_Map_srpgInvokeMapSkill.apply(this, arguments);
    }

    // start
    if (data.phase == 'start' && action.isBatchAction()) {
        if (!user.canMove() || !user.canUse(action.item()) || this.battlerDeadEndBattle()) {
            data.phase = 'cancel';
            this._srpgSkillList.unshift(data);
            // Show the results
            return srpgInvokeMapSkillResult(user, target);
        }

        //shoukang edit to show battle log
        user.useItem(action.item());
        if (!action._editedItem){
            this._logWindow.show();
            this._logWindow.displayAction(user, action.item());
        }

        //shoukang add condition check
        var targetsEventId = undefined;
        //aoe
        if (user.event() == $gameTemp.activeEvent() && !action.isHideAnimation()) {
            targetsEventId = makeTargetsEventIdInArea($gameTemp.originalAreaTargets(), target, data.count);
        } else if (!action.isHideAnimation()){ // not AoE
            targetsEventId = [target.event().eventId()];
        }

        if (targetsEventId){
            interpreter.pluginCommand("nrp.animation.wait", []);
            interpreter.pluginCommand("nrp.animation.subject", [user.event().eventId()]);
            // A subject battler used to reference normal attacks, etc.
            interpreter.pluginCommand("nrp.animation.subjectBattler", [user]);

            interpreter.pluginCommand("nrp.animation.target", [targetsEventId]);
            if (action.isItem()) {
                interpreter.pluginCommand("nrp.animation.item", [item.id]);
            } else {
                interpreter.pluginCommand("nrp.animation.skill", [item.id]);
            }

            // time-based delay
            this.setDynamicSkillWait(item, interpreter);

            var castAnim = false;
            // cast animation, is a skill, isn't an attack or guard
            if (action.item().castAnimation && action.isSkill() && !action.isAttack() && !action.isGuard()) {
                user.event().requestAnimation(action.item().castAnimation);
                castAnim = true;
            }
            // target animation
            if (action.item().meta.targetAnimation) {
                $gamePlayer.requestAnimation(Number(action.item().meta.targetAnimation));
                castAnim = true;
            }
        }

        // check for reflection
        if (user != target && Math.random() < action.itemMrf(target)) {
            data.phase = 'reflect';
        } else {
            data.phase = 'animation';
        }
        data.isFirstEffect = true;
        this._srpgSkillList.unshift(data);

        // Show the results
        return srpgInvokeMapSkillResult(user, target);

    // show skill animation
    } else if (data.phase == 'animation') {
        if (!action.isBatchAction()) {
            // Call NRP_DynamicAnimationMap.js
            interpreter.pluginCommand("nrp.animation.wait", []);
            interpreter.pluginCommand("nrp.animation.subject", [user.event().eventId()]);
            // A subject battler used to reference normal attacks, etc.
            interpreter.pluginCommand("nrp.animation.subjectBattler", [user]);
            interpreter.pluginCommand("nrp.animation.target", [target.event().eventId()]);
            if (action.isItem()) {
                interpreter.pluginCommand("nrp.animation.item", [item.id]);
            } else {
                interpreter.pluginCommand("nrp.animation.skill", [item.id]);
            }

            // time-based delay
            this.setDynamicSkillWait(item, interpreter);

        // Set damage interval
        } else {
            // Wait for all but the first time.
            if (!data.isFirstEffect) {
                this.setSkillWait(_damageInterval);
            }
            data.isFirstEffect = undefined;
        }

        data.phase = 'effect';
        this._srpgSkillList.unshift(data);
        
        // Show the results
        return srpgInvokeMapSkillResult(user, target);

    // reflected magic
    } else if (data.phase == 'reflect') {
        target.performReflection();
        if (target.reflectAnimationId && !action.isBatchAction()) {
            // Call NRP_DynamicAnimationMap.js
            interpreter.pluginCommand("nrp.animation.wait", []);
            interpreter.pluginCommand("nrp.animation.subject", [user.event().eventId()]);
            // Set target user
            interpreter.pluginCommand("nrp.animation.target", [user.event().eventId()]);
            // A subject battler used to reference normal attacks, etc.
            interpreter.pluginCommand("nrp.animation.subjectBattler", [user]);
            if (action.isItem()) {
                interpreter.pluginCommand("nrp.animation.item", [item.id]);
            } else {
                interpreter.pluginCommand("nrp.animation.skill", [item.id]);
            }
        }

        data.target = user;
        data.phase = 'animation';
        this._srpgSkillList.unshift(data);

        // Show the results
        return srpgInvokeMapSkillResult(user, target);
    }

    return _Scene_Map_srpgInvokeMapSkill.apply(this, arguments);
};

/**
 * ●Adjusting skill wait for DynamicAction
 */
Scene_Map.prototype.setDynamicSkillWait = function(item, interpreter) {
    // time-based delay
    var delay = _animDelay;
    if (item.meta.animationDelay) delay = Number(item.meta.animationDelay);
    if (delay >= 0) {
        this.setSkillWait(delay);
        // Wait control is not performed on the DynamicAction side.
        interpreter.dynamicNoWaitControl = true;
    }
}

/**
 * ●エリア内のイベントを元に、DynamicAnimationMap用の対象を取得する。
 * ●Make targets for the DynamicAnimationMap based on the events in the area.
 */
function makeTargetsEventIdInArea(areaTargets, target, count) {
    let targetsEventId = "";
    // Consider Repeat
    for (let i = 0; i < count; i++) {
        // area
        if (areaTargets.length > 0) {
            // connect targets ID
            for (const areaAction of areaTargets) {
                if (targetsEventId.length > 0) {
                    targetsEventId += ",";
                }
                targetsEventId += areaAction.event.eventId();
            }
        // single
        } else {
            if (targetsEventId.length > 0) {
                targetsEventId += ",";
            }
            targetsEventId += target.event().eventId();
        }
    }
    return targetsEventId;
}

/**
 * ●Show the results
 */
function srpgInvokeMapSkillResult(user, target) {
    user.srpgShowResults();
    target.srpgShowResults();
    return true;
}

/**
 * ●check if we're still waiting for a skill to finish
 * ※Function of SRPG_Core.
 */
const _Scene_Map_waitingForSkill = Scene_Map.prototype.waitingForSkill;
Scene_Map.prototype.waitingForSkill = function() {
    const result = _Scene_Map_waitingForSkill.apply(this, arguments);
    const interpreter = $gameMap._interpreter;

    // Wait control is not performed on the DynamicAction side.
    if (interpreter.dynamicNoWaitControl) {
        return result;

    // Wait for DynamicAnimation
    } else if (interpreter.isDynamicAnimationPlaying()) {
        if (interpreter.dynamicDuration > 0) {
            interpreter.dynamicDuration--;
        }
        return true;
    }

    return result;
};

const _Game_Temp_initialize = Game_Temp.prototype.initialize;
Game_Temp.prototype.initialize = function() {
    _Game_Temp_initialize.call(this);
    this._originalAreaTargets = [];
};

/**
 * ※Function of SRPG_AoE.js
 */
const _Game_Temp_clearAreaTargets = Game_Temp.prototype.clearAreaTargets;
Game_Temp.prototype.clearAreaTargets = function() {
    _Game_Temp_clearAreaTargets.apply(this, arguments);

    this._originalAreaTargets = [];
};

/**
 * ※Function of SRPG_AoE.js
 */
// Find all the targets within the current AoE
const _Game_Temp_selectArea  = Game_Temp.prototype.selectArea;
Game_Temp.prototype.selectArea = function(user, skill) {
    const originalResult = _Game_Temp_selectArea.apply(this, arguments);

    // Since the contents of areaTargets are shifted, the initial value is retained.
    if (originalResult) {
        this._originalAreaTargets = this.areaTargets().clone();
    }

    return originalResult;
}

/**
 * 【New】Original targets in the area.
 */
Game_Temp.prototype.originalAreaTargets = function() {
    return this._originalAreaTargets;
};

/**
 * 【New】Whether or not to execute the performance in batches?
 */
Game_Action.prototype.isBatchAction = function() {
    if (this.existDynamicSetting("BatchActionOn")) {
        return true;
    } else if (this.existDynamicSetting("BatchActionOff")) {
        return false;
    } else if (_batchAction) {
        return true;
    }
    return false;
};

/**
 * ●Get a character or a follower.
 * ※Function of NRP_DynamicAnimationMap
 */
const _Game_Interpreter_characterAndFollower = Game_Interpreter.prototype.characterAndFollower;
Game_Interpreter.prototype.characterAndFollower = function(param) {
    const result = _Game_Interpreter_characterAndFollower.apply(this, arguments);

    // If the original result is null and useMapBattle, retrieve the value.
    // workaround for this.isOnCurrentMap() to be false.
    if (result == null && $gameSystem.useMapBattle()) {
        return $gameMap.event(param > 0 ? param : this._eventId);
    }
};

/**
 * 【New】Define an alias for attackAnimationId1 as well, to be referenced from DynamicAnimation.
 */
Game_Enemy.prototype.attackAnimationId1 = function() {
    return this.attackAnimationId();
};

/**
 * ●アニメーションデータを取得する。
 * ※Function of NRP_DynamicAnimationMap
 */
const _BaseAnimation_getAnimation = BaseAnimation.prototype.getAnimation;
BaseAnimation.prototype.getAnimation = function (id) {
    const action = this.action;

    // directional target animation
    const directionalAnimation = action.item().meta.directionalAnimation;
    // Case <directionalAnimation>
    if (directionalAnimation === true) {
        const dir = this.action.subject().event().direction() / 2 - 1;
        id = dir + Number(id);

    // Case <directionalAnimation:x>
    } else if (directionalAnimation) {
        // Verify the existence of each comma-separated value.
        const isDirectional = directionalAnimation.split(",").some(function(directionalId) {
            return directionalId == id;
        });

        if (isDirectional) {
            const dir = this.action.subject().event().direction() / 2 - 1;
            id = dir + Number(id);
        }
    }

    return _BaseAnimation_getAnimation.call(this, id);
};

/**
 * ●DynamicAnimationの途中でダメージ制御を行う
 * ※Function of NRP_DynamicAnimation
 */
const _BattleManager_dynamicDamageControl = BattleManager.dynamicDamageControl;
BattleManager.dynamicDamageControl = function(dynamicAction) {
    if ($gameSystem.useMapBattle()) {
        // I don't make a distinction between damage and damageAll.
        if (dynamicAction.damage || dynamicAction.damageAll) {
            // Instant damage display.
            const scene = SceneManager._scene;
            const srpgSkillList = scene._srpgSkillList || [];
            const data = srpgSkillList[0];
            if (data.count === 0) {
                return;
            }
            data.phase = 'effect';
            data.isFirstEffect = undefined;
            srpgSkillList.unshift(data);
            scene.srpgUpdateMapSkill();
        }
        return;
    }

    _BattleManager_dynamicDamageControl.apply(this, arguments);
};

/****************************************************
 * When SRPG_AoE is enabled
 ****************************************************/
if (Game_Temp.prototype.areaX) {
    /**
     * ●モーション主体から見て直近の対象の隣接Ｘ座標を求める
     * ※Function of NRP_DynamicAnimationMap
     */
    const _Sprite_Character_nearX = Sprite_Character.prototype.nearX;
    Sprite_Character.prototype.nearX = function(b, position) {
        // 対象が画面の場合、選択したグリッドを基準にする。
        // If the target is a screen, it will be based on the selected grid.
        if (position == 3) {
            const grid = getGridInfo($gameTemp.areaX(), $gameTemp.areaY());
            const coordinates = this.getNearCoordinate(grid);
            return coordinates.x;
        }

        return _Sprite_Character_nearX.apply(this, arguments);
    }

    /**
     * ●モーション主体から見て直近の対象の隣接Ｙ座標を求める
     * ※Function of NRP_DynamicAnimationMap
     */
    const _Sprite_Character_nearY = Sprite_Character.prototype.nearY;
    Sprite_Character.prototype.nearY = function(b, position) {
        // 対象が画面の場合、選択したグリッドを基準にする。
        // If the target is a screen, it will be based on the selected grid.
        if (position == 3) {
            const grid = getGridInfo($gameTemp.areaX(), $gameTemp.areaY());
            const coordinates = this.getNearCoordinate(grid);
            return coordinates.y;
        }

        return _Sprite_Character_nearY.apply(this, arguments);
    }

    /**
     * ●モーション主体から見て直近の対象の隣接Ｘ座標を求める
     * ※Function of NRP_DynamicAnimationMap
     */
    const _Sprite_Character_crashX = Sprite_Character.prototype.crashX;
    Sprite_Character.prototype.crashX = function(b, position) {
        // 対象が画面の場合、選択したグリッドを基準にする。
        // If the target is a screen, it will be based on the selected grid.
        if (position == 3) {
            return $gameMap.mapToCanvasX($gameTemp.areaX());
        }

        return _Sprite_Character_crashX.apply(this, arguments);
    }

    /**
     * ●モーション主体から見て直近の対象の隣接Ｙ座標を求める
     * ※Function of NRP_DynamicAnimationMap
     */
    const _Sprite_Character_crashY = Sprite_Character.prototype.crashY;
    Sprite_Character.prototype.crashY = function(b, position) {
        // 対象が画面の場合、選択したグリッドを基準にする。
        // If the target is a screen, it will be based on the selected grid.
        if (position == 3) {
            return $gameMap.mapToCanvasY($gameTemp.areaY()) + $gameMap.tileWidth() / 2;
        }

        return _Sprite_Character_crashY.apply(this, arguments);
    }

    /**
     * ●モーション主体から見て最遠の対象の隣接Ｘ座標を求める
     * ※Function of NRP_DynamicAnimationMap
     */
    const _Sprite_Character_backX = Sprite_Character.prototype.backX;
    Sprite_Character.prototype.backX = function(b, position) {
        // 対象が画面の場合、選択したグリッドを基準にする。
        // If the target is a screen, it will be based on the selected grid.
        if (position == 3) {
            const grid = getGridInfo($gameTemp.areaX(), $gameTemp.areaY());
            const coordinates = this.getBackCoordinate(grid);
            return coordinates.x;
        }

        return _Sprite_Character_backX.apply(this, arguments);
    }

    /**
     * ●モーション主体から見て最遠の対象の隣接Ｙ座標を求める
     * ※Function of NRP_DynamicAnimationMap
     */
    const _Sprite_Character_backY = Sprite_Character.prototype.backY;
    Sprite_Character.prototype.backY = function(b, position) {
        // 対象が画面の場合、選択したグリッドを基準にする。
        // If the target is a screen, it will be based on the selected grid.
        if (position == 3) {
            const grid = getGridInfo($gameTemp.areaX(), $gameTemp.areaY());
            const coordinates = this.getBackCoordinate(grid);
            return coordinates.y;
        }

        return _Sprite_Character_backY.apply(this, arguments);
    }

    /**
     * ●標準画面Ｘ座標取得
     * ※Function of NRP_DynamicAnimation
     */
    const _BaseAnimation_getScreenX = BaseAnimation.prototype.getScreenX;
    BaseAnimation.prototype.getScreenX = function (b) {
        if ($gameSystem.useMapBattle()) {
            return $gameMap.mapToCanvasX($gameTemp.areaX());
        }

        return _BaseAnimation_getScreenX.apply(this, arguments);
    };

    /**
     * ●標準画面Ｙ座標取得
     * ※Function of NRP_DynamicAnimation
     */
    const _BaseAnimation_getScreenY = BaseAnimation.prototype.getScreenY;
    BaseAnimation.prototype.getScreenY = function (b) {
        if ($gameSystem.useMapBattle()) {
            return $gameMap.mapToCanvasY($gameTemp.areaY()) + $gameMap.tileWidth() / 2;
        }

        return _BaseAnimation_getScreenY.apply(this, arguments);
    };
}

function getGridInfo(mapX, mapY) {
    const grid = [];
    grid.width = $gameMap.tileWidth();
    grid.height = $gameMap.tileHeight();
    // マップ座標を画面座標に変換
    // Convert map coordinates to screen coordinates
    // ※Function of NRP_DynamicAnimationMap
    grid.x = $gameMap.mapToCanvasX(mapX);
    grid.y = $gameMap.mapToCanvasY(mapY) + grid.height / 2;
    return grid;
}

Game_Action.prototype.isHideAnimation = function(){
    return this._hideAnimation;
}

})();
