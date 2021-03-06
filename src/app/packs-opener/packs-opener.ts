import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { SemanticRadioGroupOption, SemanticInputErrorLabel } from '../semantic';
import { CardSet } from '../data/types';
import { PacksOpenerService } from '../data';

@Component({
  selector: 'pr-packs-opener',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template,
  styles
})
export class PacksOpenerComponent {
  form : FormGroup;
  options : SemanticRadioGroupOption[] = _.map(_.values<CardSet>(CardSet.list()), (k, v) => ({ label: CardSet.label(k), value: k }));
  errors : SemanticInputErrorLabel = {
    rangeError: 'Should be between 1 and 1000'
  };

  constructor(formBuilder : FormBuilder,
              private openerService : PacksOpenerService) {
    this.form = formBuilder.group({
      amount: [PacksOpenerService.initial.amount, PacksOpenerComponent.between(0, 1000)],
      type: PacksOpenerService.initial.type
    });
  }

  onOpen() {
    this.openerService.next(this.form.value);
  }

  static between(min : number, max : number) {
    return (control : FormControl) => {
      const val = _.parseInt(control.value);
      return min < val && val <= max ? null : { rangeError: true };
    };
  }
}
