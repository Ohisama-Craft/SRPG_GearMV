//-----------------------------------------------------------------------------
// SRPG_MapviewBattler.js
// Copyright (c) 2020 SRPG Team. All rights reserved.
// Released under the MIT license.
// http://opensource.org/licenses/mit-license.php
//=============================================================================
/*:
 * @plugindesc Create "motions" for map event characters
 * @author SRPG Team
 *
 * @param Motions
 * @type struct<MotionData>[]
 * @desc List of standard motions available for events
 *
 * @param Compatability Mode
 * @type boolean
 * @desc Enable if another plugin changes how character animations loop
 * @on YES
 * @off NO
 * @default false
 *
 * -------------------------------------------------------------------------------
 * @param Default Motions
 *
 * @param Selected
 * @parent Default Motions
 * @type text
 * @desc Motion played by the active unit
 * Preferrably looping
 *
 * @param Attack
 * @parent Default Motions
 * @type text
 * @desc Default motion when using Attack
 * Preferrably non-looping
 *
 * @param Guard
 * @parent Default Motions
 * @type text
 * @desc Default motion when using Guard
 * Preferrably non-looping
 *
 * @param Physical Skill
 * @parent Default Motions
 * @type text
 * @desc Default motion when using a physical skill
 * Preferrably non-looping
 *
 * @param Magical Skill
 * @parent Default Motions
 * @parent Default Motions
 * @type text
 * @desc Default motion when using a magical skill
 * Preferrably non-looping
 *
 * @param Certain Hit Skill
 * @parent Default Motions
 * @type text
 * @desc Default motion when using a certain hit skill
 * Preferrably non-looping
 *
 * @param Use Item
 * @parent Default Motions
 * @type text
 * @desc Default motion when using an item
 * Preferrably non-looping
 *
 * @param Damage
 * @parent Default Motions
 * @type text
 * @desc Motion when taking damage
 * Preferrably non-looping
 *
 * @param Evade
 * @parent Default Motions
 * @type text
 * @desc Motion when evading
 * Preferrably non-looping
 *
 *
 * @param Screen Shake
 * @desc Shake screen when dealing damage
 * @type boolean
 * @on ON
 * @off OFF
 * @default true
 *
 * @param Power
 * @parent Screen Shake
 * @type string
 * @default 1+damage/50
 *
 * @param Speed
 * @parent Screen Shake
 * @type string
 * @default critical ? 6 : 4
 *
 * @param Duration
 * @parent Screen Shake
 * @type string
 * @default 10
 * -------------------------------------------------------------------------------
 *
 * @help
 * Based on DRQ_EventMotions.js, SRPG_MapBattle_Motions.js by Dr. Q
 * and NRP_DynamicMotionMapEvent.js  by Takeshi Sunagawa
 *
 * Creates a system of "motions" for use with on-map events and players, similar
 * to the one available in side-view battles. It can also be used to make
 * reusable animations for cutscenes, map events, or other battle systems.
 *
 * By default, the index points to the event's current file, from 0 to 7. If you 
 * need more than 8 motions, you can make use of the suffix- for example, if the
 * event normally uses hero.png, a motion with the suffix _dead would use
 * hero_dead.png. If you called the same animation on an event using villain.png,
 * it would instead use villain_dead.png.
 * 
 *
 * It also lets you configure a screen shake on dealing damage, for more impact.
 * All three parameters are formulas, and you can use the following variables;
 * "damage" is the raw damage dealt to the subject
 * "critical" is true if the effect was a critical hit
 * "damageRate" is damage / subject's max health, for scaling impact
 *
 * Actor notetags:
 * <srpgBattleSuffix:X>  add a suffix to the actor's sprite name in battle
 * <srpgBattleIndex:X>   change the actor's sprite index in battle
 * 
 * Actor, Class, Enemy, Weapon, Armor, and State notetag:
 * <noMotions>  this character will not play new motions
 * 
 * State notetag:
 * <idleMotion:X>  repeats motion X when no other motion is playing
 * bypasses the noMotions tag
 *
 * Weapon notetag:
 * <srpgAttackMotion:X>  use motion 'X' for the wielder's Attack
 * 
 * Skill / Item notetags:
 * <srpgMotion:X>         use motion 'X' for the skill / item
 * <useSrpgAttackMotion>  use the character's default attack motion for the skill
 * <srpgCastMotion:X>     use motion 'X' before skill / item executes
 * 
 * New script call:
 * event.playReactMotion('motion') plays the motion with the "reaction" flag, which
 * stops map skills from waiting on its completion. Good for custom motions as part
 * of skills or items, beyond the usual damage/evasion.
 *
 * Script calls:
 *
 * event.playMotion('motion') starts the event playing the specified motion
 * event.clearMotion()        stops any motions in progress
 * event.motion()             returns the current motion, or null if there isn't one
 * event.hasLoopingMotion()   returns True if the event is playing a looping motion
 * event.hasSingleMotion()    returns True if the event is playing a non-looping motion
 * event.waitForMotion()      in move routes, waits for the current (non-looping) motion
 * 
 * You can also make a new motion on the fly with playCustomMotion:
 * event.playCustomMotion({index: X, loop: true, wait: Y})
 * If omitted, loop defaults to "false", and wait defaults to 0. Index is required.
 */

