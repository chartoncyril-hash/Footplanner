// ============================================================
// Exemples de tests à exécuter avec Vitest ou Jest
// (non lancés ici, juste à titre d'exemple)
// ============================================================
import { circleMethodRoundRobin, pickBracketSize } from '../scheduling';

describe('circleMethodRoundRobin', () => {
  test('4 équipes => 3 rounds, chaque équipe joue 1 fois par round', () => {
    const teams = [{id:'a'},{id:'b'},{id:'c'},{id:'d'}];
    const rounds = circleMethodRoundRobin(teams);
    expect(rounds).toHaveLength(3);
    rounds.forEach(round => {
      const ids = round.flat().map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  test('Moins de 2 équipes => pas de match', () => {
    expect(circleMethodRoundRobin([{id:'a'}])).toEqual([]);
    expect(circleMethodRoundRobin([])).toEqual([]);
  });
});

describe('pickBracketSize', () => {
  test('renvoie la plus grande puissance de 2 contenue, max 16', () => {
    expect(pickBracketSize(1)).toBe(0);
    expect(pickBracketSize(2)).toBe(2);
    expect(pickBracketSize(7)).toBe(4);
    expect(pickBracketSize(15)).toBe(8);
    expect(pickBracketSize(20)).toBe(16);
  });
});
