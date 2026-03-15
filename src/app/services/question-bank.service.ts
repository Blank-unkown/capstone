import { Injectable } from '@angular/core';
//import { BankQuestion } from '../models/bank-question.model';
import { BankQuestion } from '../pages/question-bank/question-bank.page';

@Injectable({ providedIn: 'root' })
export class QuestionBankService {

  private storageKey = 'questionBank';

  getAll(): BankQuestion[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  saveAll(questions: BankQuestion[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(questions));
  }

  add(question: BankQuestion) {
    const all = this.getAll();
    all.push(question);
    this.saveAll(all);
  }

  addMany(questions: BankQuestion[]) {
  const existing = this.getAll();
  const merged = [...existing, ...questions];
  this.saveAll(merged);
}

  find(filter: Partial<BankQuestion>): BankQuestion[] {
    return this.getAll().filter(q => {
      return Object.entries(filter).every(
        ([key, value]) => (q as any)[key] === value
      );
    });
  }
}