/*~struct~MotionData:
 * @param Name
 * @desc The name used to call this motion
 * Capitalization doesn't matter
 * @type text
 *
 * @param Index
 * @desc The index on the character sheet for the motion
 * -1 to use the default index
 * @type number
 * @min -1
 * @default 0
 *
 * @param Suffix
 * @desc Suffix to add to the character sheet filename
 * @type text
 *
 * @param Wait
 * @desc How long to wait between frames for this motion
 * Set to 0 to keep the setting from the user's speed
 * @type number
 * @min 0
 * @default 0
 *
 * @param Loop
 * @desc What the motion does when it finishes playing
 * Looping uses the same 0-1-2-1 pattern as normal walking
 * @type select
 * @option Play Once
 * @value 0
 * @option Hold Last Frame
 * @value 1
 * @option Loop
 * @value 2
 * @default 0
 */

(function(){

function toBoolean(str) {
    if (str == true) {
        return true;
    }
    return (str == "true") ? true : false;
}

	var parameters = PluginManager.parameters('SRPG_MapviewBattler');
	// the motion list is fairly complex, actually
	Sprite_Character.MOTIONS = {};
	if (parameters['Motions']) {
		var _motionList = JSON.parse(parameters['Motions']);
		for (var i = 0; i < _motionList.length; i++) {
			if (_motionList[i]) {
				var _motion = JSON.parse(_motionList[i]);
				if (!_motion.Name || _motion.Name.length == 0) continue;
				Sprite_Character.MOTIONS[_motion.Name.toUpperCase()] = {
					index: Number(_motion.Index || 0),
					wait: Number(_motion.Wait || 0),
					loop: Number(_motion.Loop) == 2,
					hold: Number(_motion.Loop) == 1,
					suffix: _motion.Suffix || ''
				};
			}
		}
	}
	var _compat = !!eval(parameters['Compatability Mode']) ? 0 : -1;

// ------------------------------------------------------------------------------------------------
	var _default = {};
	_default.selected = parameters['Selected'];
	_default.attack = parameters['Attack'];
	_default.physical = parameters['Physical Skill'];
	_default.magical = parameters['Magical Skill'];
	_default.certain = parameters['Certain Hit Skill'];
	_default.item = parameters['Use Item'];
	_default.damage = parameters['Damage'];
	_default.evade = parameters['Evade'];

	var _shake = !!eval(parameters['Screen Shake']);
	var _shakePower = parameters['Power'];
	var _shakeSpeed = parameters['Speed'];
	var _shakeFrames = parameters['Duration'];
// ------------------------------------------------------------------------------------------------


//====================================================================
// Add motions to events
//====================================================================

	// initialize the motion property
	_characterInitMembers = Game_CharacterBase.prototype.initMembers;
	Game_CharacterBase.prototype.initMembers = function() {
		_characterInitMembers.call(this);
		this._motion = null;
	};

	// get the data object for the current motion
	Game_CharacterBase.prototype.motion = function() {
		return this._motion;
	};

	// check if there's a looping motion playing
	Game_CharacterBase.prototype.hasLoopingMotion = function() {
		var motion = this.motion();
		return !!(motion && (motion.loop || motion.hold));
	};

	// check if there's a non-looping motion playing
	Game_CharacterBase.prototype.hasSingleMotion = function() {
		var motion = this.motion();
		return !!(motion && !motion.loop && !motion.hold);
	};

	// remove any active motion
	Game_CharacterBase.prototype.clearMotion = function() {
		this._motion = null;
		this._animationCount = 0;
		this.resetPattern();
	};

	// run a preset motion
	Game_CharacterBase.prototype.playMotion = function(motion, wait) {
		if (!motion) return;
		this.playCustomMotion(Sprite_Character.MOTIONS[motion.toUpperCase()], wait);
	};

	// run a motion created on the fly
	Game_CharacterBase.prototype.playCustomMotion = function(motionData, wait) {
		this._motion = motionData;
		if (this._motion) {
			motionData.loop ? this.resetPattern() : this._pattern = 0;
			this._animationCount = 0;

			if (wait && !motionData.loop) {
				this._waitCount = this.animationWait() * (this.maxPattern() + _compat);
			}
		}
	};

	// wait for the current motion to finish (non-looping only)
	Game_CharacterBase.prototype.waitForMotion = function() {
		var motion = this.motion();
		if (!motion || motion.loop) return;
		var frameWait = this.animationWait();
		var frameCount = this.maxPattern() - this._pattern + _compat;
		var partialFrame = this._animationCount;
		// technically, it just computes the remaining motion duration
		this._waitCount = frameWait * frameCount - partialFrame;
	};

//====================================================================
// Use the active motion instead of normal properties
//====================================================================

	// when a motion is active, you always animate
	var _hasStepAnime = Game_CharacterBase.prototype.hasStepAnime;
	Game_CharacterBase.prototype.hasStepAnime = function() {
		if (this.motion()) {
			return true;
		} else {
			return _hasStepAnime.call(this);
		}
	};

	// override the character index for motions
	var _characterIndex = Game_CharacterBase.prototype.characterIndex;
	Game_CharacterBase.prototype.characterIndex = function() {
		if (this.motion() && this.motion().index >= 0) {
			return this.motion().index;
		} else {
			return _characterIndex.call(this);
		}
	};

	// override the character file for motions (rarely used)
	var _characterName = Game_CharacterBase.prototype.characterName;
	Game_CharacterBase.prototype.characterName = function() {
		var baseName = _characterName.call(this);
		if (baseName !== '' && this.motion() && this.motion().suffix) {
			return baseName + this.motion().suffix;
		} else {
			return baseName;
		}
	};

	// override normal animation wait for motions
	var _animationWait = Game_CharacterBase.prototype.animationWait;
	Game_CharacterBase.prototype.animationWait = function() {
		if (this.motion() && this.motion().wait > 0) {
			return this.motion().wait;
		} else {
			return _animationWait.call(this);
		}
	};

	// update the motion, and reset at the end of a non-looping, non-held motion
	var _updatePattern = Game_CharacterBase.prototype.updatePattern;
	Game_CharacterBase.prototype.updatePattern = function() {
		var motion = this.motion();
		if (motion) {
			if (motion.loop) {
				this._pattern = (this._pattern + 1) % this.maxPattern();
			} else if (this._pattern < this.maxPattern() + _compat - 1) {
				this._pattern++;
			} else if (motion.hold) {
				motion._done = true;
			} else {
				this.clearMotion();
			}
		} else {
			_updatePattern.call(this);
		}
	};
// -----------------------------------------------------------------------------------------

//====================================================================
// Custom in-battle sprites for actors
//====================================================================

	// actors can have different sprites for in-combat
	var _refreshImage = Game_Event.prototype.refreshImage;
	Game_Event.prototype.refreshImage = function() {
		if ($gameSystem.isSRPGMode() && !this.isErased()) {
			var battlerArray = $gameSystem.EventToUnit(this.eventId());
			if (battlerArray && battlerArray[0] == 'actor') {
				var actor = battlerArray[1];
				var suffix = actor.actor().meta.srpgBattleSuffix || '';
				var index = actor.actor().meta.srpgBattleIndex || actor.characterIndex();
				this.setImage(actor.characterName()+suffix, index);
				return;
			}
		}
		_refreshImage.call(this);
	};

//====================================================================
// Handle motions on the whole party at once
//====================================================================

	// check if anyone in the party is playing a motion
	Game_Party.prototype.hasMotion = function() {
		return this.members().some(function(actor) {
			var event = actor.event();
			return event ? event.hasMotion() : false;
		});
	};

	// check if anyone in the party is playing a looping motion
	Game_Party.prototype.hasLoopingMotion = function() {
		return this.members().some(function(actor) {
			var event = actor.event();
			return event ? event.hasLoopingMotion() : false;
		});
	};

	// check if anyone in the party is playing a non-looping motion
	Game_Party.prototype.hasSingleMotion = function() {
		return this.members().some(function(actor) {
			var event = actor.event();
			return event ? event.hasSingleMotion() : false;
		});
	};

	// run a preset motion on the entire party
	Game_Party.prototype.playMotion = function(motion, wait) {
		if (!motion) return;
		this.playCustomMotion(Sprite_Character.MOTIONS[motion.toUpperCase()], wait);
	};

	// run a motion defined on the fly on the entire party
	Game_Party.prototype.playCustomMotion = function(motionData, wait) {
		if (!$gameSystem.isSRPGMode()) return;
		this.members().forEach(function (actor) {
			var event = actor.event();
			if (!event || actor.noMotions()) return;
			event.playCustomMotion(motionData, wait);
		});
	};

	// clear the motions for the whole party
	Game_Party.prototype.clearMotion = function() {
		this.members().forEach(function (actor) {
			var event = actor.event();
			if (event) event.clearMotion();
		});
	};

//====================================================================
// Integrate motions with combat
//====================================================================

	// adjusted motion for reactions (evade / damaged)
	Game_CharacterBase.prototype.playReactMotion = function(motion, wait) {
		var baseMotion = Sprite_Character.MOTIONS[motion.toUpperCase()];
		if (!baseMotion) return;
		var reactMotion = {
			index: baseMotion.index,
			wait: baseMotion.wait,
			loop: baseMotion.loop,
			hold: baseMotion.hold,
			suffix: baseMotion.suffix,
			reaction: true
		};
		this.playCustomMotion(reactMotion, wait);
	}

	// get the motion for a basic attack
	Game_BattlerBase.prototype.mapAttackMotion = function() {
		return _default.attack;
	};
	Game_Actor.prototype.mapAttackMotion = function() {
		var motion = _default.attack
		this.weapons().forEach(function(weapon) {
			if (weapon && weapon.meta.srpgAttackMotion) motion = weapon.meta.srpgAttackMotion;
		});
		return motion;
	};
	Game_Enemy.prototype.mapAttackMotion = function() {
		if (!this.hasNoWeapons()) {
			var weapon = $dataWeapons[this.enemy().meta.srpgWeapon];
			if (weapon && weapon.meta.srpgAttackMotion) return weapon.meta.srpgAttackMotion;
		}
		return _default.attack;
	};

	// play the motions for an action
	var _srpgInvokeMapSkill = Scene_Map.prototype.srpgInvokeMapSkill;
	Scene_Map.prototype.srpgInvokeMapSkill = function(data) {
		var action = data.action;
		var user = data.user;
		var event = user.event();
		if (event && !user.noMotions()) {
			if (data.phase === 'start') {
				var motion = action.item().meta.srpgCastMotion;
				if (motion) event.playMotion(motion);
			} else if (data.phase === 'animation') {
				var motion = action.item().meta.srpgMotion;
				if (motion) event.playMotion(motion);
				else if (action.isAttack() || action.item().meta.useSrpgAttackMotion) event.playMotion(user.mapAttackMotion());
				else if (action.isItem()) event.playMotion(_default.item);
				else if (action.isPhysical()) event.playMotion(_default.physical);
				else if (action.isMagical()) event.playMotion(_default.magical);
				else if (action.isCertainHit()) event.playMotion(_default.certain);
			} else if (data.phase === 'end') {
				event.clearMotion();
			}
		}
		_srpgInvokeMapSkill.call(this, data);
	};

	// special damage effects
	var _srpgShowResults = Game_BattlerBase.prototype.srpgShowResults;
	Game_BattlerBase.prototype.srpgShowResults = function() {
		_srpgShowResults.call(this);
		var result = this.result();

		if (!$gameSystem.useMapBattle()) return;

		var event = this.event();
		if (event && !this.noMotions()) {
			if (result.isHit() && result.hpDamage > 0) event.playReactMotion(_default.damage);
			else if (result.missed || result.evaded) event.playReactMotion(_default.evade);
		}

		if (_shake && result.hpDamage > 0) {
			var damage = result.hpDamage;
			var damageRate = (damage / this.mhp);
			var critical = result.isCritical;

			var power = Math.floor(Number(eval(_shakePower)));
			var speed = Math.floor(Number(eval(_shakeSpeed)));
			var frames = Math.floor(Number(eval(_shakeFrames)));

			$gameScreen.startShake(power, speed, frames);
		}
	};

	// active event shows a running animation
	var _setActiveEvent = Game_Temp.prototype.setActiveEvent;
	Game_Temp.prototype.setActiveEvent = function(event) {
		var oldEvent = $gameTemp.activeEvent();
		_setActiveEvent.call(this, event);
		if (oldEvent) oldEvent.clearMotion();
		if ($gameSystem.EventToUnit(event.eventId())[1].noMotions()) return;
		event.playMotion(_default.selected);
	};
	var _clearActiveEvent = Game_Temp.prototype.clearActiveEvent;
	Game_Temp.prototype.clearActiveEvent = function() {
		var oldEvent = $gameTemp.activeEvent();
		_clearActiveEvent.call(this);
		if (oldEvent) oldEvent.clearMotion();
	};

	// wait for motions to finish before advancing a skill
	var _waitingForSkill = Scene_Map.prototype.waitingForSkill;
	Scene_Map.prototype.waitingForSkill = function() {
		if (this.skillAnimWait()) {
			var active = $gameTemp.activeEvent();
			if (active.hasSingleMotion() && !active.motion().idle && !active.motion().reaction) {
				return true;
			}

			var target = $gameTemp.targetEvent();
			if (target && target.hasSingleMotion() && !target.motion().idle && !target.motion().reaction){
				return true;
			}
		}

		return _waitingForSkill.call(this);
	};

//====================================================================
// State-based Idle Motions (not affected by noMotions)
//====================================================================

	// get idle motions from states
	Game_BattlerBase.prototype.mapIdleMotion = function() {
		for (var i = 0; i < this.states().length; i++) {
			var state = this.states()[i];
			if (state && state.meta.idleMotion) {
				var motion = Sprite_Character.MOTIONS[state.meta.idleMotion.toUpperCase()];
				if (motion != null) {
					return {
						index: motion.index,
						wait: motion.wait,
						loop: motion.loop,
						hold: motion.hold,
						suffix: motion.suffix,
						idle: true
					};
				}
			}
		}
		return null;
	};

	// if the battler has an idle motion, switch back to it any time it clears
	var _clearMotion = Game_CharacterBase.prototype.clearMotion;
	Game_CharacterBase.prototype.clearMotion = function() {
		_clearMotion.call(this);
		if ($gameSystem.isSRPGMode()) {
			var battlerArray = $gameSystem.EventToUnit(this.eventId());
			if (battlerArray) {
				var idleMotion = battlerArray[1].mapIdleMotion();
				if (idleMotion) {
					this.playCustomMotion(idleMotion, false);
				}
			}
		}
	};

	// update the idle motion when a state is added
	var _addState = Game_Battler.prototype.addState;
	Game_Battler.prototype.addState = function(stateId) {
		_addState.call(this, stateId);
		if ($gameSystem.isSRPGMode() && this.event()) {
			if (!this.event().motion() || this.event().motion().idle) {
				var idleMotion = this.mapIdleMotion();
				if (idleMotion) {
					this.event().playCustomMotion(idleMotion, false);
				}
			}
		}
	};

	// Update idle motion as soon as a state is removed
	var _removeState = Game_Battler.prototype.removeState;
	Game_Battler.prototype.removeState = function(stateId) {
		_removeState.call(this, stateId);
		if ($gameSystem.isSRPGMode() && this.event() &&
		this.event().motion() && this.event().motion().idle) {
			this.event().clearMotion();
		}
	};

//====================================================================
// Ignore Motions
//====================================================================

	// check if a battler won't play motions due to a state
	Game_BattlerBase.prototype.noMotions = function() {
		var noMotion = false;
		this.states().forEach(function(state) {
			if (state.meta.noMotions) {
				noMotion = true;
			}
		});
		return noMotion;
	};

	// check if an actor won't play motions due to class or equipment
	Game_Actor.prototype.noMotions = function() {
		if (this.actor().meta.noMotions) return true;
		if (this.currentClass().meta.noMotions) return true;

		var noMotion = false;
		this.equips().forEach(function(item) {
			if (item && item.meta.noMotions) {
				noMotion = true;
			}
		});

		return noMotion || Game_BattlerBase.prototype.noMotions.call(this);
	};

	// check if an enemy won't play motions innately or due to their weapon
	Game_Enemy.prototype.noMotions = function() {
		if (this.enemy().meta.noMotions) return true;

		if (!this.hasNoWeapons()) {
			var weapon = $dataWeapons[this.enemy().meta.srpgWeapon];
			if (weapon && weapon.meta.noMotions) return true;
		}

		return Game_BattlerBase.prototype.noMotions.call(this);
	};
// -------------------------------------------------------------------------------
/**
 * ●SVキャラクターモーションの実行
 * ※NRP_DynamicMotionの関数
 */
	const _Sprite_Character_startDynamicSvMotion = Sprite_Character.prototype.startDynamicSvMotion;
	Sprite_Character.prototype.startDynamicSvMotion = function(dynamicMotion) {
 	   // Game_CharacterBase側で処理する。
   	 this._character.startDynamicSvMotion(dynamicMotion);
	};

/**
 * ●SVキャラクターモーションの実行
 */
	Game_CharacterBase.prototype.startDynamicSvMotion = function(dynamicMotion) {
    	const bm = dynamicMotion.baseMotion;
    	const dm = dynamicMotion;

    	// モーションが取得できなければ終了
    	if (!dm.motion) {
    	    return;
   	}

   	 // eval参照用
   	const a = dm.referenceSubject;
    	const subject = bm.getReferenceSubject();
   	const b = dm.referenceTarget;
    	const repeat = dm.repeat;
    	const r = dm.r;

    	// モーションリセット
    	this._pattern = 0;

    	// モーションパターン
    	this._motionPattern = dm.motionPattern;
    	// モーション開始パターン
    	if (dm.motionStartPattern != undefined) {
        	this._motionStartPattern = eval(dm.motionStartPattern);
    	}

    	// DRQ_EventMotionを呼び出し
    	this.playMotion(dm.motion, dm.motionDuration);
	};

	/**
 	* ●モーション実行
 	* ※DRQ_EventMotionsの関数
 	*/
	const _Game_CharacterBase_playCustomMotion = Game_CharacterBase.prototype.playCustomMotion;
	Game_CharacterBase.prototype.playCustomMotion = function(motionData, wait) {
    	_Game_CharacterBase_playCustomMotion.apply(this, arguments);

    		if (this._motion) {
        		// モーション開始パターンの変更
        		if (this._motionStartPattern) {
            		this._pattern = this._motionStartPattern;
            		this._motionStartPattern = undefined;
        		}
    		}
	};

	/**
 	* ●モーションパターンの更新
 	*/
	const _Game_CharacterBase_updatePattern = Game_CharacterBase.prototype.updatePattern;
	Game_CharacterBase.prototype.updatePattern = function() {
    	const motion = this.motion();
    	if (motion) {
        	// モーションパターンの指定がある場合
        	if (this._motionPattern != undefined) {
            	// 指定式でパターン制御
            	this._pattern = eval(this._motionPattern);
            	// 値がマイナスになった場合はクリア
            	if (this._pattern < 0) {
                	this.clearMotion();
                	this._motionPattern = undefined;
            	}
            	return;
        	}
    	}

    	_Game_CharacterBase_updatePattern.apply(this, arguments);
	};
})();