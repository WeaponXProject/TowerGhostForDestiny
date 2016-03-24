tgd.ArmorSelection = function(groups) {
    var self = this;

    self.groups = groups;

    self.armorGroups = ko.observableArray();

    self.armorGroups(_.map(groups, function(items, bucketType) {
        return new tgd.armorGroup(bucketType, items, self.armorGroups);
    }));

    self.selectedItems = ko.computed(function() {
        return _.map(self.armorGroups(), function(group) {
            return group.selectedItem();
        });
    });
    self.combinedStatPoints = ko.computed(function() {
        return tgd.sum(_.map(self.selectedItems(), function(item) {
            return item.getValue("MaxLightCSP");
        }));
    });
	self.bestSets = ko.computed(function(){
		var combos = tgd.cartesianProductOf(_.map(self.selectedItems(), function(item) {
            var itemClone1 = _.clone(item),
                itemClone2 = _.clone(item);
            itemClone1.activeRoll = item.futureRolls[0];
            itemClone2.activeRoll = item.futureRolls[1];
            return [itemClone1, itemClone2];
        }));
        var scoredCombos = _.map(combos, function(items) {
            var tmp = tgd.joinStats(items);
            return {
                set: items,
                stats: tmp,
                statTiers: _.map(_.sortBy(_.keys(tmp)), function(name) {
                    return name.substring(0, 3) + " T" + Math.floor(tmp[name] / tgd.DestinySkillTier);
                }).join(" "),
                score: tgd.sum(_.map(tmp, function(value, key) {
                    var result = Math.floor(value / tgd.DestinySkillTier);
                    return result > 5 ? 5 : result;
                })) + (tgd.sum(_.values(tmp)) / 1000)
            };
        });
        var highestScore = Math.floor(_.max(_.pluck(scoredCombos, 'score')));
		console.log("highestScore", highestScore);
        var bestSets = _.uniq(_.filter(scoredCombos, function(combo) {
            return combo.score >= highestScore;
        }), false, function(combo) {
            return combo.statTiers;
        });
		
		return bestSets;
	});
    self.statTiers = ko.computed(function() {
        return _.map(self.bestSets(), function(combo) {
            return combo.statTiers;
        }).join(", ");
    });
    self.statValues = ko.computed(function() {
        return _.map(self.bestSets(), function(combo) {
            return _.map(combo.stats, function(stat, name) {
				return stat;
			}).join("/");
        }).join(", ");
    });
    self.projectedLightLevel = ko.computed(function() {
        return tgd.DestinyLightCap;
    });
    self.currentLightLevel = ko.computed(function() {
        return 10;
    });
}

tgd.armorGroup = function(bucketType, items, groups) {
    var self = this;

    self.bucketType = bucketType;

    var selectedIndex = 0;

    self.selectedItem = ko.observable();

    self.items = _.map(items, function(item, index) {
        return new tgd.armorItem(item, self.selectedItem, groups);
    });

    self.selectedItem(self.items[selectedIndex]);
}

tgd.armorItem = function(item, selectedItem, groups) {
    var self = this
    _.extend(self, item);
    var isSelected = ko.computed(function() {
        return self == selectedItem();
    });
    var isDisabled = ko.computed(function() {
        //first pass be based on csp, second pass will be based on sum of tiers
        var totalCSP = tgd.sum(_.map(groups(), function(group) {
            return group.bucketType == self.bucketType ? 0 : group.selectedItem().getValue("MaxLightCSP");
        })) + self.getValue("MaxLightCSP");
        return tgd.maxTierPointsPossible >= totalCSP;
        /* the second pass will get an array of selectedItems, concat self, calculate the best statTiers given all the futureRolls available, determine if that fits the maxTierPointsPossible */
    });
    self.css = ko.computed(function() {
        return (isSelected() ? "selected" : "not-selected") + " " + (isDisabled() ? "disabled" : "not-disabled");
    });
    this.select = function() {
        if (isDisabled()) {
            BootstrapDialog.alert("This item cannot be selected to maintain the max tier");
        } else {
            selectedItem(self);
        }
    }
}

/*
combos = tgd.cartesianProductOf(_.map(temp1.selectedItems(), function(item){
var itemClone1 = _.clone(item), itemClone2 = _.clone(item);
itemClone1.activeRoll = item.futureRolls[0];
itemClone2.activeRoll = item.futureRolls[1];
return [ itemClone1, itemClone2 ];
}));
 var scoredCombos = _.map(combos, function(items) {
                        var tmp = tgd.joinStats(items);
                        return {
                            set: items,
                            score: tgd.sum(_.map(tmp, function(value, key) {
                                var result = Math.floor(value / tgd.DestinySkillTier);
                                return result > 5 ? 5 : result;
                            })) + (tgd.sum(_.values(tmp)) / 1000)
                        };
                    });
var highestScore = Math.floor(_.max(_.pluck(scoredCombos, 'score')));
_.each(scoredCombos, function(combo) {
                        if (combo.score >= highestScore) {
                            bestSets.push(combo);
                        }
                    });
*/