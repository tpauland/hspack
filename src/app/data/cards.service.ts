import { Injectable } from '@angular/core';
import {
  CardSet, JSONCard, Rarity, ShortRarity, CardClass, ShortRarityDictionary, CardClassDictionary
} from './types';
import { PacksOpenerService } from './packs-opener.service';
import { RandomList } from '../util/random';
import Dictionary = _.Dictionary;
import { ReplaySubject } from 'rxjs';

type Card = JSONCard;
export type CardsAccessor = {
  all : Dictionary<Card>;
  filtered : {
    byRarity : ShortRarityDictionary<Card[]>,
    byClass : CardClassDictionary<Card[]>
  };
  rand : ShortRarityDictionary<RandomList<Card>>;
  target : {
    byRarity : ShortRarityDictionary<number>,
    byClass : CardClassDictionary<number>
  };
  type : CardSet;
}

@Injectable()
export class CardsService {
  filterType : ((type : CardSet) => CardsAccessor) & _.MemoizedFunction;
  currentSet = this.pos.events
    .map(poe => this.filterType(poe.type))
    .multicast(() => new ReplaySubject<CardsAccessor>(1))
    .refCount();
  private _cards = _.filter(require('./cards.json'), (c : Card) => _.includes(CardSet.list(), c.set));

  constructor(private pos : PacksOpenerService) {
    this.filterType = _.memoize(this._filterType);
  }

  private _filterType(type : CardSet) : CardsAccessor {
    const all = _(this._cards)
      .filter({ set: type })
      .transform((res, card) => res[card.name] = card, {})
      .value() as Dictionary<Card>;

    const sortByManaThenName = (obj) => {
      return _.mapValues(obj, (cards) => _.sortBy(cards, ['cost', 'name']));
    };

    const filtered = {
      byRarity: sortByManaThenName(_.transform(
        Rarity.list(),
        (res : {}, r : Rarity) => res[Rarity.short(r)] = _.filter(all, { rarity: r }),
        {}
      )),
      byClass: sortByManaThenName(_.transform(
        CardClass.classList(CardSet.isMSG(type)),
        (res : {}, c : CardClass) => res[c] = _.filter(all, { playerClass: c }),
        {}
      ))
    };

    const rand = _.mapValues<Card[], RandomList<Card>>(filtered.byRarity, f => new RandomList(f)) as
      ShortRarityDictionary<RandomList<Card>>;

    const target = {
      byRarity: _.transform(
        Rarity.shortList(),
        (res : {}, rarity : ShortRarity) => res[rarity] = filtered.byRarity[rarity].length * Rarity.max(rarity),
        {}
      ) as ShortRarityDictionary<number>,
      byClass: _.transform(
        CardClass.classList(CardSet.isMSG(type)),
        (res, klass) => res[klass] = _.reduce(
          filtered.byClass[klass],
          (res : number, { rarity }) => res + Rarity.max(Rarity.short(rarity)),
          0
        ),
        {}
      ) as CardClassDictionary<number>
    };

    return { all, filtered, rand, target, type };
  }
}
